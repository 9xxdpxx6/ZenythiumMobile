<template>
  <ion-modal :is-open="isOpen" @willDismiss="handleClose">
    <ion-header>
      <ion-toolbar>
        <ion-title>Восстановление пароля</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleClose">
            <i class="fas fa-times"></i>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="modal-content">
      <div class="forgot-password-form">
        <div v-if="error" class="modal-error">
          <i class="fas fa-exclamation-triangle"></i>
          {{ error }}
        </div>
        
        <div v-if="props.success" class="modal-success">
          <i class="fas fa-check-circle"></i>
          {{ props.success }}
        </div>
        
        <form v-if="!props.success" @submit.prevent="handleSubmit(onSubmit)" novalidate>
          <p class="form-description">
            Введите email, на который будет отправлена ссылка для восстановления пароля.
          </p>
          
          <div class="form-group">
            <CustomInput
              v-model="localForm.email"
              label="Email"
              type="email"
              placeholder="Введите email"
              :error="touched.email && !!errors.email"
              :error-message="touched.email ? errors.email : undefined"
              @blur="() => setFieldTouched('email')"
            />
          </div>
          
          <div class="form-actions">
            <ion-button 
              expand="block" 
              type="submit"
              :disabled="isSubmitting || props.isLoading"
              class="save-btn"
            >
              <ion-spinner v-if="isSubmitting || props.isLoading" name="crescent"></ion-spinner>
              <span v-else>Отправить ссылку</span>
            </ion-button>
          </div>
        </form>
        
        <div v-if="props.success" class="form-actions">
          <ion-button 
            expand="block" 
            @click="handleClose"
            class="save-btn"
          >
            Закрыть
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
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
import type { ForgotPasswordRequest } from '@/types/api';

interface Props {
  isOpen: boolean;
  error?: string;
  success?: string;
  isLoading?: boolean;
}

interface Emits {
  (e: 'close'): void;
  (e: 'submit', payload: ForgotPasswordRequest): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { 
  values: localForm, 
  handleSubmit, 
  isSubmitting, 
  errors, 
  touched, 
  setFieldTouched,
  resetForm 
} = useForm<ForgotPasswordRequest>({
  email: '',
}, {
  email: [validators.required, validators.email],
});

watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) {
    resetForm();
  }
});

const onSubmit = (values: ForgotPasswordRequest) => {
  // Нормализация: trim строк
  const normalized: ForgotPasswordRequest = {
    email: values.email.trim().toLowerCase(),
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

.forgot-password-form {
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

.modal-success {
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

.form-description {
  color: var(--ion-color-medium);
  margin-bottom: 20px;
  line-height: 1.5;
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

