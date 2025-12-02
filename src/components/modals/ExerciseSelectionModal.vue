<template>
  <ion-modal :is-open="isOpen" @did-dismiss="handleModalClose">
    <ion-header>
      <ion-toolbar>
        <ion-title>Выберите упражнение</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleModalClose">
            <i class="fas fa-times"></i>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content>
      <div class="modal-content">
        <SearchInput
          v-model="exerciseSearchQuery"
          placeholder="Поиск упражнений..."
          @search="handleExerciseSearch"
          @clear="clearExerciseSearch"
        />
        
        <div v-if="loadingExercises" class="loading-state">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Загрузка упражнений...</p>
        </div>
        
        <div v-else-if="filteredExercises.length === 0" class="empty-state">
          <i class="fas fa-dumbbell"></i>
          <h3>Упражнения не найдены</h3>
          <p>{{ exerciseSearchQuery ? 'Попробуйте изменить поисковый запрос' : 'Все доступные упражнения уже добавлены' }}</p>
          <button
            @click="handleCreateNewExercise"
            class="modern-button"
          >
            <i class="fas fa-plus"></i>
            Добавить упражнение
          </button>
        </div>
        
        <div v-else class="exercises-grid">
          <div
            v-for="exercise in filteredExercises"
            :key="exercise.id"
            class="exercise-card modern-card"
            @click="$emit('selectExercise', exercise)"
          >
            <div class="exercise-header">
              <h3>{{ exercise.name }}</h3>
            </div>
            
            <div class="exercise-meta">
              <div class="exercise-stats">
                <span v-if="exercise.muscle_group">
                  <i class="fa-solid fa-bolt"></i>
                  {{ exercise.muscle_group.name }}
                </span>
              </div>
              <p v-if="exercise.description" class="exercise-description">
                {{ exercise.description }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonSpinner,
} from '@ionic/vue';
import SearchInput from '@/components/ui/SearchInput.vue';

interface Exercise {
  id: number;
  name: string;
  description?: string;
  muscle_group?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

interface Props {
  isOpen: boolean;
  availableExercises: Exercise[];
  loadingExercises: boolean;
}

interface Emits {
  close: [];
  selectExercise: [exercise: Exercise];
  createNewExercise: [];
  search: [query: string];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const exerciseSearchQuery = ref('');

const filteredExercises = computed(() => {
  // Фильтрация происходит в родительском компоненте
  return props.availableExercises;
});

// Exercise search functions
const handleExerciseSearch = (value: string) => {
  exerciseSearchQuery.value = value;
  emit('search', value);
};

const clearExerciseSearch = () => {
  exerciseSearchQuery.value = '';
  emit('search', '');
};

// Функция для создания нового упражнения с правильным управлением фокусом
const handleCreateNewExercise = () => {
  // Убираем фокус с текущего элемента перед закрытием модального окна
  const activeElement = document.activeElement as HTMLElement;
  if (activeElement && activeElement.blur) {
    activeElement.blur();
  }
  
  // Дополнительно убираем фокус с body для предотвращения проблем с aria-hidden
  if (document.body) {
    document.body.blur();
  }
  
  // Эмитим событие создания нового упражнения (переход обрабатывается в родительском компоненте)
  emit('createNewExercise');
};

// Функция для обработки закрытия модального окна
const handleModalClose = () => {
  // Убираем фокус с любого активного элемента
  const activeElement = document.activeElement as HTMLElement;
  if (activeElement && activeElement.blur) {
    activeElement.blur();
  }
  
  // Сбрасываем поисковый запрос при закрытии модалки
  exerciseSearchQuery.value = '';
  // Эмитим событие поиска с пустой строкой, чтобы родительский компонент сбросил фильтр
  emit('search', '');
  
  // Эмитим событие закрытия
  emit('close');
};
</script>

<style scoped>
.modal-content {
  padding: 16px;
}

.exercises-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.modal-content .exercise-card {
  padding: 16px;
  cursor: pointer;
  transition: none;
  display: flex;
  flex-direction: column;
}

.modal-content .exercise-card:hover {
  transform: none;
}

.modal-content .exercise-header {
  margin-bottom: 8px;
}

.modal-content .exercise-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.modal-content .exercise-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.modal-content .exercise-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.modal-content .exercise-stats span {
  display: flex;
  align-items: center;
  font-size: 1.2rem;
  color: #fff
}

.modal-content .exercise-stats i {
  margin-right: 4px;
  font-size: 1.2rem;
  color: var(--ion-color-primary);
}

.modal-content .exercise-description {
  font-size: 12px;
  color: var(--ion-color-medium);
  font-style: italic;
  margin: 0;
}

/* Loading state styles */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  color: var(--ion-color-medium);
}

.loading-state ion-spinner {
  margin-bottom: 1rem;
}

/* Empty state styles for modal */
.modal-content .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: var(--ion-color-medium);
  min-height: 300px;
}

.modal-content .empty-state i {
  font-size: 4rem;
  margin-bottom: 1rem;
  color: var(--ion-color-primary);
}

.modal-content .empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  color: var(--ion-text-color);
  text-align: center;
  width: 100%;
}

.modal-content .empty-state p {
  margin: 0 0 24px 0;
  font-size: 1rem;
  text-align: center;
  width: 100%;
}

.modal-content .empty-state .modern-button {
  background: var(--ion-color-primary);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 200px;
  max-width: 100%;
  margin: 0 auto;
}

.modal-content .empty-state .modern-button i {
  font-size: 14px !important;
  color: white !important;
  margin: 0 !important;
  display: inline-block !important;
}
</style>
