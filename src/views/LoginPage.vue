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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonContent,
  IonButton,
  IonSpinner,
  IonToast,
} from '@ionic/vue';
import { useAuth, useForm, useToast, useModal } from '@/composables';
import { LoginRequest, ForgotPasswordRequest } from '@/types/api';
import { AuthService } from '@/services';
import CustomInput from '@/components/ui/CustomInput.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import ForgotPasswordModal from '@/components/modals/ForgotPasswordModal.vue';
import { validators } from '@/utils/validators';

const router = useRouter();
const { login, loading: authLoading, error, clearError } = useAuth();
const { showError, showSuccess } = useToast();

// Forgot password modal
const forgotPasswordModal = useModal();
const forgotPasswordError = ref<string>('');
const forgotPasswordSuccess = ref<string>('');
const forgotPasswordLoading = ref<boolean>(false);

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
</style>
