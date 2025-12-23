<template>
  <ion-page>
    <PageHeader title="Регистрация" />

    <ion-content :fullscreen="true">
      <div class="auth-page register-page">
        <div class="auth-form">
          <h1 class="auth-title">Создать аккаунт</h1>
          <p class="auth-subtitle">Заполните форму для регистрации</p>

          <form @submit.prevent="handleSubmit(onSubmit)" novalidate>
            <CustomInput
              v-model="form.name"
              label="Имя"
              type="text"
              placeholder="Введите имя"
              :error="touched.name && !!errors.name"
              :error-message="touched.name ? errors.name : undefined"
              @blur="() => setFieldTouched('name')"
            />

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

            <CustomInput
              v-model="form.password_confirmation"
              label="Подтверждение пароля"
              type="password"
              placeholder="Подтвердите пароль"
              :error="touched.password_confirmation && !!errors.password_confirmation"
              :error-message="touched.password_confirmation ? errors.password_confirmation : undefined"
              @blur="() => setFieldTouched('password_confirmation')"
            />

            <!-- Yandex SmartCaptcha - only on web platform and in production -->
            <template v-if="!isNativePlatform && !isDevMode">
              <div ref="captchaContainerRef" class="captcha-container"></div>
              <div v-if="captchaError" class="captcha-error">
                {{ captchaError }}
              </div>
            </template>

            <ion-button
              expand="block"
              type="submit"
              :disabled="isSubmitting || authLoading"
              class="auth-button"
            >
              <ion-spinner v-if="isSubmitting || authLoading" name="crescent"></ion-spinner>
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
import { Capacitor } from '@capacitor/core';
import {
  IonPage,
  IonContent,
  IonButton,
  IonSpinner,
  IonToast,
} from '@ionic/vue';
import { useAuth, useForm, useToast, useYandexCaptcha } from '@/composables';
import { RegisterRequest } from '@/types/api';
import CustomInput from '@/components/ui/CustomInput.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import { validators } from '@/utils/validators';
import { normalizeValidationError } from '@/utils/validation-normalizer';

const router = useRouter();
const { register, loading: authLoading, error, clearError, validationErrors } = useAuth();
const { showError } = useToast();
const isNativePlatform = computed(() => Capacitor.isNativePlatform());
const isDevMode = computed(() => import.meta.env.DEV);
const { captchaContainerRef, getToken, reset: resetCaptcha } = useYandexCaptcha();
const captchaError = ref<string>('');

const passwordRef = ref('');

const passwordMatchValidator = (value: string): string | true => {
  return value === passwordRef.value || 'Пароли должны совпадать';
};

const updatePasswordRef = (value: string): true => {
  passwordRef.value = value;
  return true;
};

// Form values without captcha token (captcha token is added on submit)
type RegisterFormValues = Omit<RegisterRequest, 'smartcaptcha_token'>;

const { values: form, handleSubmit, isSubmitting, isValid, errors, touched, setFieldTouched, setFieldError } = useForm<RegisterFormValues>(
  {
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  },
  {
    name: validators.required,
    email: [validators.required, validators.email],
    password: [
      validators.required, 
      validators.password,
      updatePasswordRef
    ],
    password_confirmation: [
      validators.required,
      passwordMatchValidator
    ],
  }
);

const onSubmit = async (values: RegisterFormValues) => {
  captchaError.value = '';

  // Проверяем капчу только на веб-платформе и в продакшене
  let captchaToken: string | null = null;
  if (!isNativePlatform.value && !isDevMode.value) {
    captchaToken = getToken();
    if (!captchaToken) {
      captchaError.value = 'Пожалуйста, пройдите проверку капчи';
      return;
    }
  }

  // Clear previous form errors
  Object.keys(errors).forEach(key => {
    setFieldError(key as keyof RegisterFormValues, null);
  });

  // Добавляем токен капчи только на веб-платформе
  const registerData: RegisterRequest = {
    ...values,
    ...(captchaToken ? { smartcaptcha_token: captchaToken } : {}),
  };

  const success = await register(registerData);
  if (success) {
    if (!isNativePlatform.value && !isDevMode.value) {
      resetCaptcha(); // Сбрасываем капчу после успешной регистрации (только на вебе в продакшене)
    }
    // Use replace instead of push to avoid back button issues
    router.replace('/tabs/home');
  } else {
    if (!isNativePlatform.value && !isDevMode.value) {
      resetCaptcha(); // Сбрасываем капчу при ошибке (только на вебе в продакшене)
    }
    // Set validation errors from API response if available
    if (validationErrors.value) {
      Object.keys(validationErrors.value).forEach(field => {
        const fieldErrors = validationErrors.value![field];
        if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
          const rawError = fieldErrors[0];
          const normalizedError = normalizeValidationError(rawError, field);
          setFieldError(field as keyof RegisterFormValues, normalizedError);
        }
      });
    }
  }
};
</script>

<style scoped>
.captcha-container {
  margin: 16px 0;
  min-height: 65px;
  display: flex;
  justify-content: center;
  overflow: hidden;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
}

.captcha-container :deep(.smart-captcha) {
  border-radius: 12px;
  overflow: hidden;
}

.captcha-container :deep(.smart-captcha iframe) {
  border-radius: 12px;
}

.captcha-error {
  color: var(--ion-color-danger);
  font-size: 12px;
  margin-top: -12px;
  margin-bottom: 8px;
  text-align: center;
}
</style>
