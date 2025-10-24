<template>
  <div class="empty-state">
    <i v-if="icon" :class="icon" class="empty-icon"></i>
    <h2 v-if="title">{{ title }}</h2>
    <p v-if="message">{{ message }}</p>
    <slot name="action">
      <button 
        v-if="actionText && actionHandler"
        @click="actionHandler"
        class="modern-button"
      >
        <i v-if="actionIcon" :class="actionIcon"></i>
        {{ actionText }}
      </button>
    </slot>
  </div>
</template>

<script setup lang="ts">
interface Props {
  icon?: string;
  title?: string;
  message?: string;
  actionText?: string;
  actionIcon?: string;
  actionHandler?: () => void;
}

withDefaults(defineProps<Props>(), {
  icon: 'fas fa-inbox',
  title: 'Пусто',
  message: 'Данные отсутствуют'
});
</script>

<style scoped>
/* Styles are handled by utilities.css */
</style>
