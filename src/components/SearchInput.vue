<template>
  <div class="search-container">
    <div class="search-input-wrapper">
      <i class="fas fa-search search-icon"></i>
      <ion-input
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        type="text"
        :placeholder="placeholder"
        class="search-input"
        @ionInput="handleInput"
      ></ion-input>
      <button 
        v-if="modelValue" 
        @click="clearSearch" 
        class="clear-search-button"
      >
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonInput } from '@ionic/vue';

interface Props {
  modelValue: string;
  placeholder?: string;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'search', value: string): void;
  (e: 'clear'): void;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Поиск...'
});

const emit = defineEmits<Emits>();

const handleInput = (event: CustomEvent) => {
  const value = (event.target as HTMLInputElement).value;
  emit('update:modelValue', value);
  emit('search', value);
};

const clearSearch = () => {
  emit('update:modelValue', '');
  emit('clear');
};
</script>

<style scoped>
.search-container {
  margin: 16px 0 20px 0;
}

/* Для модалов - уменьшенные отступы */
.modal-content .search-container {
  margin: 0 0 16px 0;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 0 16px;
  height: 48px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.search-input-wrapper:focus-within {
  border-color: var(--ion-color-primary);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.search-icon {
  color: var(--ion-color-medium);
  font-size: 16px;
  margin-right: 12px;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  --padding-start: 0 !important;
  --padding-end: 0 !important;
  --background: transparent !important;
  --color: var(--ion-text-color) !important;
  --placeholder-color: var(--ion-color-medium) !important;
  --border-width: 0 !important;
  --border-style: none !important;
  --border-color: transparent !important;
  --highlight-color: transparent !important;
  --highlight-color-focused: transparent !important;
  border: none !important;
  box-shadow: none !important;
  font-size: 16px;
}

.search-input::part(native) {
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
}

.search-input::part(underline) {
  display: none !important;
}

.clear-search-button {
  background: none;
  border: none;
  color: var(--ion-color-medium);
  font-size: 16px;
  padding: 8px;
  margin-left: 8px;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  transition: all 0.2s ease;
}

.clear-search-button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--ion-text-color);
}
</style>
