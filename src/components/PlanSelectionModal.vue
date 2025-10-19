<template>
  <ion-modal :is-open="isOpen" @did-dismiss="handleModalClose">
    <ion-header>
      <ion-toolbar>
        <ion-title>Выберите план</ion-title>
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
          v-model="planSearchQuery"
          placeholder="Поиск планов..."
          @search="handlePlanSearch"
          @clear="clearPlanSearch"
        />
        
        <div v-if="loadingPlans" class="loading-state">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Загрузка планов...</p>
        </div>
        
        <div v-else-if="filteredPlans.length === 0" class="empty-state">
          <i class="fas fa-search"></i>
          <h3>Планы не найдены</h3>
          <p>{{ planSearchQuery ? 'Попробуйте изменить поисковый запрос' : 'Все доступные планы уже добавлены' }}</p>
          <button
            @click="handleCreateNewPlan"
            class="modern-button"
          >
            <i class="fas fa-plus"></i>
            Добавить план
          </button>
        </div>
        
        <div v-else class="plans-grid">
          <ion-card
            v-for="plan in filteredPlans"
            :key="plan.id"
            class="plan-card"
            @click="handlePlanSelect(plan)"
          >
            <ion-card-header>
              <ion-card-title>{{ plan.name }}</ion-card-title>
            </ion-card-header>
            
            <ion-card-content>
              <div class="plan-meta">
                <div class="plan-stats">
                  <span>
                    <i class="fas fa-dumbbell"></i>
                    {{ plan.exercise_count }} упражнений
                  </span>
                </div>
              </div>
            </ion-card-content>
          </ion-card>
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
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
} from '@ionic/vue';
import SearchInput from '@/components/SearchInput.vue';
import { Plan } from '@/types/api';

interface Props {
  isOpen: boolean;
  availablePlans: Plan[];
  loadingPlans: boolean;
}

interface Emits {
  close: [];
  selectPlan: [plan: Plan];
  createNewPlan: [];
  search: [query: string];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const planSearchQuery = ref('');

const filteredPlans = computed(() => {
  // Фильтрация происходит в родительском компоненте
  return props.availablePlans;
});

// Plan search functions
const handlePlanSearch = (value: string) => {
  planSearchQuery.value = value;
  emit('search', value);
};

const clearPlanSearch = () => {
  planSearchQuery.value = '';
  emit('search', '');
};

// Функция для выбора плана с сбросом поискового запроса
const handlePlanSelect = (plan: Plan) => {
  // Сбрасываем поисковый запрос при выборе плана
  planSearchQuery.value = '';
  emit('selectPlan', plan);
};

// Функция для создания нового плана с правильным управлением фокусом
const handleCreateNewPlan = () => {
  // Убираем фокус с текущего элемента перед закрытием модального окна
  const activeElement = document.activeElement as HTMLElement;
  if (activeElement && activeElement.blur) {
    activeElement.blur();
  }
  
  // Дополнительно убираем фокус с body для предотвращения проблем с aria-hidden
  if (document.body) {
    document.body.blur();
  }
  
  // Эмитим событие создания нового плана (переход обрабатывается в родительском компоненте)
  emit('createNewPlan');
};

// Функция для обработки закрытия модального окна
const handleModalClose = () => {
  // Убираем фокус с любого активного элемента
  const activeElement = document.activeElement as HTMLElement;
  if (activeElement && activeElement.blur) {
    activeElement.blur();
  }
  
  // Сбрасываем поисковый запрос при закрытии модального окна
  planSearchQuery.value = '';
  
  // Эмитим событие закрытия
  emit('close');
};
</script>

<style scoped>
.modal-content {
  padding: 16px;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.modal-content .plan-card {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.modal-content .plan-card:hover {
  transform: translateY(-2px);
}

.modal-content .plan-card ion-card-header {
  padding-bottom: 8px;
}

.modal-content .plan-card ion-card-title {
  font-size: 16px;
  font-weight: 600;
}

.modal-content .plan-card ion-card-content {
  padding-top: 0;
}

.modal-content .plan-card ion-card-content p {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: var(--ion-color-medium);
  line-height: 1.4;
}

.modal-content .plan-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.modal-content .plan-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.modal-content .plan-stats span {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--ion-color-medium);
}

.modal-content .plan-stats i {
  margin-right: 4px;
  color: var(--ion-color-primary);
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
