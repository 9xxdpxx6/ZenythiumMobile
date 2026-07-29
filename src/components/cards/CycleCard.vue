<template>
  <div
    class="cycle-card modern-card"
    @click="$emit('click', cycle)"
  >
    <div class="cycle-header">
      <h3>{{ cycle.name }}</h3>
      <div class="header-actions" ref="menuContainerRef">
        <div
          :class="['cycle-status', cycle.status === CycleStatus.ACTIVE ? 'status-active' : 'status-completed']"
        >
          {{ cycle.status === CycleStatus.ACTIVE ? 'Активен' : 'Завершен' }}
        </div>
        <button
          class="menu-button"
          :class="{ 'is-open': isMenuOpen }"
          @click.stop="toggleMenu"
          title="Действия"
        >
          <i class="fas fa-ellipsis-v"></i>
        </button>

        <div
          v-if="isMenuOpen"
          class="actions-dropdown"
          @click.stop
        >
          <button
            type="button"
            class="dropdown-item"
            @click.stop="handleAction('share')"
          >
            <i class="fas fa-share-alt"></i>
            <span>Поделиться</span>
          </button>
          <button
            type="button"
            class="dropdown-item"
            @click.stop="handleAction('export')"
          >
            <i class="fas fa-file-export"></i>
            <span>Экспорт</span>
          </button>
          <button
            type="button"
            class="dropdown-item"
            :disabled="isDuplicating"
            @click.stop="handleAction('duplicate')"
          >
            <i v-if="isDuplicating" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-copy"></i>
            <span>Скопировать</span>
          </button>
        </div>
      </div>
    </div>

    <div class="cycle-info">
      <p><strong>Планов:</strong> {{ cycle.plans_count || 0 }}</p>
      <p><strong>Тренировок:</strong> {{ cycle.workouts_count || 0 }}</p>
      <p><strong>Начало:</strong> {{ formatDate(cycle.started_at) }}</p>
      <p v-if="cycle.status === CycleStatus.COMPLETED && cycle.finished_at">
        <strong>Завершение:</strong> {{ formatDate(cycle.finished_at) }}
      </p>
    </div>

    <div class="cycle-progress">
      <div class="progress-label">
        <span>Прогресс</span>
        <span>{{ Math.round(cycle.progress || 0) }}%</span>
      </div>
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: (cycle.progress || 0) + '%' }"
        ></div>
      </div>
      <div v-if="cycle.weeks && cycle.current_week !== undefined" class="progress-weeks">
        <span>неделя</span>
        <span>{{ cycle.current_week }} из {{ cycle.weeks }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import type { Cycle } from '@/types/models/cycle.types';
import { CycleStatus } from '@/types/models/cycle.types';

interface Props {
  cycle: Cycle;
  isDuplicating?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  click: [cycle: Cycle];
  share: [cycle: Cycle];
  export: [cycle: Cycle];
  duplicate: [cycle: Cycle];
}>();

const isMenuOpen = ref(false);
const menuContainerRef = ref<HTMLElement | null>(null);

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const closeMenu = () => {
  isMenuOpen.value = false;
};

const handleAction = (action: 'share' | 'export' | 'duplicate') => {
  closeMenu();
  if (action === 'share') emit('share', props.cycle);
  else if (action === 'export') emit('export', props.cycle);
  else emit('duplicate', props.cycle);
};

const handleClickOutside = (event: MouseEvent) => {
  if (
    menuContainerRef.value &&
    !menuContainerRef.value.contains(event.target as Node)
  ) {
    closeMenu();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

const formatDate = (dateString: string | undefined) => {
  if (!dateString || dateString.trim() === '') {
    return 'Не указано';
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return 'Неверная дата';
  }
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};
</script>

<style scoped>
.cycle-card {
  padding: 20px !important;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.cycle-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 12px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  position: relative;
}

.menu-button {
  padding: 0;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  color: var(--ion-color-medium);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 16px;
}

.menu-button:hover,
.menu-button.is-open {
  background: rgba(255, 255, 255, 0.06);
  color: var(--ion-text-color);
}

.menu-button i {
  font-size: 16px;
  line-height: 1;
}

.actions-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 180px;
  background: rgba(31, 31, 31, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  z-index: 1000;
  overflow: hidden;
  padding: 4px 0;
}

.dropdown-item {
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  border: none;
  color: var(--ion-text-color);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
}

.dropdown-item:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.05);
}

.dropdown-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dropdown-item i {
  font-size: 14px;
  width: 18px;
  text-align: center;
  color: rgba(var(--ion-color-primary-rgb), 0.9);
}

.cycle-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--ion-text-color);
  flex: 1;
  line-height: 1.3;
}

.cycle-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  flex-shrink: 0;
  margin-top: 2px;
}

.status-active {
  background: rgba(16, 185, 129, 0.2);
  color: var(--ion-color-success);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.status-completed {
  background: rgba(107, 114, 128, 0.2);
  color: var(--ion-color-medium);
  border: 1px solid rgba(107, 114, 128, 0.3);
}

.cycle-info {
  margin-bottom: 16px;
}

.cycle-info p {
  margin: 4px 0;
  font-size: 14px;
  color: var(--ion-color-medium);
}

.cycle-info strong {
  color: var(--ion-text-color);
}

.cycle-progress {
  margin-top: 16px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--ion-color-medium);
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--ion-color-primary);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-weeks {
  margin-top: 4px;
  font-size: 12px;
  color: var(--ion-color-medium);
  display: flex;
  justify-content: space-between;
}
</style>

