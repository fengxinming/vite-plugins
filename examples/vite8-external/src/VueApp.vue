<script setup lang="ts">
import { computed, ref } from 'vue';

const count = ref(0);
const label = computed(() => 'Hello from vite-plugin-external + Vue');
</script>

<template>
  <div class="vue-app">
    <p>{{ label }}</p>
    <button type="button" @click="count++">count is {{ count }}</button>
  </div>
</template>
