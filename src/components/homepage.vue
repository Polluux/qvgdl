<template>
  <main class="relative flex min-h-dvh flex-col items-center justify-center gap-10 bg-gradient-to-b from-indigo-50 to-white px-6 pt-10 pb-32 sm:gap-14">
    <div
      aria-label="Logo"
      class="flex h-40 w-40 items-center justify-center rounded-3xl border-2 border-dashed border-indigo-300 text-sm text-indigo-400 sm:h-56 sm:w-56 md:h-64 md:w-64"
    >
      Logo
    </div>

    <button
      class="rounded-full bg-indigo-600 px-10 py-4 text-xl font-semibold text-white shadow-lg transition hover:bg-indigo-500 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600 active:scale-95 sm:px-14 sm:py-5 sm:text-2xl"
      type="button"
      @click="start"
    >
      Démarrer une partie
    </button>

    <div
      aria-label="QR code vers la page de contact"
      class="absolute right-6 bottom-6 hidden h-32 w-32 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white p-1 text-center text-xs text-slate-400 sm:flex md:h-36 md:w-36"
    >
      QR code
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useGlobalStore } from '@/stores/global';
import { useSound } from '@/composables/useSound';

const globalStore = useGlobalStore();
const { preload, play } = useSound();

onMounted(() => preload('start.mp3'));

function start() {
  // play('start.mp3', 0.6);
  globalStore.isGameActive = true;
}
</script>
