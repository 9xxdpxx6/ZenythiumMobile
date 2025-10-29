<template>
  <div class="loading-state">
    <ion-spinner name="crescent"></ion-spinner>
    <p>{{ message || 'Поиск...' }}</p>
  </div>
</template>

<script setup lang="ts">
import { IonSpinner } from '@ionic/vue';

interface Props {
  message?: string;
}

withDefaults(defineProps<Props>(), {
  message: 'Поиск...'
});
</script>

<style scoped>
/* Styles are handled by utilities.css */
</style>
