<template>
  <ion-modal :is-open="isOpen" @willDismiss="handleClose">
    <ion-header>
      <ion-toolbar>
        <ion-title>Смена имени</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleClose">
            <i class="fas fa-times"></i>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="modal-content">
      <div class="name-form">
        <div v-if="error" class="modal-error">
          <i class="fas fa-exclamation-triangle"></i>
          {{ error }}
        </div>
        
        <form @submit.prevent="handleSubmit(onSubmit)" novalidate>
          <div class="form-group">
            <CustomInput
              v-model="localForm.name"
              label="Новое имя"
              type="text"
              placeholder="Введите новое имя"
              :error="touched.name && !!errors.name"
              :error-message="touched.name ? errors.name : undefined"
              @blur="() => setFieldTouched('name')"
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
              <span v-else>Изменить имя</span>
            </ion-button>
          </div>
        </form>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { watch } from 'vue';
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
import { VALIDATION_RULES } from '@/constants/validation-rules';
import type { UpdateUserNameRequest } from '@/types/api';

interface Props {
  isOpen: boolean;
  currentName?: string;
  error?: string;
}

interface Emits {
  (e: 'close'): void;
  (e: 'submit', payload: UpdateUserNameRequest): void;
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
  resetForm,
  setValues
} = useForm<UpdateUserNameRequest>({
  name: '',
}, {
  name: [
    validators.required,
    validators.minLength(VALIDATION_RULES.NAME_MIN_LENGTH),
    validators.maxLength(VALIDATION_RULES.NAME_MAX_LENGTH)
  ],
});

watch(() => props.isOpen, (isOpen) => {
  if (isOpen && props.currentName) {
    setValues({ name: props.currentName } as UpdateUserNameRequest);
  } else if (!isOpen) {
    resetForm();
  }
});

const onSubmit = (values: UpdateUserNameRequest) => {
  // Нормализация: trim строк
  const normalized: UpdateUserNameRequest = {
    name: values.name.trim(),
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

.name-form {
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

