const cache = new Map<string, HTMLAudioElement>();

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
    const audio = getAudio(file);
    audio.volume = volume;
    audio.currentTime = 0;
    audio.play().catch((e) => console.warn('Unable to play audio file', e));
  }

  return { preload, play };
}
