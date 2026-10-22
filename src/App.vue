<template>
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
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useGlobalStore } from '@/stores/global';

const globalStore = useGlobalStore();
onMounted(() => globalStore.load());
</script>
