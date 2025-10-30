<template>
  <div class="plans-section">
    <div v-if="plans.length === 0" class="empty-plans-state">
      <i class="fas fa-list"></i>
      <p>Планы не добавлены</p>
      <span class="hint">Добавьте планы тренировок для создания цикла</span>
    </div>

    <div v-else class="plans-list">
      <draggable
        v-model="localPlans"
        @end="onPlanDragEnd"
        @start="onPlanDragStart"
        @move="onPlanMove"
        item-key="id"
        handle=".drag-handle"
        class="draggable-list"
        :animation="0"
        :ghost-class="''"
        :chosen-class="'sortable-chosen'"
        :drag-class="'sortable-drag'"
        :force-fallback="false"
        :fallback-tolerance="0"
        :delay="0"
        :delay-on-touch-start="false"
        :touch-start-threshold="10"
        :swap-threshold="0.65"
        :invert-swap="false"
        :direction="'vertical'"
        :disabled="false"
        :scroll="false"
        :group="false"
        :pull="false"
      >
        <template #item="{ element: cyclePlan, index }">
          <div 
            class="plan-item"
            @longpress="showDeleteConfirmation(index)"
            @touchstart="handleTouchStart"
            @touchend="handleTouchEnd"
            @touchmove="handleTouchMove"
          >
            <div class="drag-handle">
              <i class="fas fa-grip-vertical"></i>
            </div>
            
            <div class="plan-info">
              <h4>{{ cyclePlan.plan.name }}</h4>
              <div class="plan-meta">
                <span class="plan-stats">
                  <i class="fas fa-dumbbell"></i>
                  {{ cyclePlan.plan.exercise_count }} упражнений
                </span>
              </div>
            </div>
          </div>
        </template>
      </draggable>
      
      <div class="plan-hint-text">
        Долгое нажатие на план для удаления
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import draggable from 'vuedraggable';
import { CyclePlan } from '@/types/api';

interface Props {
  plans: CyclePlan[];
  isEditMode: boolean;
}

interface Emits {
  planReorder: [plans: CyclePlan[]];
  planDelete: [index: number];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Локальная копия планов для drag&drop
const localPlans = ref<CyclePlan[]>([]);

// Синхронизируем локальные планы с пропсами
watch(() => props.plans, (newPlans) => {
  localPlans.value = [...newPlans];
}, { immediate: true, deep: true });

// Long press handlers
let touchStartTime = 0;
let touchStartX = 0;
let touchStartY = 0;
let longPressTimer: NodeJS.Timeout | null = null;

const handleTouchStart = (event: TouchEvent) => {
  touchStartTime = Date.now();
  touchStartX = event.touches[0].clientX;
  touchStartY = event.touches[0].clientY;
  
  longPressTimer = setTimeout(() => {
    // Long press detected
    const target = event.target as HTMLElement;
    const planItem = target.closest('.plan-item');
    if (planItem) {
      const index = Array.from(planItem.parentElement?.children || []).indexOf(planItem);
      showDeleteConfirmation(index);
    }
  }, 800); // 800ms for long press
};

const handleTouchEnd = () => {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
};

const handleTouchMove = () => {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
};

const showDeleteConfirmation = (index: number) => {
  emit('planDelete', index);
};

// Drag and drop handlers
const onPlanMove = (evt: any) => {
  // Prevent default move behavior to ensure smooth animation
  return true;
};

const onPlanDragStart = () => {
  // Add sorting class to enable smooth transitions
  const draggableList = document.querySelector('.draggable-list');
  if (draggableList) {
    draggableList.classList.add('sorting');
  }
};

const onPlanDragEnd = () => {
  // Emit the reordered plans
  emit('planReorder', localPlans.value);
  
  // Remove sorting class after animation completes with longer delay
  setTimeout(() => {
    const draggableList = document.querySelector('.draggable-list');
    if (draggableList) {
      draggableList.classList.remove('sorting');
    }
  }, 500); // Increased delay for smoother animation
};
</script>

<style scoped>
.plans-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty-plans-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: var(--ion-color-medium);
  border: 2px dashed rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
}

