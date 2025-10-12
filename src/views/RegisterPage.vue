<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Регистрация</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" :scroll-y="false">
      <div class="auth-page register-page">
        <div class="auth-form">
          <h1 class="auth-title">Создать аккаунт</h1>
          <p class="auth-subtitle">Заполните форму для регистрации</p>

          <form @submit.prevent="handleRegister">
            <CustomInput
              v-model="form.name"
              label="Имя"
              type="text"
              placeholder="Введите имя"
              required
            />

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

            <CustomInput
              v-model="form.password_confirmation"
              label="Подтверждение пароля"
              type="password"
              placeholder="Подтвердите пароль"
              required
            />

            <ion-button
              expand="block"
              type="submit"
              :disabled="loading || !isFormValid"
              class="auth-button"
            >
              <ion-spinner v-if="loading" name="crescent"></ion-spinner>
              <span v-else>Зарегистрироваться</span>
            </ion-button>
          </form>

          <div class="auth-link">
            <p>Уже есть аккаунт?</p>
            <ion-button fill="clear" @click="$router.push('/login')">
              Войти
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
import { ref, computed } from 'vue';
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
import { RegisterRequest } from '@/types/api';

const router = useRouter();
const { register, loading, error, clearError } = useAuth();

const form = ref<RegisterRequest>({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
});

const isFormValid = computed(() => {
  return (
    form.value.name &&
    form.value.email &&
    form.value.password &&
    form.value.password_confirmation &&
    form.value.password === form.value.password_confirmation &&
    form.value.password.length >= 6
  );
});

const handleRegister = async () => {
  if (!isFormValid.value) {
    return;
  }

  const success = await register(form.value);
  if (success) {
    router.push('/tabs/home');
  }
};
</script>

<style scoped>
/* Стили теперь в глобальном файле modern-dark.css */
</style>
