<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Профиль</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="page-content">
        <h1 class="page-title">Профиль</h1>

        <div v-if="loading" class="loading-state">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Загрузка профиля...</p>
        </div>

         <div v-else-if="user">
           <div class="profile-header modern-card">
             <div class="profile-avatar">
               <i class="fas fa-user"></i>
             </div>
             <h1>{{ user.name }}</h1>
           </div>

           <!-- Статистика пользователя -->
           <div v-if="statistics" class="statistics-section">
             <h2 class="section-title">Статистика</h2>
             
             <div class="quick-stats">
               <div class="stat-card modern-card">
                 <div class="stat-top">
                   <div class="stat-value">{{ statistics.total_workouts }}</div>
                   <i class="fas fa-dumbbell stat-icon"></i>
                 </div>
                 <div class="stat-content">
                   <h3>Всего тренировок</h3>
                 </div>
               </div>

               <div class="stat-card modern-card">
                 <div class="stat-top">
                   <div class="stat-value">{{ statistics.completed_workouts }}</div>
                   <i class="fas fa-check-circle stat-icon"></i>
                 </div>
                 <div class="stat-content">
                   <h3>Завершено</h3>
                 </div>
               </div>

               <div class="stat-card modern-card">
                 <div class="stat-top">
                   <div class="stat-value">{{ formatTime(statistics.total_training_time) }}</div>
                   <i class="fas fa-clock stat-icon"></i>
                 </div>
                 <div class="stat-content">
                   <h3>Время тренировок</h3>
                 </div>
               </div>

               <div class="stat-card modern-card">
                 <div class="stat-top">
                   <div class="stat-value">{{ formatWeight(statistics.total_volume) }}</div>
                   <i class="fas fa-weight stat-icon"></i>
                 </div>
                 <div class="stat-content">
                   <h3>Общий объем</h3>
                 </div>
               </div>

               <div class="stat-card modern-card">
                 <div class="stat-top">
                   <div class="stat-value">{{ (statistics as any).current_weight || 'N/A' }} кг</div>
                   <i class="fas fa-chart-line stat-icon"></i>
                 </div>
                 <div class="stat-content">
                   <h3>Текущий вес</h3>
                 </div>
               </div>

               <div class="stat-card modern-card">
                 <div class="stat-top">
                   <div class="stat-value">{{ statistics.training_frequency_4_weeks }}</div>
                   <i class="fas fa-calendar-week stat-icon"></i>
                 </div>
                 <div class="stat-content">
                   <h3>Тренировок/неделю</h3>
                 </div>
               </div>
             </div>
           </div>

           <!-- Кнопки навигации -->
           <div class="navigation-section">
             <button
               @click="navigateToExercises"
               class="modern-button nav-button"
             >
               <i class="fas fa-dumbbell"></i>
               <span>Упражнения</span>
             </button>

             <button
               @click="navigateToMuscleGroups"
               class="modern-button nav-button"
             >
               <i class="fas fa-shapes"></i>
               <span>Группы мышц</span>
             </button>
           </div>

           <div class="profile-info modern-card">
             <div class="info-item">
               <i class="fas fa-envelope"></i>
               <div class="info-content">
                 <h3>Email</h3>
                 <p>{{ user.email }}</p>
               </div>
             </div>

             <div class="info-item">
               <i class="fas fa-calendar"></i>
               <div class="info-content">
                 <h3>Дата регистрации</h3>
                 <p>{{ formatDate(user.created_at) }}</p>
               </div>
             </div>
           </div>

           <div class="logout-section">
             <button
               @click="handleLogout"
               :disabled="loggingOut"
               class="modern-button logout-button"
             >
               <ion-spinner v-if="loggingOut" name="crescent"></ion-spinner>
               <i v-else class="fas fa-sign-out-alt"></i>
               <span v-if="!loggingOut">Выйти</span>
             </button>
           </div>
         </div>

         <div v-else class="empty-state">
           <i class="fas fa-user empty-icon"></i>
           <h2>Профиль недоступен</h2>
           <p>Не удалось загрузить данные профиля</p>
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
  IonSpinner,
  IonToast,
} from '@ionic/vue';
import { useAuth } from '@/composables/useAuth';
import { DataService } from '@/services/data';
import { User, Statistics } from '@/types/api';

const router = useRouter();
const { user, logout, fetchUser, loading, error, clearError } = useAuth();
const loggingOut = ref(false);
const statistics = ref<Statistics | null>(null);
const statisticsLoading = ref(false);

