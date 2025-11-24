<template>
  <ion-page>
    <PageHeader 
      title="Профиль"
      :end-button="{
        icon: 'fas fa-cog',
        onClick: openSettingsModal,
        class: 'settings-button'
      }"
    />

    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>
      <PageContainer>
        <h1 class="page-title">Профиль</h1>

        <LoadingState v-if="loading || userLoading" message="Загрузка профиля..." />

         <div v-else-if="user">
           <div class="profile-header modern-card">
             <div class="profile-avatar">
               <i class="fas fa-user"></i>
             </div>
             <h1>{{ user.name }}</h1>
           </div>

           <ProfileStatistics :statistics="statistics" />

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

         </div>

         <div v-else class="empty-state">
           <i class="fas fa-user empty-icon"></i>
           <h2>Профиль недоступен</h2>
           <p>Не удалось загрузить данные профиля</p>
         </div>
      </PageContainer>
    </ion-content>

    <!-- Settings Modal -->
    <SettingsModal
      :is-open="settingsModal.isOpen.value"
      :current-name="user?.name"
      @close="settingsModal.close"
      @name-changed="handleNameChanged"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
} from '@ionic/vue';
import { useAuth } from '@/composables/useAuth';
import { useDataFetching, useToast, useModal } from '@/composables';
import { statisticsService } from '@/services';
import PageContainer from '@/components/ui/PageContainer.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import LoadingState from '@/components/ui/LoadingState.vue';
import ProfileStatistics from '@/components/charts/ProfileStatistics.vue';
import SettingsModal from '@/components/modals/SettingsModal.vue';

const router = useRouter();
const { user, fetchUser, loading } = useAuth();
const userLoading = ref(true);

// Settings modal
const settingsModal = useModal();

// Fetch statistics
const { data: statistics, execute: fetchStatistics } = useDataFetching(
  async () => {
    return await statisticsService.getOverview();
  },
  { immediate: true, skipIfDataExists: true, cacheKey: 'profile_statistics' }
);

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

const handleRefresh = async (event: CustomEvent) => {
  await fetchUser();
  await fetchStatistics();
  event.detail.complete();
};

const openSettingsModal = () => {
  settingsModal.open();
};

const handleNameChanged = async () => {
  await fetchUser();
};

onMounted(async () => {
  try {
    await fetchUser();
  } finally {
    userLoading.value = false;
  }
  // fetchStatistics уже вызывается автоматически через useDataFetching с immediate: true
});
</script>

<style scoped>
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
  margin: 0 0 24px 0 !important;
  padding: 0 16px !important;
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
  margin: 0;
}

.logout-button {
  background: var(--ion-color-danger);
}

.modern-button.logout-button:hover:not(:disabled) { background: var(--ion-color-danger); }

.navigation-section {
  margin: 0;
  margin-bottom: 24px;
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
  transition: none;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  justify-content: flex-start;
}

.nav-button:hover { background: var(--ion-color-primary); }

.nav-button i {
  font-size: 18px;
}
</style>
