<script setup lang="ts">
   import { ref, version } from 'vue';
 
   const count = ref(0);
</script>

<template>
  <div class="box">
    <p>{{version}}</p>
    <h1>Count: {{count}}</h1>
    <button @click="count++">Click me</button>
  </div>
</template>