const handleLogout = async () => {
  loggingOut.value = true;
  
  try {
    await logout();
    router.push('/login');
  } catch (err) {
    console.error('Logout error:', err);
  } finally {
    loggingOut.value = false;
  }
};

const navigateToExercises = () => {
  router.push('/exercises');
};

const navigateToMuscleGroups = () => {
  router.push('/muscle-groups');
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const formatTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}ч ${mins}м`;
  }
  return `${mins}м`;
};

const formatWeight = (volume: number | string) => {
  const numVolume = typeof volume === 'string' ? parseFloat(volume) : volume;
  if (isNaN(numVolume)) return '0 кг';
  
  if (numVolume >= 1000000) {
    return `${(numVolume / 1000000).toFixed(1)}М кг`;
  } else if (numVolume >= 1000) {
    return `${(numVolume / 1000).toFixed(1)}К кг`;
  }
  return `${numVolume} кг`;
};

const fetchStatistics = async () => {
  statisticsLoading.value = true;
  try {
    const response = await DataService.getUserStatistics();
    statistics.value = response.data;
  } catch (err) {
    console.error('Failed to fetch statistics:', err);
  } finally {
    statisticsLoading.value = false;
  }
};

onMounted(async () => {
  await fetchUser();
  await fetchStatistics();
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

.profile-header {
  text-align: center;
}

.profile-avatar {
  width: 60px;
  height: 60px;
  margin: 0 auto 0.8rem;
  background-color: var(--ion-color-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-avatar i {
  font-size: 1.5rem;
  color: white;
}

.profile-header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}

.profile-header p {
  margin: 0;
  color: var(--ion-color-medium);
}

.profile-info {
  margin-top: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.info-item:last-child {
  border-bottom: none;
}

.info-item i {
  font-size: 1.2rem;
  color: var(--ion-color-primary);
  margin-right: 12px;
  min-width: 20px;
}

.info-content h3 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-color-medium);
}

.info-content p {
  margin: 0;
  font-size: 16px;
  color: var(--ion-text-color);
}

.logout-section {
  margin-top: 20px;
  padding: 0 12px;
}

.modern-button {
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
  gap: 8px;
  width: 100%;
  justify-content: center;
}


.modern-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.logout-button {
  background: var(--ion-color-danger);
}


.modern-button i {
  font-size: 14px;
}

/* Statistics section */
.statistics-section {
  margin: 16px;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--ion-text-color);
}

.quick-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 18px !important;
  text-align: center;
  background: var(--ion-color-step-50);
  border-radius: 12px;
  margin: 0 !important;
  min-height: 100px;
}

.stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--ion-text-color);
  margin: 0;
  line-height: 1.2;
  white-space: nowrap;
}

.stat-content h3 {
  margin: 0;
  text-align: start;
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-color-medium);
  line-height: 1.2;
  height: 32px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
}

.stat-icon {
  font-size: 1.5rem;
  color: var(--ion-color-primary);
}

/* Цветные значения для карточек статистики */
.stat-card:nth-child(1) .stat-value {
  color: #10b981; /* Зеленый */
}

.stat-card:nth-child(2) .stat-value {
  color: #8b5cf6; /* Фиолетовый */
}

.stat-card:nth-child(3) .stat-value {
  color: #f59e0b; /* Оранжевый */
}

.stat-card:nth-child(4) .stat-value {
  color: #3b82f6; /* Синий */
}

.stat-card:nth-child(5) .stat-value {
  color: #ef4444; /* Красный */
}

.stat-card:nth-child(6) .stat-value {
  color: #06b6d4; /* Голубой */
}

/* Цветные иконки для карточек статистики */
.stat-card:nth-child(1) .stat-icon {
  color: #10b981; /* Зеленый */
}

.stat-card:nth-child(2) .stat-icon {
  color: #8b5cf6; /* Фиолетовый */
}

.stat-card:nth-child(3) .stat-icon {
  color: #f59e0b; /* Оранжевый */
}

.stat-card:nth-child(4) .stat-icon {
  color: #3b82f6; /* Синий */
}

.stat-card:nth-child(5) .stat-icon {
  color: #ef4444; /* Красный */
}

.stat-card:nth-child(6) .stat-icon {
  color: #06b6d4; /* Голубой */
}

/* Navigation section */
.navigation-section {
  margin: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.nav-button {
  background: var(--ion-color-primary);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 16px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  justify-content: flex-start;
}

.nav-button:hover {
  background: var(--ion-color-primary-shade);
}

.nav-button i {
  font-size: 18px;
}
</style>
