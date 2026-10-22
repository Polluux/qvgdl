<template>
  <main class="grid min-h-dvh grid-cols-[1fr_5rem] text-white md:grid-cols-[3fr_1fr]">
    <section class="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-6 sm:px-8 md:px-12">
      <header class="flex items-center justify-between">
        <div class="flex size-64 items-center justify-center rounded-xl border-2 border-dashed border-white/30 text-xs text-white/50">QR code</div>
        <div class="flex h-64 w-128 items-center justify-center rounded-xl border-2 border-dashed border-white/30 text-xs text-white/50">Logo</div>
      </header>

      <template v-if="currentQuestion">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex gap-2">
            <button
              aria-label="Question suivante"
              class="relative flex size-12 items-center justify-center rounded-full border border-white/20 bg-white/10 transition enabled:hover:bg-white/25 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
              :class="{ 'animate-pulse bg-emerald-500!': gameState === GAMESTATE.CHECKING && !locked }"
              :disabled="gameState !== GAMESTATE.CHECKING || locked"
              title="Question suivante"
              type="button"
              @click="nextQuestion"
            >
              &gt;
            </button>
            <button
              aria-label="Changer la question"
              class="relative flex size-12 items-center justify-center rounded-full border border-white/20 bg-white/10 transition enabled:hover:bg-white/25 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
              :disabled="!replacementPool.length"
              title="Changer la question"
              type="button"
              @click="changeCurrentQuestion"
            >
              o
            </button>
            <button
              aria-label="Retour à l'accueil"
              class="relative flex size-12 items-center justify-center rounded-full border border-white/20 bg-white/10 transition enabled:hover:bg-white/25 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
              title="Retour à l'accueil"
              type="button"
              @click="restart"
            >
              &lt;
            </button>
          </div>

          <div class="flex gap-2">
            <button
              v-for="joker in jokers"
              :key="joker.id"
              :aria-label="joker.label"
              class="relative flex size-12 items-center justify-center rounded-full border border-white/20 bg-white/10 transition enabled:hover:bg-white/25 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
              :disabled="joker.used || gameState === GAMESTATE.CHECKING"
              :title="joker.label"
              type="button"
              @click="(joker.used = true) && joker.action"
            >
              {{ joker.icon }}
            </button>
          </div>
        </div>

        <article class="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-md sm:p-8">
          <p class="mb-2 text-sm tracking-wide text-white/60 uppercase">Question {{ currentStep + 1 }} / {{ questions.length }}</p>
          <div class="flex items-start justify-between gap-4">
            <p class="text-xl font-semibold sm:text-2xl">{{ currentQuestion.text }}</p>
            <button
              v-if="currentQuestion.note"
              :aria-expanded="showNote"
              aria-label="Afficher la note"
              class="shrink-0 rounded-full p-2 transition hover:bg-white/20"
              type="button"
              @click="showNote = !showNote"
            >
              i
            </button>
          </div>
          <p
            v-if="showNote"
            class="mt-4 rounded-xl bg-black/20 p-4 text-sm text-white/80"
          >
            {{ currentQuestion.note }}
          </p>
        </article>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            v-for="(answer, i) in currentQuestion.answers"
            :key="`${currentQuestion.id}-${answer.label}`"
            class="flex items-center rounded-2xl border px-4 py-4 text-left text-base font-medium transition sm:text-lg"
            :class="answerClass(i)"
            :disabled="gameState === GAMESTATE.CHECKING || hiddenAnswers.includes(i)"
            type="button"
            @click="selectAnswer(i)"
          >
            <span class="mr-3 font-bold opacity-60">{{ 'ABCD'[i] }}</span>
            {{ answer.label }}
          </button>
        </div>
      </template>

      <div
        v-else
        class="rounded-2xl bg-red-500/20 p-6 text-center"
      >
        <p>Aucune question disponible.</p>
        <button
          class="mt-4 underline"
          type="button"
          @click="restart"
        >
          Retour à l'accueil
        </button>
      </div>
    </section>

    <aside class="sticky top-0 h-dvh self-start border-l border-white/10 bg-black/20 p-2 sm:p-4">
      <ol class="flex h-full flex-col-reverse gap-1">
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
    </aside>
  </main>
</template>

<script setup lang="ts">
import { DIFFICULTY } from '@/services/fetch-questions';
import { useGlobalStore } from '@/stores/global';
import type { Question } from '@/types/question';
import { pickRandom, shuffle } from '@/utils/array';
import { computed, ref } from 'vue';

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

