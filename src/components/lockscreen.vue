<template>
  <main class="relative flex min-h-dvh items-center justify-center pt-10 pb-32">
    <form
      class="flex flex-col items-center justify-center rounded-md border border-neutral-500 bg-blue-50 p-5"
      @submit.prevent="submit"
    >
      <input
        v-model="password"
        class="border bg-white"
        type="password"
      />
      <p
        v-if="invalid"
        class="text-sm text-red-500"
        role="alert"
      >
        Mot de passe incorrect
      </p>
      <button
        class="mt-4 border px-2"
        type="submit"
      >
        Valider
      </button>
    </form>
  </main>
</template>

<script setup lang="ts">
import { inject, onMounted, ref } from 'vue';

const password = ref('');
const invalid = ref(false);

const { unlock } = inject('lockscreen');

onMounted(() => {
  if (import.meta.env.DEV === true) unlock();
});

function submit() {
  if (password.value === import.meta.env.VITE_SECURITY_PASSPHRASE) {
    unlock();
  } else {
    invalid.value = true;
  }
}
</script>
