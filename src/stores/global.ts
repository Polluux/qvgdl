import { defineStore } from 'pinia';
import { ref } from 'vue';
import { fetchQuestions } from '@/services/fetch-questions';
import type { Question } from '@/types/question';

export const useGlobalStore = defineStore('global', () => {
  const isUnlocked = ref(false);
  const questions = ref<Question[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const isGameActive = ref(false);
  const muted = ref(false);

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

  return {
    isUnlocked,
    questions,
    loading,
    error,
    isGameActive,
    muted,
    load
  };
});
