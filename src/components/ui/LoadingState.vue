<template>
  <div class="loading-state">
    <ion-spinner name="crescent"></ion-spinner>
    <p>{{ message || 'Загрузка...' }}</p>
  </div>
</template>

<script setup lang="ts">
import { IonSpinner } from '@ionic/vue';

interface Props {
  message?: string;
}

withDefaults(defineProps<Props>(), {
  message: 'Загрузка...'
});
</script>

<style scoped>
/* Styles are handled by utilities.css */
</style>
