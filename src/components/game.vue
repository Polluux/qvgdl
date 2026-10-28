<template>
  <main class="grid min-h-dvh grid-cols-[minmax(0,1fr)_5rem] text-white sm:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
    <section class="@container mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-6 sm:px-8 md:px-12">
      <header class="flex items-center justify-center gap-4 landscape:justify-between">
        <div
          class="hidden size-[30dvh] shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-white/30 text-xs text-white/50 landscape:flex"
        >
          QR code
        </div>
        <div
          class="flex aspect-3/2 w-full max-w-[25dvh] items-center justify-center rounded-xl border-2 border-dashed border-white/30 text-xs text-white/50 sm:max-w-[35dvh] md:max-w-[45dvh]"
        >
          Logo
        </div>
      </header>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex gap-2">
          <button
            id="next-question"
            aria-label="Question suivante"
            class="btn-glass btn-icon size-12"
            :class="{ 'animate-pulse bg-indigo-500!': gameState === GAMESTATE.CHECKING && !locked }"
            :disabled="gameState !== GAMESTATE.CHECKING || locked"
            title="Question suivante"
            type="button"
            @click="nextQuestion()"
          >
            <span class="material-symbols-outlined"> arrow_forward </span>
          </button>
          <button
            id="change-question"
            aria-label="Changer la question"
            class="btn-glass btn-icon size-12"
            title="Changer la question"
            type="button"
            @click="changeCurrentQuestion"
          >
            <span class="material-symbols-outlined"> refresh </span>
          </button>
          <button
            id="back-home"
            aria-label="Retour à l'accueil"
            class="btn-glass btn-icon size-12"
            title="Retour à l'accueil"
            type="button"
            @click="restart"
          >
            <span class="material-symbols-outlined"> home </span>
          </button>
        </div>

        <div class="flex gap-2">
          <button
            v-for="joker in jokers"
            :key="joker.id"
            :aria-label="joker.label"
            class="btn-glass btn-icon size-12"
            :class="{ 'btn-glow': !joker.used }"
            :disabled="joker.used || gameState === GAMESTATE.CHECKING"
            :title="joker.label"
            type="button"
            @click="(joker.used = true) && joker.action()"
          >
            <span
              v-if="joker.icon"
              class="material-symbols-outlined"
            >
              {{ joker.icon }}
            </span>
            <span
              v-else
              class="text-sm"
            >
              {{ joker.text }}
            </span>
          </button>
        </div>
      </div>

      <article class="hex-row hex-row-stretch">
        <div class="hex flex flex-col items-start text-xl wrap-anywhere sm:text-2xl">
          <div class="flex w-full justify-between gap-4">
            <p class="mb-2 text-sm tracking-wide text-white/60 uppercase">Question {{ currentStep + 1 }} / {{ questions.length }}</p>
            <button
              v-if="currentQuestion.note"
              aria-label="Afficher la note"
              class="btn-glass size-5 shrink-0 rounded-full p-0 text-sm transition hover:bg-white/20"
              command="show-modal"
              commandfor="modal-info"
              type="button"
            >
              i
            </button>
          </div>
          <p class="text-xl font-semibold sm:text-2xl">{{ currentQuestion.text }}</p>

          <dialog
            id="modal-info"
            ref="modalInfo"
            closedby="any"
          >
            <header class="flex items-center gap-3">
              <span class="material-symbols-outlined text-amber-300">info</span>
              <h2 class="text-lg tracking-wide italic opacity-75">Le saviez-vous ?</h2>
            </header>

            <hr class="modal-divider" />

            <div class="max-h-[60dvh] overflow-y-auto leading-relaxed text-white/90">
              <p>{{ currentQuestion.note }}</p>
            </div>

            <button
              aria-label="Fermer"
              class="btn-glass btn-icon absolute top-0 right-0 size-9 translate-x-1/2 -translate-y-1/2 border-red-300/40 bg-red-700 hover:bg-red-600"
              command="close"
              commandfor="modal-info"
              type="button"
            >
              <span class="material-symbols-outlined">close_small</span>
            </button>
          </dialog>
        </div>
      </article>

      <ul class="grid grid-cols-1 gap-y-3 @2xl:grid-cols-2">
        <li
          v-for="(answer, i) in currentQuestion.answers"
          :key="`${currentQuestion.id}-${answer.label}`"
          class="hex-row hex-row-stretch"
        >
          <button
            :id="`answer_${i}`"
            class="hex justify-start self-stretch text-left text-base wrap-anywhere sm:text-lg"
            :class="answerClass(i)"
            :disabled="gameState === GAMESTATE.CHECKING || hiddenAnswers.includes(i)"
            type="button"
            @click="selectAnswer(i)"
          >
            <span :class="{ invisible: hiddenAnswers.includes(i) }">
              <span class="mr-1 shrink-0 text-amber-300 sm:mr-2 md:mr-3"> {{ 'ABCD'[i] }}&nbsp;:</span>
              {{ answer.label }}
            </span>
          </button>
        </li>
      </ul>
    </section>

    <aside class="sticky top-0 h-dvh self-start border-l border-white/10 bg-black/20 p-2 sm:p-4">
      <ol class="flex h-full flex-col-reverse gap-1 lg:hidden">
        <li
          v-for="(label, i) in stepLabels"
          :key="label"
          :aria-current="i === currentStep ? 'step' : undefined"
          class="flex flex-1 items-center justify-center rounded-lg text-[0.65rem] font-semibold transition-all duration-500 sm:text-sm"
          :class="stepClass(i)"
        >
          {{ label }}
        </li>
      </ol>

      <Beerglass
        :broken="gameState === GAMESTATE.CHECKING && !isCorrect"
        class="hidden h-full w-full lg:block"
        :labels="stepLabels"
        :step="currentStep"
      />

      <p
        aria-live="polite"
        class="sr-only"
      >
        Palier {{ currentStep + 1 }} sur {{ stepLabels.length }} : {{ stepLabels[currentStep] }}
      </p>
    </aside>
  </main>
