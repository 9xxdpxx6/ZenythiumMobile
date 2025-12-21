<template>
  <ion-page>
    <PageHeader title="Вход" />

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
              <span v-else>Войти</span>
            </ion-button>
          </form>

          <div class="forgot-password-link">
            <ion-button fill="clear" @click="openForgotPasswordModal">
              Забыли пароль?
            </ion-button>
          </div>

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

    <!-- Forgot Password Modal -->
    <ForgotPasswordModal
      :is-open="forgotPasswordModal.isOpen.value"
      :error="forgotPasswordError"
      :success="forgotPasswordSuccess"
      :is-loading="forgotPasswordLoading"
      @close="handleForgotPasswordClose"
      @submit="handleForgotPassword"
    />
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
import { useAuth, useForm, useToast, useModal, useYandexCaptcha } from '@/composables';
import { LoginRequest, ForgotPasswordRequest } from '@/types/api';
import { AuthService } from '@/services';
import CustomInput from '@/components/ui/CustomInput.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import ForgotPasswordModal from '@/components/modals/ForgotPasswordModal.vue';
import { validators } from '@/utils/validators';

const router = useRouter();
const { login, loading: authLoading, error, clearError } = useAuth();
const { showError, showSuccess } = useToast();
const isNativePlatform = computed(() => Capacitor.isNativePlatform());
const isDevMode = computed(() => import.meta.env.DEV);
const { captchaContainerRef, getToken, reset: resetCaptcha } = useYandexCaptcha();
const captchaError = ref<string>('');

// Forgot password modal
const forgotPasswordModal = useModal();
const forgotPasswordError = ref<string>('');
const forgotPasswordSuccess = ref<string>('');
const forgotPasswordLoading = ref<boolean>(false);

// Form values without captcha token (captcha token is added on submit)
type LoginFormValues = Omit<LoginRequest, 'smartcaptcha_token'>;

const { values: form, handleSubmit, isSubmitting, errors, touched, setFieldTouched } = useForm<LoginFormValues>({
  email: '',
  password: '',
}, {
  email: [validators.required, validators.email],
  password: [validators.required],
});

const onSubmit = async (values: LoginFormValues) => {
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

  // Добавляем токен капчи только на веб-платформе
  const loginData: LoginRequest = {
    ...values,
    ...(captchaToken ? { smartcaptcha_token: captchaToken } : {}),
  };

  const success = await login(loginData);
  if (success) {
    if (!isNativePlatform.value && !isDevMode.value) {
      resetCaptcha(); // Сбрасываем капчу после успешного входа (только на вебе в продакшене)
    }
    router.push('/tabs/home');
  } else {
    // При ошибке сбрасываем капчу, чтобы пользователь прошел её снова (только на вебе в продакшене)
    if (!isNativePlatform.value && !isDevMode.value) {
      resetCaptcha();
    }
  }
};

const openForgotPasswordModal = () => {
  forgotPasswordError.value = '';
  forgotPasswordSuccess.value = '';
  forgotPasswordModal.open();
};

const handleForgotPasswordClose = () => {
  forgotPasswordModal.close();
  forgotPasswordError.value = '';
  forgotPasswordSuccess.value = '';
  forgotPasswordLoading.value = false;
};

const handleForgotPassword = async (payload: ForgotPasswordRequest) => {
  forgotPasswordError.value = '';
  forgotPasswordSuccess.value = '';
  forgotPasswordLoading.value = true;
  try {
    await AuthService.forgotPassword(payload);
    forgotPasswordSuccess.value = 'Ссылка для восстановления пароля отправлена на вашу почту';
  } catch (err: any) {
    const apiError = err as { message?: string; errors?: Record<string, string[]> };
    // Приоритет: errors.email, затем message
    if (apiError.errors?.email && apiError.errors.email.length > 0) {
      forgotPasswordError.value = apiError.errors.email[0];
    } else if (apiError.message) {
      forgotPasswordError.value = apiError.message;
    } else {
      forgotPasswordError.value = 'Ошибка при отправке запроса';
    }
  } finally {
    forgotPasswordLoading.value = false;
  }
};
</script>

<style scoped>
.forgot-password-link {
  margin-top: 12px;
  text-align: center;
}

.forgot-password-link ion-button {
  --color: var(--ion-color-primary);
  font-size: 14px;
  text-transform: none;
}

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