.empty-plans-state i {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: var(--ion-color-primary);
}

.empty-plans-state p {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.empty-plans-state .hint {
  font-size: 14px;
  color: var(--ion-color-medium);
}

.plans-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.draggable-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  transform: translateZ(0); /* Force hardware acceleration */
  will-change: transform;
}

.plan-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: grab;
  position: relative;
  will-change: transform, opacity, box-shadow;
  backface-visibility: hidden;
  perspective: 1000px;
  contain: layout style paint;
}

.plan-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  transform: none;
  box-shadow: none;
}

/* Drag and drop animations - simplified */
.plan-item.sortable-chosen {
  cursor: grabbing;
  transform: scale(1.02);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  z-index: 1000;
  transition: all 0.2s ease;
}

.plan-item.sortable-drag {
  opacity: 0.8;
  transform: scale(1.05);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
  z-index: 1001;
  transition: all 0.2s ease;
}

/* Hide ALL intermediate drag elements */
.sortable-ghost,
.sortable-placeholder,
.sortable-fallback,
.sortable-clone,
.draggable-list .sortable-ghost,
.draggable-list .sortable-placeholder,
.draggable-list .sortable-fallback,
.draggable-list .sortable-clone {
  display: none !important;
  opacity: 0 !important;
  visibility: hidden !important;
  height: 0 !important;
  width: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
}

/* Smooth movement for all items during drag */
.plan-item:not(.sortable-chosen):not(.sortable-drag) {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Additional rules to hide any drag-related elements */
*[class*="sortable-ghost"],
*[class*="sortable-placeholder"],
*[class*="sortable-fallback"],
*[class*="sortable-clone"],
*[class*="ghost"],
*[class*="placeholder"],
*[class*="fallback"],
*[class*="clone"] {
  display: none !important;
  opacity: 0 !important;
  visibility: hidden !important;
}

/* Ensure no elements overlap during drag */
.draggable-list.sorting .plan-item {
  position: relative;
  z-index: auto;
}

.draggable-list.sorting .plan-item.sortable-chosen,
.draggable-list.sorting .plan-item.sortable-drag {
  z-index: 1000;
}

.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--ion-color-medium);
  cursor: grab;
  border-radius: 6px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.drag-handle:hover {
  background: transparent;
  color: var(--ion-color-medium);
  transform: none;
}

.drag-handle:active {
  cursor: grabbing;
  transform: scale(0.95);
}

/* Enhanced drag handle animations during drag */
.plan-item.sortable-chosen .drag-handle {
  color: var(--ion-color-primary);
  background: rgba(99, 102, 241, 0.2);
  transform: scale(1.1);
}

.plan-item.sortable-drag .drag-handle {
  color: var(--ion-color-primary);
  background: rgba(99, 102, 241, 0.3);
  transform: scale(1.15);
}

.plan-info {
  flex: 1;
  min-width: 0;
}

.plan-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.plan-info p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: var(--ion-color-medium);
  line-height: 1.4;
}

.plan-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.plan-stats {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--ion-color-medium);
}

.plan-stats i {
  margin-right: 4px;
  color: var(--ion-color-primary);
}

.plan-hint-text {
  font-size: 11px;
  color: var(--ion-color-medium);
  text-align: center;
  margin-top: 8px;
  opacity: 0.7;
}

/* Additional smooth animations for plan items */
.plan-item:not(.sortable-chosen):not(.sortable-drag) {
  animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Smooth reordering animation */
.plan-item.reordering {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Enhanced visual feedback during drag */
.plan-item.sortable-chosen .plan-info {
  opacity: 0.8;
}

.plan-item.sortable-drag .plan-info {
  opacity: 0.6;
}

/* Force smooth animations on mobile */
@media (max-width: 768px) {
  .plan-item {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }
  
  .draggable-list.sorting .plan-item {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }
}
</style>
