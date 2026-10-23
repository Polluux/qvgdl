<template>
  <div class="relative isolate min-h-dvh">
    <Lockscreen v-if="!globalStore.isUnlocked" />

    <template v-else>
      <div
        aria-hidden
        class="bubble-mesh fixed inset-0 -z-20"
      />
      <div
        aria-hidden="true"
        class="gradient-mesh fixed inset-0 -z-10 transition-opacity duration-1000"
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

    <button
      class="btn-glass btn-icon fixed top-2 left-2 size-10"
      type="button"
      @click="globalStore.muted = !globalStore.muted"
    >
      <span class="material-symbols-outlined text-base!">{{ globalStore.muted ? 'volume_off' : 'volume_up' }}</span>
    </button>
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
