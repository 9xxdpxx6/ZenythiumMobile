<template>
  <div v-if="isOpen" class="custom-toast" :class="toastClasses">
    <div class="toast-content">
      <i v-if="icon" :class="icon" class="toast-icon"></i>
      <div class="toast-message">
        <slot>{{ message }}</slot>
      </div>
      <button v-if="closable" @click="close" class="toast-close">
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';

interface Props {
  isOpen: boolean;
  message?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'light';
  duration?: number;
  position?: 'top' | 'bottom' | 'middle';
  icon?: string;
  closable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  color: 'primary',
  duration: 3000,
  position: 'bottom',
  closable: true
});

const emit = defineEmits<{
  'update:isOpen': [value: boolean];
  'didDismiss': [];
}>();

const isOpen = ref(props.isOpen);
let timeoutId: NodeJS.Timeout | null = null;

const toastClasses = computed(() => {
  const classes = ['toast'];
  classes.push(`toast-${props.color}`);
  classes.push(`toast-${props.position}`);
  return classes.join(' ');
});

const close = () => {
  isOpen.value = false;
  emit('update:isOpen', false);
  emit('didDismiss');
  
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
};

const startTimer = () => {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  
  if (props.duration > 0) {
    timeoutId = setTimeout(() => {
      close();
    }, props.duration);
  }
};

watch(() => props.isOpen, (newValue) => {
  isOpen.value = newValue;
  if (newValue) {
    startTimer();
  }
});

watch(isOpen, (newValue) => {
  emit('update:isOpen', newValue);
});

onMounted(() => {
  if (props.isOpen) {
    startTimer();
  }
});
</script>

<style scoped>
.custom-toast {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  max-width: 90vw;
  width: 100%;
  max-width: 400px;
  animation: toastSlideIn 0.3s ease-out;
}

.toast-top {
  top: 20px;
}

.toast-middle {
  top: 50%;
  transform: translate(-50%, -50%);
}

.toast-bottom {
  bottom: 20px;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
}

/* Colors */
.toast-primary .toast-content {
  background: var(--ion-color-primary);
  color: white;
}

.toast-secondary .toast-content {
  background: var(--ion-color-secondary);
  color: white;
}

.toast-success .toast-content {
  background: var(--ion-color-success);
  color: white;
}

.toast-warning .toast-content {
  background: var(--ion-color-warning);
  color: white;
}

.toast-danger .toast-content {
  background: var(--ion-color-danger);
  color: white;
}

.toast-light .toast-content {
  background: #e0e0e0;
  color: var(--ion-text-color);
}

/* Icon */
.toast-icon {
  font-size: 18px;
  flex-shrink: 0;
}

/* Message */
.toast-message {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
}

/* Close button */
.toast-close {
  background: none;
  border: none;
  color: inherit;
  font-size: 16px;
  padding: 4px;
  cursor: pointer;
  border-radius: 4px;
  transition: none;
  flex-shrink: 0;
}

.toast-close:hover { background: transparent; }

/* Animations */
@keyframes toastSlideIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.toast-top {
  animation: toastSlideInTop 0.3s ease-out;
}

@keyframes toastSlideInTop {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.toast-middle {
  animation: toastSlideInMiddle 0.3s ease-out;
}

@keyframes toastSlideInMiddle {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

/* Dark theme adjustments */
@media (prefers-color-scheme: dark) {
  .toast-content {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }
  
  .toast-light .toast-content {
    background: #4a4a4a;
    color: var(--ion-text-color);
  }
}
</style>
