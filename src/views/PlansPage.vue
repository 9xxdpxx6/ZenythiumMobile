<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Планы</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="createNewPlan" class="add-button">
            <i class="fas fa-plus"></i>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="page-content">
        <h1 class="page-title">Планы тренировок</h1>
        <p class="page-subtitle">Выберите план для своей тренировки</p>

        <div v-if="loading" class="loading-state">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Загрузка планов...</p>
        </div>

        <div v-else-if="plans.length > 0">
          <div class="plans-grid">
            <div
              v-for="plan in plans"
              :key="plan.id"
              class="plan-card modern-card"
              @click="handlePlanClick(plan)"
            >
              <div class="plan-header">
                <h3>{{ plan.name }}</h3>
              </div>
              
              <div class="plan-stats">
                <div class="stat">
                  <i class="fas fa-dumbbell"></i>
                  <span>{{ plan.exercise_count || 0 }} упражнений</span>
                </div>
              </div>

              <div class="exercises-list" v-if="plan.exercises && plan.exercises.length > 0">
                <div 
                  v-for="exercise in getSortedExercises(plan.exercises)" 
                  :key="exercise.id"
                  class="exercise-item"
                >
                  {{ exercise.order }}. {{ exercise.name }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <i class="fas fa-list empty-icon"></i>
          <h2>Нет планов</h2>
          <p>Планы тренировок будут доступны в ближайшее время</p>
          <button
            @click="createNewPlan"
            class="modern-button"
          >
            <i class="fas fa-plus"></i>
            Создать план
          </button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonButtons,
  IonButton,
} from '@ionic/vue';
import apiClient from '@/services/api';
import { Plan, ApiError, Exercise } from '@/types/api';

const router = useRouter();
const plans = ref<Plan[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const fetchPlans = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await apiClient.get('/api/v1/plans');
    const allPlans = response.data.data || response.data || [];
    // Фильтруем только активные планы
    plans.value = allPlans.filter((plan: Plan) => plan.is_active === true);
  } catch (err) {
    console.error('Plans fetch error:', err);
    error.value = (err as ApiError).message;
  } finally {
    loading.value = false;
  }
};

const handleRefresh = async (event: CustomEvent) => {
  await fetchPlans();
  event.detail.complete();
};

const handlePlanClick = (plan: Plan) => {
  router.push(`/plan/${plan.id}`);
};

const getSortedExercises = (exercises: Exercise[]) => {
  return exercises.sort((a, b) => a.order - b.order);
};

const createNewPlan = () => {
  router.push('/plan/new');
};

onMounted(() => {
  fetchPlans();
});
</script>

<style scoped>
/* Minimal spacing for maximum screen usage */
.page-content {
  padding: 4px !important;
  margin: 0 !important;
  padding-top: 4px !important;
  padding-bottom: 80px !important; /* Add space for tab bar (60px) + extra margin */
}

/* Кнопка добавления в заголовке */
.add-button {
  --background: transparent !important;
  --background-hover: transparent !important;
  --background-focused: transparent !important;
  --background-activated: transparent !important;
  --border-width: 0 !important;
  --border-style: none !important;
  --border-color: transparent !important;
  --color: var(--ion-color-primary) !important;
  --color-hover: var(--ion-color-primary-shade) !important;
  --color-focused: var(--ion-color-primary) !important;
  --color-activated: var(--ion-color-primary-shade) !important;
  --box-shadow: none !important;
  --padding-start: 8px !important;
  --padding-end: 8px !important;
  --padding-top: 8px !important;
  --padding-bottom: 8px !important;
  margin: 0 !important;
  width: 40px !important;
  height: 40px !important;
}

.add-button i {
  font-size: 20px !important;
  color: var(--ion-color-primary) !important;
}

.modern-button {
  background: var(--ion-color-primary);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
}

.modern-button:hover {
  background: var(--ion-color-primary-shade);
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.plan-card {
  padding: 20px !important;
  cursor: pointer;
  transition: transform 0.2s ease;
  display: flex;
  flex-direction: column;
}


.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.plan-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--ion-text-color);
  flex: 1;
  margin-right: 12px;
}


.plan-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.stat {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--ion-color-medium);
}

.stat i {
  font-size: 14px;
  margin-right: 4px;
  color: var(--ion-color-primary);
}

.exercises-list {
  margin-top: 12px;
}

.exercise-item {
  font-size: 13px;
  color: var(--ion-color-medium);
  margin-bottom: 4px;
  padding: 2px 0;
  line-height: 1.3;
}

.modern-button {
  background: var(--ion-color-primary);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  justify-content: center;
}


.modern-button i {
  font-size: 12px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: var(--ion-color-medium);
}

.loading-state ion-spinner {
  margin-bottom: 1rem;
}

.empty-state i {
  font-size: 4rem;
  margin-bottom: 1rem;
  color: var(--ion-color-primary);
}

.empty-state h2 {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  color: var(--ion-text-color);
}

.empty-state p {
  margin: 0;
  font-size: 1rem;
}
</style>
