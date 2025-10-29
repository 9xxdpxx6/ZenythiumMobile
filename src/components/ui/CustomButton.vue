<template>
  <button
    :class="buttonClasses"
    :disabled="disabled"
    @click="handleClick"
  >
    <i v-if="icon" :class="icon" class="button-icon"></i>
    <span v-if="$slots.default" class="button-text">
      <slot></slot>
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue';

interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'medium';
  size?: 'small' | 'medium' | 'large';
  expand?: boolean;
  disabled?: boolean;
  icon?: string;
  iconPosition?: 'start' | 'end';
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  color: 'primary',
  size: 'medium',
  expand: false,
  disabled: false,
  iconPosition: 'start'
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const slots = useSlots();

const buttonClasses = computed(() => {
  const classes = ['custom-button'];
  
  classes.push(`button-${props.variant}`);
  classes.push(`button-${props.color}`);
  classes.push(`button-${props.size}`);
  
  if (props.expand) {
    classes.push('button-expand');
  }
  
  if (props.disabled) {
    classes.push('button-disabled');
  }
  
  if (props.icon && !slots.default) {
    classes.push('button-icon-only');
  }
  
  return classes.join(' ');
});

const handleClick = (event: MouseEvent) => {
  if (!props.disabled) {
    emit('click', event);
  }
};
</script>

<style scoped>
.custom-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  outline: none;
  position: relative;
  overflow: hidden;
}

.custom-button:focus-visible {
  box-shadow: 0 0 0 2px var(--ion-color-primary);
}

.custom-button:active {
  transform: translateY(1px);
}

/* Variants */
.button-primary {
  background: var(--ion-color-primary);
  color: white;
}

.button-primary:hover:not(.button-disabled) {
  background: var(--ion-color-primary-shade);
}

.button-secondary {
  background: var(--ion-color-secondary);
  color: white;
}

.button-secondary:hover:not(.button-disabled) {
  background: var(--ion-color-secondary-shade);
}

.button-outline {
  background: transparent;
  border: 1px solid var(--ion-color-primary);
}

.button-outline:hover:not(.button-disabled) {
  background: var(--ion-color-primary);
  color: white;
}

/* Color variants for outline */
.button-outline.button-primary {
  color: var(--ion-color-primary);
  border-color: var(--ion-color-primary);
}

.button-outline.button-primary:hover:not(.button-disabled) {
  background: var(--ion-color-primary);
  color: white;
}

.button-outline.button-warning {
  color: var(--ion-color-warning) !important;
  border-color: var(--ion-color-warning) !important;
  background: transparent !important;
}

.button-outline.button-warning:hover:not(.button-disabled) {
  background: var(--ion-color-warning) !important;
  color: white !important;
}

.button-outline.button-danger {
  color: var(--ion-color-danger) !important;
  border-color: var(--ion-color-danger) !important;
  background: transparent !important;
}

.button-outline.button-danger:hover:not(.button-disabled) {
  background: var(--ion-color-danger) !important;
  color: white !important;
}

.button-ghost {
  background: transparent;
  color: var(--ion-color-primary);
}

.button-ghost:hover:not(.button-disabled) {
  background: rgba(99, 102, 241, 0.1);
}

.button-danger {
  background: var(--ion-color-danger);
  color: white;
}

.button-danger:hover:not(.button-disabled) {
  background: var(--ion-color-danger-shade);
}

/* Sizes */
.button-small {
  padding: 8px 16px;
  font-size: 14px;
  min-height: 36px;
}

.button-medium {
  padding: 12px 24px;
  font-size: 16px;
  min-height: 44px;
}

.button-large {
  padding: 16px 32px;
  font-size: 18px;
  min-height: 52px;
}

/* Expand */
.button-expand {
  width: 100%;
}

/* Icon only */
.button-icon-only {
  padding: 12px;
  min-width: 44px;
}

.button-icon-only.button-small {
  padding: 8px;
  min-width: 36px;
}

.button-icon-only.button-large {
  padding: 16px;
  min-width: 52px;
}

/* Disabled */
.button-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.button-disabled:hover {
  background: inherit !important;
  color: inherit !important;
}

/* Icon */
.button-icon {
  font-size: inherit;
  line-height: 1;
}

.button-small .button-icon {
  font-size: 14px;
}

.button-medium .button-icon {
  font-size: 16px;
}

.button-large .button-icon {
  font-size: 18px;
}

/* Text */
.button-text {
  line-height: 1;
}
</style>
