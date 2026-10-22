<template>
  <div class="relative isolate min-h-dvh">
    <Lockscreen v-if="!globalStore.isUnlocked" />

    <template v-else>
      <div
        aria-hidden="true"
        class="fixed inset-0 -z-20 bg-gradient-to-b from-indigo-100 via-indigo-50 to-white"
      />
      <div
        aria-hidden="true"
        class="fixed inset-0 -z-10 bg-gradient-to-b from-indigo-200 to-indigo-300 transition-opacity duration-1000 motion-reduce:transition-none"
        :class="globalStore.isGameActive ? 'opacity-100' : 'opacity-0'"
      />

      <Transition
        enter-active-class="transition-opacity duration-500 motion-reduce:transition-none"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-300 motion-reduce:transition-none"
        leave-to-class="opacity-0"
        mode="out-in"
      >
        <Homepage v-if="!globalStore.isGameActive" />
        <Game v-else> </Game>
      </Transition>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { watch } from 'vue';
import { useGlobalStore } from '@/stores/global';

import Lockscreen from '@/components/lockscreen.vue';
import Homepage from '@/components/homepage.vue';
import Game from '@/components/game.vue';

const globalStore = useGlobalStore();

watch(
  () => globalStore.isUnlocked,
  () => globalStore.load()
);
</script>
