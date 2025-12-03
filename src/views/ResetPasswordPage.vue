<template>
  <ion-page>
    <PageHeader title="Сброс пароля" />

    <ion-content :fullscreen="true" :scroll-y="false">
      <div class="auth-page">
        <div class="auth-form">
          <h1 class="auth-title">Новый пароль</h1>
          <p class="auth-subtitle">Введите новый пароль для вашего аккаунта</p>

          <div v-if="error" class="auth-error">
            <i class="fas fa-exclamation-triangle"></i>
            {{ error }}
          </div>

          <div v-if="success" class="auth-success">
            <i class="fas fa-check-circle"></i>
            {{ success }}
          </div>

          <form v-if="!success && hasValidParams" @submit.prevent="handleSubmit(onSubmit)" novalidate>
            <CustomInput
              v-model="form.password"
              label="Новый пароль"
              type="password"
              placeholder="Введите новый пароль"
              :error="touched.password && !!errors.password"
              :error-message="touched.password ? errors.password : undefined"
              @blur="() => setFieldTouched('password')"
            />

            <CustomInput
              v-model="form.password_confirmation"
              label="Подтверждение пароля"
              type="password"
              placeholder="Подтвердите новый пароль"
              :error="touched.password_confirmation && !!errors.password_confirmation"
              :error-message="touched.password_confirmation ? errors.password_confirmation : undefined"
              @blur="() => setFieldTouched('password_confirmation')"
            />

            <ion-button
              expand="block"
              type="submit"
              :disabled="isSubmitting || resetLoading"
              class="auth-button"
            >
              <ion-spinner v-if="isSubmitting || resetLoading" name="crescent"></ion-spinner>
              <span v-else>Сбросить пароль</span>
            </ion-button>
          </form>

          <div v-if="!hasValidParams" class="auth-error">
            <i class="fas fa-exclamation-triangle"></i>
            Неверная или истекшая ссылка для сброса пароля
          </div>

          <div v-if="success" class="auth-link">
            <ion-button expand="block" @click="goToLogin" class="auth-button">
              Перейти к входу
            </ion-button>
          </div>

          <div v-if="!success && hasValidParams" class="auth-link">
            <p>Вспомнили пароль?</p>
            <ion-button fill="clear" @click="$router.push('/login')">
              Войти
            </ion-button>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  IonPage,
  IonContent,
  IonButton,
  IonSpinner,
} from '@ionic/vue';
import { useForm } from '@/composables';
import { ResetPasswordRequest } from '@/types/api';
import { AuthService } from '@/services';
import CustomInput from '@/components/ui/CustomInput.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import { validators } from '@/utils/validators';
import { useToast } from '@/composables/useToast';

const router = useRouter();
const route = useRoute();
const { showError, showSuccess } = useToast();

const resetLoading = ref<boolean>(false);
const error = ref<string>('');
const success = ref<string>('');

// Получаем token и email из query параметров
const token = ref<string>('');
const email = ref<string>('');

const hasValidParams = computed(() => {
  return !!(token.value && email.value);
});

const passwordRef = ref('');

const passwordMatchValidator = (value: string): string | true => {
  return value === passwordRef.value || 'Пароли должны совпадать';
};

const updatePasswordRef = (value: string): true => {
  passwordRef.value = value;
  return true;
};

const { values: form, handleSubmit, isSubmitting, errors, touched, setFieldTouched } = useForm<Omit<ResetPasswordRequest, 'token' | 'email'>>(
  {
    password: '',
    password_confirmation: '',
  },
  {
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

onMounted(() => {
  // Извлекаем параметры из query (приходят из deeplink или прямого URL)
  const urlToken = route.query.token as string;
  const urlEmail = route.query.email as string;

  if (urlToken && urlEmail) {
    token.value = urlToken;
    email.value = decodeURIComponent(urlEmail);
  }
});

const onSubmit = async (values: Omit<ResetPasswordRequest, 'token' | 'email'>) => {
  if (!hasValidParams.value) {
    error.value = 'Неверная или истекшая ссылка для сброса пароля';
    return;
  }

  error.value = '';
  resetLoading.value = true;

  try {
    const payload: ResetPasswordRequest = {
      token: token.value,
      email: email.value,
      password: values.password.trim(),
      password_confirmation: values.password_confirmation.trim(),
    };

    await AuthService.resetPassword(payload);
    success.value = 'Пароль успешно изменен. Теперь вы можете войти с новым паролем.';
    showSuccess('Пароль успешно изменен');
    
    // Автоматический редирект на логин через 3 секунды
    setTimeout(() => {
      router.replace('/login');
    }, 3000);
  } catch (err: any) {
    const apiError = err as { message?: string; errors?: Record<string, string[]> };
    
    if (apiError.errors) {
      // Обработка валидационных ошибок
      if (apiError.errors.password && apiError.errors.password.length > 0) {
        error.value = apiError.errors.password[0];
      } else if (apiError.errors.token && apiError.errors.token.length > 0) {
        error.value = apiError.errors.token[0];
      } else if (apiError.errors.email && apiError.errors.email.length > 0) {
        error.value = apiError.errors.email[0];
      } else if (apiError.message) {
        error.value = apiError.message;
      } else {
        error.value = 'Ошибка при сбросе пароля';
      }
    } else if (apiError.message) {
      error.value = apiError.message;
    } else {
      error.value = 'Ошибка при сбросе пароля';
    }
    
    showError(error.value);
  } finally {
    resetLoading.value = false;
  }
};

const goToLogin = () => {
  router.replace('/login');
};
</script>

<style scoped>
.auth-error {
  background: rgba(244, 67, 54, 0.1);
  border: 1px solid rgba(244, 67, 54, 0.3);
  color: #f44336;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.auth-success {
  background: rgba(76, 175, 80, 0.1);
  border: 1px solid rgba(76, 175, 80, 0.3);
  color: #4caf50;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>

