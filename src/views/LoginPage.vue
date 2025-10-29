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

          <form @submit.prevent="handleSubmit(onSubmit)" novalidate>
            <CustomInput
              v-model="form.email"
              label="Email"
              type="email"
              placeholder="Введите email"
              :error="touched.email && !!errors.email"
              :error-message="touched.email ? errors.email : undefined"
              @blur="() => setFieldTouched('email')"
            />

            <CustomInput
              v-model="form.password"
              label="Пароль"
              type="password"
              placeholder="Введите пароль"
              :error="touched.password && !!errors.password"
              :error-message="touched.password ? errors.password : undefined"
              @blur="() => setFieldTouched('password')"
            />

            <ion-button
              expand="block"
              type="submit"
              :disabled="isSubmitting || authLoading"
              class="auth-button"
            >
              <ion-spinner v-if="isSubmitting || authLoading" name="crescent"></ion-spinner>
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
import { useAuth, useForm, useToast } from '@/composables';
import { LoginRequest } from '@/types/api';
import CustomInput from '@/components/ui/CustomInput.vue';
import { validators } from '@/utils/validators';

const router = useRouter();
const { login, loading: authLoading, error, clearError } = useAuth();
const { showError } = useToast();

const { values: form, handleSubmit, isSubmitting, errors, touched, setFieldTouched } = useForm<LoginRequest>({
  email: '',
  password: '',
}, {
  email: [validators.required, validators.email],
  password: [validators.required],
});

const onSubmit = async (values: LoginRequest) => {
  const success = await login(values);
  if (success) {
    router.push('/tabs/home');
  }
};
</script>

<style scoped>
/* Стили теперь в глобальном файле modern-dark.css */
</style>
