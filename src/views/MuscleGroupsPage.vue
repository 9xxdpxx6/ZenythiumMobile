<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="router.back()">
            <i class="fas fa-arrow-left"></i>
          </ion-button>
        </ion-buttons>
        <ion-title>Группы мышц</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="page-content">
        <div v-if="loading" class="loading-state">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Загрузка групп мышц...</p>
        </div>

        <div v-else-if="muscleGroups.length > 0" class="muscle-groups-container">
          <div class="muscle-groups-header">
            <h1>Группы мышц</h1>
            <p>{{ muscleGroups.length }} групп мышц</p>
          </div>

          <div class="muscle-groups-list">
            <div 
              v-for="muscleGroup in muscleGroups" 
              :key="muscleGroup.id"
              class="muscle-group-card modern-card"
            >
              <div class="muscle-group-header">
                <div class="muscle-group-info">
                  <h3 class="muscle-group-name">{{ muscleGroup.name }}</h3>
                  <div class="muscle-group-count">
                    {{ muscleGroup.exercises_count }} упражнений
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <i class="fas fa-muscle empty-icon"></i>
          <h2>Нет групп мышц</h2>
          <p>Группы мышц не найдены</p>
        </div>
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
  IonButton,
  IonSpinner,
  IonToast,
} from '@ionic/vue';
import { DataService } from '@/services/data';
import { MuscleGroupResource } from '@/types/api';

const router = useRouter();
const muscleGroups = ref<MuscleGroupResource[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const clearError = () => {
  error.value = null;
};

const fetchMuscleGroups = async () => {
  loading.value = true;
  try {
    const response = await DataService.getMuscleGroups();
    muscleGroups.value = response.data;
  } catch (err: any) {
    error.value = err.message || 'Ошибка загрузки групп мышц';
    console.error('Failed to fetch muscle groups:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchMuscleGroups();
});
</script>

<style scoped>
.page-content {
  padding: 16px !important;
  margin: 0 !important;
  padding-top: 16px !important;
  padding-bottom: 80px !important;
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
  font-size: 3rem;
  margin-bottom: 0.5rem;
  color: var(--ion-color-primary);
}

.empty-state h2 {
  margin: 0 0 6px 0;
  font-size: 1.3rem;
  color: var(--ion-text-color);
}

.empty-state p {
  margin: 0;
  font-size: 0.9rem;
}

.muscle-groups-container {
  padding: 0;
}

.muscle-groups-header {
  margin: 0 0 16px 0 !important;
}

.muscle-groups-header h1 {
  margin: 0 0 4px 0;
  font-size: 1.5rem;
  color: var(--ion-text-color);
}

.muscle-groups-header p {
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 0.9rem;
}

.muscle-groups-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.muscle-group-card {
  margin: 0 !important;
}

.muscle-group-header {
  display: flex;
  align-items: center;
}

.muscle-group-info {
  flex: 1;
}

.muscle-group-name {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.muscle-group-count {
  font-size: 14px;
  color: var(--ion-color-medium);
}
</style>