</template>

<script setup lang="ts">
import { useEventBus } from '@/composables/useEventBus';
import { useSound } from '@/composables/useSound';
import { DIFFICULTY } from '@/services/fetch-questions';
import { useGlobalStore } from '@/stores/global';
import { shuffle } from '@/utils/array';
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';
const { preload, play } = useSound();
const { on } = useEventBus();

import Beerglass from '@/components/beerglass.vue';

const globalStore = useGlobalStore();

enum GAMESTATE {
  PLAYING,
  CHECKING
}

const NB_QUESTIONS_PER_DIFFICULTY: Record<DIFFICULTY, number> = {
  [DIFFICULTY.EASY]: 4,
  [DIFFICULTY.MEDIUM]: 4,
  [DIFFICULTY.HARD]: 4,
  [DIFFICULTY.EXTREME]: 3
};
const STEP_LABEL = [
  '10 cl',
  '15 cl',
  '20 cl',
  'Demi',
  '30 cl',
  '33 cl',
  '44 cl',
  'Pinte',
  '55 cl',
  '60 cl',
  '70 cl',
  'Bouteille',
  '80 cl',
  '90 cl',
  'Champagne'
];

const modalInfo = useTemplateRef<HTMLDialogElement>('modalInfo');
const nextQuestionButton = useTemplateRef<HTMLButtonElement>('nextQuestionButton');

const questions = ref(
  Object.values(DIFFICULTY)
    // Difficulty being an enum, filter to iterate
    .filter((key): key is DIFFICULTY => !isNaN(Number(key)))
    .flatMap((diff) => {
      return globalStore.getQuestions(diff, NB_QUESTIONS_PER_DIFFICULTY[diff]);
    })
);
const selectedAnswer = ref<number | null>(null);
const hiddenAnswers = ref<number[]>([]); // Used only when using split joker
const currentStep = ref(0);
const gameState = ref(GAMESTATE.PLAYING);
const jokers = ref([
  {
    id: 'split',
    icon: '',
    text: '50:50',
    label: 'Supprimer deux mauvaises réponses',
    action: split,
    used: false
  },
  {
    id: 'call_friend',
    icon: 'phone_enabled',
    text: '',
    label: "Demander l'aide d'un ami",
    action: () => {},
    used: false
  },
  {
    id: 'ask_pub',
    icon: 'sports_bar',
    text: '',
    label: "Demander l'avis du barman",
    action: () => {},
    used: false
  }
]);

const maxStep = computed(() => questions.value.length - 1);
const stepLabels = computed(() => STEP_LABEL.slice(0, questions.value.length));
const currentQuestion = computed(() => questions.value[currentStep.value]!);

const isCorrect = computed(() => selectedAnswer.value !== null && !!currentQuestion.value?.answers[selectedAnswer.value]?.correct);
const locked = computed(() => {
  // Game is locked when we are checking results
  return (
    gameState.value === GAMESTATE.CHECKING &&
    // And user is wrong or its the last question
    (!isCorrect.value || currentStep.value === maxStep.value)
  );
});

onMounted(() => {
  globalStore.setAsSeen([currentQuestion.value.id]);

  preload('success.mp3');
  preload('failure.mp3');

  document.addEventListener('keydown', onkeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onkeydown);
});

on('game:force-next-question', () => nextQuestion(true));

