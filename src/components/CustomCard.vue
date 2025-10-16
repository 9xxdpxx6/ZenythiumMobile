<template>
  <div :class="cardClasses" @click="handleClick">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  variant?: 'default' | 'modern' | 'elevated' | 'outlined';
  clickable?: boolean;
  padding?: 'none' | 'small' | 'medium' | 'large';
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'modern',
  clickable: false,
  padding: 'medium'
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const cardClasses = computed(() => {
  const classes = ['custom-card'];
  
  classes.push(`card-${props.variant}`);
  classes.push(`card-padding-${props.padding}`);
  
  if (props.clickable) {
    classes.push('card-clickable');
  }
  
  return classes.join(' ');
});

const handleClick = (event: MouseEvent) => {
  if (props.clickable) {
    emit('click', event);
  }
};
</script>

<style scoped>
.custom-card {
  border-radius: 12px;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

/* Variants */
.card-default {
  background: var(--ion-color-light);
  border: 1px solid var(--ion-color-light-shade);
}

.card-modern {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.card-elevated {
  background: var(--ion-color-light);
  border: 1px solid var(--ion-color-light-shade);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-outlined {
  background: transparent;
  border: 1px solid var(--ion-color-medium);
}

/* Padding */
.card-padding-none {
  padding: 0;
}

.card-padding-small {
  padding: 12px;
}

.card-padding-medium {
  padding: 20px;
}

.card-padding-large {
  padding: 24px;
}

/* Clickable */
.card-clickable {
  cursor: pointer;
}

.card-clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.card-clickable:active {
  transform: translateY(0);
}

/* Dark theme adjustments */
@media (prefers-color-scheme: dark) {
  .card-modern {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .card-elevated {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  .card-clickable:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }
}
</style>
