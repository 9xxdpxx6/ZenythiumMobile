<template>
  <ion-modal :is-open="isOpen" @willDismiss="handleClose">
    <ion-header>
      <ion-toolbar>
        <ion-title>Смена пароля</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleClose">
            <i class="fas fa-times"></i>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="modal-content">
      <div class="password-form">
        <div v-if="error" class="modal-error">
          <i class="fas fa-exclamation-triangle"></i>
          {{ error }}
        </div>
        
        <form @submit.prevent="handleSubmit(onSubmit)" novalidate>
          <div class="form-group">
            <CustomInput
              v-model="localForm.current_password"
              label="Текущий пароль"
              type="password"
              placeholder="Введите текущий пароль"
              :error="touched.current_password && !!errors.current_password"
              :error-message="touched.current_password ? errors.current_password : undefined"
              @blur="() => setFieldTouched('current_password')"
            />
          </div>
          
          <div class="form-group">
            <CustomInput
              v-model="localForm.password"
              label="Новый пароль"
              type="password"
              placeholder="Введите новый пароль"
              :error="touched.password && !!errors.password"
              :error-message="touched.password ? errors.password : undefined"
              @blur="() => setFieldTouched('password')"
            />
          </div>
          
          <div class="form-group">
            <CustomInput
              v-model="localForm.password_confirmation"
              label="Подтверждение пароля"
              type="password"
              placeholder="Повторите новый пароль"
              :error="touched.password_confirmation && !!errors.password_confirmation"
              :error-message="touched.password_confirmation ? errors.password_confirmation : undefined"
              @blur="() => setFieldTouched('password_confirmation')"
            />
          </div>
          
          <div class="form-actions">
            <ion-button 
              expand="block" 
              type="submit"
              :disabled="isSubmitting"
              class="save-btn"
            >
              <ion-spinner v-if="isSubmitting" name="crescent"></ion-spinner>
              <span v-else>Изменить пароль</span>
            </ion-button>
          </div>
        </form>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { watch, computed } from 'vue';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonSpinner,
} from '@ionic/vue';
import CustomInput from '@/components/ui/CustomInput.vue';
import { useForm } from '@/composables/useForm';
import { validators } from '@/utils/validators';
import type { ChangePasswordRequest } from '@/types/api';

interface Props {
  isOpen: boolean;
  error?: string;
}

interface Emits {
  (e: 'close'): void;
  (e: 'submit', payload: ChangePasswordRequest): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const formResult = useForm<ChangePasswordRequest>({
  current_password: '',
  password: '',
  password_confirmation: '',
}, {
  current_password: [validators.required],
  password: [validators.required, validators.password],
  password_confirmation: [
    validators.required,
  ],
});

const { 
  values: localForm, 
  handleSubmit, 
  isSubmitting, 
  errors, 
  touched, 
  setFieldTouched,
  resetForm,
  validateField,
  setFieldError
} = formResult;

// Динамическая валидация password_confirmation
watch(() => [localForm.password, localForm.password_confirmation], () => {
  if (touched.password_confirmation) {
    if (localForm.password_confirmation && localForm.password_confirmation !== localForm.password) {
      setFieldError('password_confirmation', 'Должно совпадать с новым паролем');
    } else if (localForm.password_confirmation === localForm.password) {
      setFieldError('password_confirmation', null);
    }
  }
});

watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) {
    resetForm();
  }
});

const onSubmit = (values: ChangePasswordRequest) => {
  // Нормализация: trim строк
  const normalized: ChangePasswordRequest = {
    current_password: values.current_password.trim(),
    password: values.password.trim(),
    password_confirmation: values.password_confirmation.trim(),
  };
  emit('submit', normalized);
};

const handleClose = () => {
  emit('close');
};
</script>

<style scoped>
.modal-content {
  --padding-start: 20px;
  --padding-end: 20px;
  --padding-top: 20px;
  --padding-bottom: 20px;
}

.password-form {
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 16px; 
}

.modal-error {
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

.form-group {
  margin-bottom: 20px;
}

.form-actions {
  margin-top: 24px;
  padding: 8px 16px;
}

.save-btn {
  --border-radius: 12px;
  --padding-top: 14px;
  --padding-bottom: 14px;
  font-weight: 600;
  display: block;
  width: 100%;
}
</style>