function selectAnswer(index: number) {
  if (gameState.value === GAMESTATE.CHECKING || hiddenAnswers.value.includes(index)) return;
  if (selectedAnswer.value === index) {
    validate();
  } else {
    selectedAnswer.value = index;
  }
}

function resetQuestionState() {
  selectedAnswer.value = null;
  hiddenAnswers.value = [];
  gameState.value = GAMESTATE.PLAYING;
  globalStore.setAsSeen([currentQuestion.value.id]);
}

function validate() {
  if (gameState.value === GAMESTATE.CHECKING || hiddenAnswers.value === null) return;
  gameState.value = GAMESTATE.CHECKING;
  play(isCorrect.value ? 'success.mp3' : 'failure.mp3');
}

function nextQuestion(force = false) {
  if (currentStep.value >= maxStep.value) return;
  if (!force && (gameState.value !== GAMESTATE.CHECKING || locked.value)) return;
  currentStep.value++;
  resetQuestionState();
}

function changeCurrentQuestion() {
  const newQ = globalStore.getQuestions(
    currentQuestion.value.difficulty,
    1,
    questions.value.map((q) => q.id)
  );

  if (!newQ.length) return;

  questions.value.splice(currentStep.value, 1, newQ[0]!);

  resetQuestionState();
}

function restart() {
  globalStore.isGameActive = false;
}

function split() {
  const incorrectIndexes = (currentQuestion.value?.answers || []).map((q, i) => (!q.correct ? i : null)).filter((q) => q !== null);
  hiddenAnswers.value = shuffle(incorrectIndexes).slice(0, 2);

  // Unselect current selected answer if incorrect
  if (selectedAnswer.value !== null && hiddenAnswers.value.includes(selectedAnswer.value)) {
    selectedAnswer.value = null;
  }
}

function answerClass(i: number) {
  const selected = selectedAnswer.value === i;

  if (gameState.value === GAMESTATE.CHECKING) {
    if (currentQuestion.value?.answers[i]?.correct) return 'border-emerald-300 bg-emerald-500 text-white';
    if (selected) return 'border-red-300 bg-red-500 text-white';
    return '';
  }
  return selected ? 'border-yellow-200 bg-yellow-500 text-slate-900 [&_span]:text-slate-900' : '';
}

function stepClass(i: number) {
  // Current step either red if invalid or white otherwise
  if (i === currentStep.value) {
    if (gameState.value === GAMESTATE.CHECKING && !isCorrect.value) return 'scale-105 bg-red-500 shadow-lg';
    return 'scale-105 bg-white text-slate-900 shadow-lg';
  }
  // Previous step is white if invalid, to enlight the current prize won
  if (i === currentStep.value - 1 && gameState.value === GAMESTATE.CHECKING && !isCorrect.value) return 'bg-white text-slate-900';
  // Other steps are either yellow or grey
  return i < currentStep.value ? 'bg-amber-300 text-slate-900' : 'bg-white/10 text-white/50';
}

function onkeydown(event: KeyboardEvent) {
  if (modalInfo.value?.open) return;

  if (['Digit1', 'Numpad1'].includes(event.code) || ['a'].includes(event.key)) {
    selectAnswer(0);
    regainFocus(0);
  }
  if (['Digit2', 'Numpad2'].includes(event.code) || ['b'].includes(event.key)) {
    selectAnswer(1);
    regainFocus(1);
  }
  if (['Digit3', 'Numpad3'].includes(event.code) || ['c'].includes(event.key)) {
    selectAnswer(2);
    regainFocus(2);
  }
  if (['Digit4', 'Numpad4'].includes(event.code) || ['d'].includes(event.key)) {
    selectAnswer(3);
    regainFocus(3);
  }
  if (['Space', 'Enter'].includes(event.code)) {
    nextQuestion();
    regainFocus();
  }
}

function regainFocus(answerIndex?: number) {
  // If focus has been removed, gain focus as following order :
  // Answer (playing) -> Next Question (is correct) -> Home (game over)
  setTimeout(() => {
    if (answerIndex !== undefined) {
      document.getElementById(`answer_${answerIndex}`)?.focus();
    }

    const active = document.activeElement as HTMLElement | null;
    const hasLostFocus = !active || active === document.body || !active.isConnected || active.matches(':disabled');
    if (!hasLostFocus) return;

    const btns = document.querySelectorAll('button[id^=answer_]:not(:disabled)');
    if (btns.length) {
      (btns[0] as HTMLElement)!.focus({ focusVisible: true });
    } else {
      (document.querySelector('button[id=next-question]:not(:disabled),button[id=back-home]:not(:disabled)') as HTMLElement)?.focus({ focusVisible: true });
    }
  }, 200);
}
</script>
