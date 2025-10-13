<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button></ion-back-button>
        </ion-buttons>
        <ion-title>Выберите план</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div v-if="loading" class="loading-state">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Загрузка планов...</p>
      </div>

      <div v-else-if="plans.length > 0">
        <ion-list>
          <ion-radio-group v-model="selectedPlanId">
            <ion-item
              v-for="plan in plans"
              :key="plan.id"
              button
              @click="selectedPlanId = plan.id"
            >
              <ion-label>
                <h2>{{ plan.name }}</h2>
                <p v-if="plan.exercises">
                  Упражнений: {{ plan.exercises.length }}
                </p>
                <p v-else>
                  Упражнений: {{ plan.exercise_count }}
                </p>
              </ion-label>
              <ion-radio :value="plan.id" slot="start"></ion-radio>
            </ion-item>
          </ion-radio-group>
        </ion-list>

        <div class="ion-padding">
          <ion-button
            expand="block"
            :disabled="!selectedPlanId || starting"
            @click="startWorkout"
          >
            <ion-spinner v-if="starting" name="crescent"></ion-spinner>
            <span v-else>Начать тренировку</span>
          </ion-button>
        </div>
      </div>

      <div v-else class="empty-state">
        <ion-icon :icon="documentOutline" size="large"></ion-icon>
        <h2>Нет доступных планов</h2>
        <p>Обратитесь к администратору</p>
      </div>
    </ion-content>

    <ion-toast
      :is-open="!!error"
      :message="error"
      duration="3000"
      @didDismiss="clearError"
    ></ion-toast>
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
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonLabel,
  IonRadioGroup,
  IonRadio,
  IonButton,
  IonSpinner,
  IonToast,
  IonIcon,
} from '@ionic/vue';
import { documentOutline } from 'ionicons/icons';
import apiClient from '@/services/api';
import { Plan, StartWorkoutResponse, ApiError } from '@/types/api';

const router = useRouter();
const plans = ref<Plan[]>([]);
const selectedPlanId = ref<number | null>(null);
const loading = ref(false);
const starting = ref(false);
const error = ref<string | null>(null);

const fetchPlans = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await apiClient.get<Plan[]>('/api/v1/plans');
    const allPlans = response.data;
    // Фильтруем только активные планы
    plans.value = allPlans.filter((plan: Plan) => plan.is_active === true);
  } catch (err) {
    error.value = (err as ApiError).message;
  } finally {
    loading.value = false;
  }
};

const startWorkout = async () => {
  if (!selectedPlanId.value) return;

  starting.value = true;
  error.value = null;
  
  try {
    const response = await apiClient.post<StartWorkoutResponse>('/api/v1/workouts/start', {
      plan_id: selectedPlanId.value,
    });
    
    router.push(`/workout/${response.data.workout.id}`);
  } catch (err) {
    error.value = (err as ApiError).message;
  } finally {
    starting.value = false;
  }
};

const clearError = () => {
  error.value = null;
};

onMounted(() => {
  fetchPlans();
});
</script>

<style scoped>
/* Balanced layout with increased spacing - same as HomePage */
.page-content {
  padding: 16px !important;
  margin: 0 !important;
  padding-top: 12px !important;
  padding-bottom: 80px !important; /* Add space for tab bar (60px) + extra margin */
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

.empty-state ion-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}
</style>