const questions = ref(
  Object.values(DIFFICULTY).flatMap((diff) => {
    return shuffle((JSON.parse(JSON.stringify(globalStore.questions)) as Question[]).filter((q) => q.difficulty === diff))
      .slice(0, NB_QUESTIONS_PER_DIFFICULTY[diff as DIFFICULTY])
      .map((q) => {
        return { ...q, answers: shuffle(q.answers) };
      });
  })
);
const discardedIds = ref<string[]>([]); // Questions discarded through action "change current question"
const selectedAnswer = ref<number | null>(null);
const hiddenAnswers = ref<number[]>([]); // Used only when using split joker
const currentStep = ref(0);
const gameState = ref(GAMESTATE.PLAYING);
const showNote = ref(false);
const jokers = ref([
  {
    id: 'split',
    icon: '/',
    label: 'Supprimer deux mauvaises réponses',
    action: split,
    used: false
  },
  {
    id: 'call_friend',
    icon: 'A',
    label: "Demander l'aide d'un ami",
    action: () => {},
    used: false
  },
  {
    id: 'ask_pub',
    icon: 'B',
    label: "Demander l'avis du barman",
    action: () => {},
    used: false
  }
]);

const maxStep = computed(() => questions.value.length - 1);
const stepLabels = computed(() => STEP_LABEL.slice(0, questions.value.length));
const currentQuestion = computed(() => questions.value[currentStep.value]);

// Used when trying to change the current question
const replacementPool = computed(() => {
  const taken = new Set([...questions.value.map((q) => q.id), ...discardedIds.value]);
  return globalStore.questions.filter((q) => q.difficulty === currentQuestion.value?.difficulty && !taken.has(q.id));
});

const isCorrect = computed(() => selectedAnswer.value !== null && !!currentQuestion.value?.answers[selectedAnswer.value]?.correct);
const locked = computed(() => {
  // Game is locked when we are checking results
  return (
    gameState.value === GAMESTATE.CHECKING &&
    // And user is wrong or its the last question
    (!isCorrect.value || currentStep.value === maxStep.value)
  );
});

function selectAnswer(index: number) {
  if (gameState.value === GAMESTATE.CHECKING || hiddenAnswers.value.includes(index)) return;
  if (selectedAnswer.value === index) {
    validate();
  } else {
    selectedAnswer.value = index;
  }
}

function resetQuestionState() {
  showNote.value = false;
  selectedAnswer.value = null;
  hiddenAnswers.value = [];
  gameState.value = GAMESTATE.PLAYING;
}

function validate() {
  if (gameState.value === GAMESTATE.CHECKING || hiddenAnswers.value === null) return;
  gameState.value = GAMESTATE.CHECKING;
  // TODO: play(isCorrect.value ? 'win.mp3' : 'loose.mp3');
}

function nextQuestion() {
  if (gameState.value !== GAMESTATE.CHECKING || locked.value) return;
  // TODO: play('next.mp3');
  resetQuestionState();
  currentStep.value++;
}

function changeCurrentQuestion() {
  const newQuestion = pickRandom(replacementPool.value);
  if (!newQuestion) return;

  discardedIds.value.push(currentQuestion.value!.id);
  questions.value.splice(currentStep.value, 1, { ...newQuestion, answers: shuffle(newQuestion.answers) });

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
  if (hiddenAnswers.value.includes(i)) return 'invisible';
  const selected = selectedAnswer.value === i;

  if (gameState.value === GAMESTATE.CHECKING) {
    if (currentQuestion.value?.answers[i]?.correct) return 'border-emerald-300 bg-emerald-500 text-white';
    if (selected) return 'border-red-300 bg-red-500 text-white';
    return 'border-white/10 bg-white/5 opacity-50';
  }
  return selected ? 'border-yellow-200 bg-yellow-400 text-slate-900' : 'border-white/20 bg-white/10 hover:bg-white/20 active:scale-[0.98]';
}

function stepClass(i: number) {
  if (i === currentStep.value) {
    if (gameState.value === GAMESTATE.CHECKING) return isCorrect.value ? 'scale-105 bg-emerald-500 shadow-lg' : 'scale-105 bg-red-500 shadow-lg';
    return 'scale-105 bg-amber-300 text-slate-900 shadow-lg';
  }
  return i < currentStep.value ? 'bg-amber-500/60 text-white' : 'bg-white/10 text-white/50';
}
</script>
