<template>
  <div class="custom-textarea-wrapper">
    <label v-if="label" class="custom-textarea-label">{{ label }}</label>
    <div class="custom-textarea-container" :class="{ 'focused': isFocused, 'error': hasError }">
      <textarea
        ref="textareaRef"
        :placeholder="placeholder"
        :value="modelValue"
        :disabled="disabled"
        :required="required"
        :rows="rows"
        class="custom-textarea"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
      ></textarea>
    </div>
    <div v-if="hasError && errorMessage" class="custom-textarea-error">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface Props {
  modelValue?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  errorMessage?: string;
  rows?: number;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'focus'): void;
  (e: 'blur'): void;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  required: false,
  error: false,
  rows: 3,
});

const emit = defineEmits<Emits>();

const textareaRef = ref<HTMLTextAreaElement>();
const isFocused = ref(false);

const hasError = computed(() => props.error);

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
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

// Методы для внешнего использования
const focus = () => {
  textareaRef.value?.focus();
};

const blur = () => {
  textareaRef.value?.blur();
};

defineExpose({
  focus,
  blur,
});
</script>

<style scoped>
.custom-textarea-wrapper {
  margin: 16px 0;
}

.custom-textarea-label {
  display: block;
  color: var(--ion-text-color);
  font-weight: 500;
  margin-bottom: 8px;
  font-size: 14px;
}

.custom-textarea-container {
  position: relative;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease;
  min-height: 80px;
}

.custom-textarea-container.focused {
  border-color: var(--ion-color-primary);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.custom-textarea-container.error {
  border-color: var(--ion-color-danger);
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}

.custom-textarea {
  width: 100%;
  min-height: 80px;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: var(--ion-text-color);
  font-size: 16px;
  outline: none;
  border-radius: 12px;
  box-sizing: border-box;
  resize: vertical;
  font-family: inherit;
  line-height: 1.4;
}

.custom-textarea::placeholder {
  color: var(--ion-color-medium);
}

.custom-textarea:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.custom-textarea-error {
  margin-top: 4px;
  color: var(--ion-color-danger);
  font-size: 12px;
  font-weight: 500;
}

/* Темная тема */
@media (prefers-color-scheme: dark) {
  .custom-textarea-container {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .custom-textarea-container.focused {
    border-color: var(--ion-color-primary);
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
  }
  
  .custom-textarea-container.error {
    border-color: var(--ion-color-danger);
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
  }
}
</style>
