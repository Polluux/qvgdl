<template>
  <div class="fixed top-2 left-2 z-20 grid gap-2">
    <button
      class="btn-glass btn-icon size-10"
      :title="isOpen ? 'Fermer le menu' : 'Ouvrir le menu'"
      type="button"
      @click="isOpen = !isOpen"
    >
      <span class="material-symbols-outlined text-base!">{{ isOpen ? 'keyboard_arrow_up' : 'settings' }}</span>
    </button>
    <Transition
      enter-active-class="transition-all duration-500 motion-reduce:transition-none"
      enter-from-class="opacity-0 -translate-y-[50%]"
      leave-active-class="transition-all duration-300 motion-reduce:transition-none"
      leave-to-class="opacity-0 -translate-y-[50%]"
      mode="out-in"
    >
      <template v-if="isOpen">
        <div class="grid gap-2">
          <button
            class="btn-glass btn-icon size-10"
            :title="globalStore.muted ? 'Activer le son' : 'Couper le son'"
            type="button"
            @click="globalStore.muted = !globalStore.muted"
          >
            <span class="material-symbols-outlined text-base!">{{ globalStore.muted ? 'volume_off' : 'volume_up' }}</span>
          </button>
          <button
            v-if="globalStore.isGameActive"
            class="btn-glass btn-icon size-10"
            title="Passer à la question suivante"
            type="button"
            @click="forceNextQuestion"
          >
            <span class="material-symbols-outlined text-base!">{{ 'skip_next' }}</span>
          </button>
        </div>
      </template>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useEventBus } from '@/composables/useEventBus';
import { useGlobalStore } from '@/stores/global';
import { ref } from 'vue';
const globalStore = useGlobalStore();
const { emit } = useEventBus();

const isOpen = ref(false);

function forceNextQuestion() {
  emit('game:force-next-question');
}
</script>
