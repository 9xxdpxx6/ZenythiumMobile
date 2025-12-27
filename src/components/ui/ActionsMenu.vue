<template>
  <div class="actions-menu-container" ref="containerRef">
    <div class="actions-button-wrapper">
      <button
        type="button"
        class="actions-menu-button main-action"
        :class="buttonClass"
        @click="handleMainAction"
        :disabled="disabled"
      >
        <span class="main-action-text">
          <i :class="mainActionIcon"></i>
          <span>{{ mainActionLabel }}</span>
        </span>
      </button>
      
      <button
        type="button"
        class="actions-menu-button menu-trigger"
        :class="{ 'is-open': isOpen }"
        @click.stop="toggleMenu"
        :disabled="disabled"
        title="Дополнительные действия"
      >
        <i class="fas fa-ellipsis-v"></i>
      </button>
    </div>

    <div v-if="isOpen" class="actions-menu-dropdown">
      <button
        v-for="action in actions"
        :key="action.id"
        type="button"
        class="action-item"
        :class="action.class"
        @click="handleActionClick(action)"
      >
        <i :class="action.icon"></i>
        <span>{{ action.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

export interface ActionItem {
  id: string;
  label: string;
  icon: string;
  class?: string;
  handler: () => void;
}

interface Props {
  mainActionLabel: string;
  mainActionIcon: string;
  mainActionHandler: () => void;
  actions: ActionItem[];
  buttonClass?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  buttonClass: '',
  disabled: false,
});

const isOpen = ref(false);
const containerRef = ref<HTMLElement | null>(null);

const toggleMenu = () => {
  if (isOpen.value) {
    closeMenu();
  } else {
    openMenu();
  }
};

const openMenu = () => {
  isOpen.value = true;
};

const closeMenu = () => {
  isOpen.value = false;
};

const handleMainAction = () => {
  props.mainActionHandler();
};

const handleActionClick = (action: ActionItem) => {
  action.handler();
  closeMenu();
};

const handleClickOutside = (event: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    closeMenu();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.actions-menu-container {
  position: relative;
  width: 100%;
}

.actions-button-wrapper {
  display: flex;
  gap: 0;
  width: 100%;
  border: 1px solid rgba(var(--ion-color-primary-rgb), 0.4);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.actions-menu-button {
  padding: 12px 20px;
  background: transparent;
  border: none;
  color: rgba(var(--ion-color-primary-rgb), 0.9);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: none;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
}

.actions-menu-button.main-action {
  flex: 1;
  border-right: 1px solid rgba(var(--ion-color-primary-rgb), 0.2);
  position: relative;
  padding-right: 64px;
  justify-content: flex-start;
}

.main-action-text {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
}

.main-action-text i {
  font-size: 14px;
}

.actions-menu-button.menu-trigger {
  padding: 12px 16px;
  min-width: 48px;
  width: 48px;
  flex-shrink: 0;
  justify-content: center;
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
}

.actions-menu-button.menu-trigger.is-open {
  background: rgba(var(--ion-color-primary-rgb), 0.1);
}

.actions-menu-button:hover:not(:disabled) {
  background: rgba(var(--ion-color-primary-rgb), 0.05);
}

.actions-menu-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.actions-menu-button i {
  font-size: 14px;
}

.actions-menu-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: rgba(31, 31, 31, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  z-index: 1000;
  overflow: hidden;
  min-width: 200px;
}

.action-item {
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  border: none;
  color: var(--ion-text-color);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
}

.action-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.action-item:first-child {
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}

.action-item:last-child {
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}

.action-item i {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.action-item.primary i,
.action-item.export i {
  color: rgba(var(--ion-color-primary-rgb), 0.9);
}
</style>

