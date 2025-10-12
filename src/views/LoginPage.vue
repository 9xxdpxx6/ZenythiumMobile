<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Вход</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" :scroll-y="false">
      <div class="auth-page">
        <div class="auth-form">
          <h1 class="auth-title">Добро пожаловать!</h1>
          <p class="auth-subtitle">Войдите в свой аккаунт</p>

          <form @submit.prevent="handleLogin">
            <CustomInput
              v-model="form.email"
              label="Email"
              type="email"
              placeholder="Введите email"
              required
            />

            <CustomInput
              v-model="form.password"
              label="Пароль"
              type="password"
              placeholder="Введите пароль"
              required
            />

            <ion-button
              expand="block"
              type="submit"
              :disabled="loading"
              class="auth-button"
            >
              <ion-spinner v-if="loading" name="crescent"></ion-spinner>
              <span v-else>Войти</span>
            </ion-button>
          </form>

          <div class="auth-link">
            <p>Нет аккаунта?</p>
            <ion-button fill="clear" @click="$router.push('/register')">
              Зарегистрироваться
            </ion-button>
          </div>
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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonSpinner,
  IonToast,
} from '@ionic/vue';
import { useAuth } from '@/composables/useAuth';
import { LoginRequest } from '@/types/api';

const router = useRouter();
const { login, loading, error, clearError } = useAuth();

const form = ref<LoginRequest>({
  email: '',
  password: '',
});

const handleLogin = async () => {
  const success = await login(form.value);
  if (success) {
    router.push('/tabs/home');
  }
};
</script>

<style scoped>
/* Стили теперь в глобальном файле modern-dark.css */
</style>
