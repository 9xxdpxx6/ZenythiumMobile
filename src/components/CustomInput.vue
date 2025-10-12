<template>
  <div class="custom-input-wrapper">
    <label v-if="label" class="custom-input-label">{{ label }}</label>
    <div class="custom-input-container" :class="{ 'focused': isFocused, 'error': hasError }">
      <input
        ref="inputRef"
        :type="type"
        :placeholder="placeholder"
        :value="modelValue"
        :disabled="disabled"
        :required="required"
        class="custom-input"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown.enter="handleEnter"
      />
    </div>
    <div v-if="hasError && errorMessage" class="custom-input-error">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface Props {
  modelValue?: string;
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  errorMessage?: string;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'focus'): void;
  (e: 'blur'): void;
  (e: 'enter'): void;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  required: false,
  error: false,
});

const emit = defineEmits<Emits>();

const inputRef = ref<HTMLInputElement>();
const isFocused = ref(false);

const hasError = computed(() => props.error);

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};

const handleFocus = () => {
  isFocused.value = true;
  emit('focus');
};

const handleBlur = () => {
  isFocused.value = false;
  emit('blur');
};

const handleEnter = () => {
  emit('enter');
};

// Методы для внешнего использования
const focus = () => {
  inputRef.value?.focus();
};

const blur = () => {
  inputRef.value?.blur();
};

defineExpose({
  focus,
  blur,
});
</script>

<style scoped>
.custom-input-wrapper {
  margin: 16px 0;
}

.custom-input-label {
  display: block;
  color: var(--ion-text-color);
  font-weight: 500;
  margin-bottom: 8px;
  font-size: 14px;
}

.custom-input-container {
  position: relative;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease;
  height: 48px;
  display: flex;
  align-items: center;
}

.custom-input-container.focused {
  border-color: var(--ion-color-primary);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.custom-input-container.error {
  border-color: var(--ion-color-danger);
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}

.custom-input {
  width: 100%;
  height: 100%;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: var(--ion-text-color);
  font-size: 16px;
  outline: none;
  border-radius: 12px;
  box-sizing: border-box;
}

.custom-input::placeholder {
  color: var(--ion-color-medium);
}

.custom-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.custom-input-error {
  margin-top: 4px;
  color: var(--ion-color-danger);
  font-size: 12px;
  font-weight: 500;
}

/* Темная тема */
@media (prefers-color-scheme: dark) {
  .custom-input-container {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .custom-input-container.focused {
    border-color: var(--ion-color-primary);
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
  }
  
  .custom-input-container.error {
    border-color: var(--ion-color-danger);
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
  }
}
</style>
