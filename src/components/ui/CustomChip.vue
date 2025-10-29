<template>
  <div :class="chipClasses">
    <i v-if="icon" :class="icon" class="chip-icon"></i>
    <span class="chip-text">
      <slot></slot>
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'medium';
  variant?: 'filled' | 'outlined';
  size?: 'small' | 'medium' | 'large';
  icon?: string;
}

const props = withDefaults(defineProps<Props>(), {
  color: 'primary',
  variant: 'filled',
  size: 'medium'
});

const chipClasses = computed(() => {
  const classes = ['custom-chip'];
  
  classes.push(`chip-${props.color}`);
  classes.push(`chip-${props.variant}`);
  classes.push(`chip-${props.size}`);
  
  if (props.icon) {
    classes.push('chip-with-icon');
  }
  
  return classes.join(' ');
});
</script>

<style scoped>
.custom-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 16px;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
}

/* Colors - Filled */
.chip-primary.chip-filled {
  background: var(--ion-color-primary);
  color: white;
}

.chip-secondary.chip-filled {
  background: var(--ion-color-secondary);
  color: white;
}

.chip-success.chip-filled {
  background: var(--ion-color-success);
  color: white;
}

.chip-warning.chip-filled {
  background: var(--ion-color-warning);
  color: white;
}

.chip-danger.chip-filled {
  background: var(--ion-color-danger);
  color: white;
}

.chip-medium.chip-filled {
  background: var(--ion-color-medium);
  color: white;
}

/* Colors - Outlined */
.chip-primary.chip-outlined {
  background: transparent;
  color: var(--ion-color-primary);
  border: 1px solid var(--ion-color-primary);
}

.chip-secondary.chip-outlined {
  background: transparent;
  color: var(--ion-color-secondary);
  border: 1px solid var(--ion-color-secondary);
}

.chip-success.chip-outlined {
  background: transparent;
  color: var(--ion-color-success);
  border: 1px solid var(--ion-color-success);
}

.chip-warning.chip-outlined {
  background: transparent;
  color: var(--ion-color-warning);
  border: 1px solid var(--ion-color-warning);
}

.chip-danger.chip-outlined {
  background: transparent;
  color: var(--ion-color-danger);
  border: 1px solid var(--ion-color-danger);
}

.chip-medium.chip-outlined {
  background: transparent;
  color: var(--ion-color-medium);
  border: 1px solid var(--ion-color-medium);
}

/* Sizes */
.chip-small {
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 12px;
}

.chip-medium {
  padding: 6px 12px;
  font-size: 14px;
  border-radius: 16px;
}

.chip-large {
  padding: 8px 16px;
  font-size: 16px;
  border-radius: 20px;
}

/* Icon */
.chip-icon {
  font-size: inherit;
  line-height: 1;
}

.chip-small .chip-icon {
  font-size: 12px;
}

.chip-medium .chip-icon {
  font-size: 14px;
}

.chip-large .chip-icon {
  font-size: 16px;
}

/* Text */
.chip-text {
  line-height: 1;
}
</style>
