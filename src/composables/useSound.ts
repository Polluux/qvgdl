import { useGlobalStore } from '@/stores/global';

const cache = new Map<string, HTMLAudioElement>();

export interface SoundLoop {
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

function getAudio(file: string): HTMLAudioElement {
  let audio = cache.get(file);
  if (!audio) {
    // BASE_URL handles GitHub Pages file tree
    audio = new Audio(`${import.meta.env.BASE_URL}audio/${file}`);
    audio.preload = 'auto';
    cache.set(file, audio);
  }
  return audio;
}

export function useSound() {
  // Preloading sounds to avoid latency on first play
  function preload(...files: string[]) {
    files.forEach(getAudio);
  }

  function play(file: string, volume = 1) {
    const globalStore = useGlobalStore();
    if (globalStore.muted) return;

    const audio = getAudio(file);
    audio.volume = volume;
    audio.currentTime = 0;
    audio.play().catch((e) => console.warn('Unable to play audio file', e));
  }

  function playLoop(file: string, volume = 1): SoundLoop {
    const globalStore = useGlobalStore();

    const audio = new Audio(getAudio(file).src);
    audio.loop = true;
    audio.volume = volume;

    let stopped = false;
    let userPaused = false;
    let removeInteractionListeners: (() => void) | null = null;

    // Events that grant "user activation" and unlock audio
    const UNLOCK_EVENTS = ['pointerdown', 'pointerup', 'touchend', 'keydown'] as const;

    function waitForInteraction() {
      if (removeInteractionListeners) return; // already waiting

      const handler = () => {
        removeInteractionListeners?.();
        tryPlay(); // retry; if still blocked, we wait again
      };

      UNLOCK_EVENTS.forEach((evt) => window.addEventListener(evt, handler));
      removeInteractionListeners = () => {
        UNLOCK_EVENTS.forEach((evt) => window.removeEventListener(evt, handler));
        removeInteractionListeners = null;
      };
    }

    function tryPlay() {
      if (stopped || userPaused || globalStore.muted) return;
      audio.play().catch((e) => {
        if (e.name === 'NotAllowedError') {
          waitForInteraction(); // blocked by autoplay policy: retry on first interaction
        } else if (e.name !== 'AbortError') {
          console.warn('Unable to play audio file', e);
        }
      });
    }

    function pause() {
      userPaused = true;
      removeInteractionListeners?.();
      audio.pause();
    }

    function resume() {
      userPaused = false;
      tryPlay();
    }

    function stop() {
      if (stopped) return;
      stopped = true;
      removeInteractionListeners?.();
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }

    tryPlay();

    return { pause, resume, stop };
  }

  return { preload, play, playLoop };
}
