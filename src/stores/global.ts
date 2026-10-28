import { defineStore } from 'pinia';
import { ref } from 'vue';
import { DIFFICULTY, fetchQuestions } from '@/services/fetch-questions';
import type { Question } from '@/types/question';
import { shuffle } from '@/utils/array';

export const useGlobalStore = defineStore('global', () => {
  // == Global State ==
  const isUnlocked = ref(false);
  const isGameActive = ref(false);
  const muted = ref(import.meta.env.DEV === true); // Default muted for dev
  // == Loading State ==
  const loading = ref(false);
  const error = ref<string | null>(null);
  // == Questions ==
  const questions = ref<Question[]>([]);
  const alreadySeen = ref<string[]>([]);

  async function load() {
    if (questions.value.length || loading.value) return;
    loading.value = true;
    error.value = null;
    try {
      questions.value = await fetchQuestions();
    } catch (e) {
      console.error(e);
      error.value = e instanceof Error ? e.message : 'Unknown error';
    } finally {
      loading.value = false;
    }
  }

  function remainingPool(difficulty: DIFFICULTY, idsToExclude: string[] = []) {
    const excludedIds = new Set([...alreadySeen.value, ...idsToExclude]);

    return shuffle(
      JSON.parse(
        JSON.stringify(
          questions.value.filter((q) => {
            return q.difficulty === difficulty && !excludedIds.has(q.id);
          })
        )
      ) as Question[]
    );
  }

  function resetDifficultyPool(difficulty: DIFFICULTY) {
    // Remove ids of selected difficulty from the alreadySeen list, allowing them in the remainingPool
    alreadySeen.value = alreadySeen.value.filter((v) => {
      return questions.value.some((q) => q.id === v && q.difficulty !== difficulty);
    });
  }

  function getQuestions(difficulty: DIFFICULTY, count: number, idsToExclude: string[] = []) {
    let pool = remainingPool(difficulty, idsToExclude);
    // If not enough questions in the remaining pool, reset it
    if (pool.length < count) resetDifficultyPool(difficulty);
    // Re-do pool with what was left + some new data from the reseted pool
    pool = [...pool, ...remainingPool(difficulty, [...idsToExclude, ...pool.map((q) => q.id)])];
    // Asking too many questions for the available questions
    if (pool.length < count) {
      console.error(`There is not enough questions of difficulty ${difficulty}, asking for ${count}.`);
    }

    const pickedQuestions = pool.slice(0, Math.min(count, pool.length)).map((q) => {
      return { ...q, answers: shuffle(q.answers) };
    });

    return pickedQuestions;
  }

  function setAsSeen(questionIds: string[]) {
    alreadySeen.value.push(...questionIds);
  }

  return {
    isUnlocked,
    isGameActive,
    muted,
    loading,
    error,
    load,
    questions,
    getQuestions,
    setAsSeen
  };
});
