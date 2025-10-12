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
             <p>{{ user.email }}</p>
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
import { User } from '@/types/api';

const router = useRouter();
const { user, logout, fetchUser, loading, error, clearError } = useAuth();
const loggingOut = ref(false);

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

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

onMounted(() => {
  fetchUser();
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
  margin-bottom: 2rem;
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
</style>
