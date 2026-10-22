<template>
  <div>
    <p v-if="globalStore.loading">Loading...</p>
    <p v-else-if="globalStore.error">{{ globalStore.error }}</p>
    <p v-else>
      {{ globalStore.questions.length }} questions loaded
      <ul>
        <li
          v-for="question of globalStore.questions"
          :key="question.id"
        >
          {{ question }}
        </li>
      </ul>
    </p>

    <button
      class="rounded-md border border-neutral-500 bg-neutral-300 px-4 py-1 font-semibold transition hover:bg-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600"
      type="button"
      @click="restart"
    >
      Redémarrer
    </button>
  </div>
</template>

<script setup lang="ts">
import { useGlobalStore } from '@/stores/global';

const globalStore = useGlobalStore();

function restart() {
  globalStore.isGameActive = false;
}
</script>
