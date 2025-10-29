<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/"></ion-back-button>
        </ion-buttons>
        <ion-title>Начать тренировку</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <PageContainer>
        <LoadingState v-if="loading" message="Подготовка тренировки..." />

        <div v-else class="start-workout-content">
          <div class="workout-info">
            <i class="fas fa-dumbbell workout-icon"></i>
            <h2>Готовы начать тренировку?</h2>
            <p v-if="selectedPlanId === 'auto'">Система автоматически выберет подходящий план на основе вашего прогресса и активного цикла.</p>
          </div>
        </div>

        <div v-if="!loading" class="plan-selection">
          <CustomSelect
            v-model="selectedPlanId"
            :options="planOptions"
            placeholder="Выберите план тренировки"
            search-placeholder="Поиск планов..."
            @change="onPlanChange"
          />
        </div>

        <div v-if="!loading" class="ion-padding">
          <ion-button
            expand="block"
            :disabled="starting || !selectedPlanId"
            @click="startWorkout"
            size="large"
          >
            <ion-spinner v-if="starting" name="crescent"></ion-spinner>
            <span v-else>Начать тренировку</span>
          </ion-button>
        </div>
      </PageContainer>
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
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonSpinner,
  IonToast,
} from '@ionic/vue';
import { useDataFetching, useToast } from '@/composables';
import { plansService, workoutsService } from '@/services';
import PageContainer from '@/components/PageContainer.vue';
import LoadingState from '@/components/LoadingState.vue';
import CustomSelect from '@/components/CustomSelect.vue';
import type { Plan } from '@/types/api';

const router = useRouter();
const starting = ref(false);
const selectedPlanId = ref<string>('auto');

// Use composables
const { data: plans, loading, error, execute } = useDataFetching(
  () => plansService.getAll(),
  { immediate: true }
);

const { showError, showSuccess } = useToast();

// Computed property for plan options
const planOptions = computed(() => {
  const options = [
    { value: 'auto', label: 'Автоматический выбор' }
  ];
  
  if (plans.value) {
    plans.value.forEach((plan: Plan) => {
      if (plan.is_active) {
        options.push({
          value: plan.id.toString(),
          label: plan.name
        });
      }
    });
  }
  
  return options;
});

const onPlanChange = (value: any) => {
  selectedPlanId.value = value;
};

const startWorkout = async () => {
  starting.value = true;
  
  try {
    const workout = await workoutsService.start(selectedPlanId.value);
    
    window.dispatchEvent(new CustomEvent('workout-started', { 
      detail: { workoutId: workout.id } 
    }));
    
    await showSuccess('Тренировка начата!');
    router.push(`/workout/${workout.id}`);
  } catch (err) {
    await showError('Не удалось начать тренировку');
  } finally {
    starting.value = false;
  }
};

const clearError = () => {
  // Error handled by useDataFetching
};
</script>

<style scoped>
.start-workout-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: var(--ion-color-medium);
}

.workout-info {
  margin-bottom: 2rem;
}

.plan-selection {
  padding: 0 16px;
  margin-bottom: 2rem;
}

.workout-icon {
  font-size: 4rem;
  color: var(--ion-color-primary);
  margin-bottom: 1rem;
}

.workout-info h2 {
  color: #FFFFFF;
  margin-bottom: 1rem;
}

.workout-info p {
  color: var(--ion-color-medium);
  line-height: 1.5;
}

</style>
