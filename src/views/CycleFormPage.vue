<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="handleBack">
            <i class="fas fa-arrow-left"></i>
          </ion-button>
        </ion-buttons>
        <ion-title>{{ isEditMode ? 'Редактировать цикл' : 'Создать цикл' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="page-content">
        <h1 class="page-title">{{ isEditMode ? 'Редактирование цикла' : 'Новый цикл' }}</h1>
        <p class="page-subtitle">{{ isEditMode ? 'Обновите информацию о цикле тренировок' : 'Создайте новый тренировочный цикл' }}</p>

        <div v-if="loading" class="loading-state">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Загрузка...</p>
        </div>

        <form v-else @submit.prevent="handleSubmit" class="cycle-form">
          <div class="form-group">
            <label for="name">Название цикла *</label>
            <ion-input
              id="name"
              v-model="formData.name"
              type="text"
              placeholder="Например: Набор массы"
              :class="{ 'input-error': errors.name }"
              required
            ></ion-input>
            <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
          </div>

          <div class="form-group">
            <label for="weeks">Количество недель *</label>
            <ion-input
              id="weeks"
              v-model.number="formData.weeks"
              type="number"
              placeholder="Например: 6"
              min="1"
              max="52"
              :class="{ 'input-error': errors.weeks }"
              required
            ></ion-input>
            <span v-if="errors.weeks" class="error-message">{{ errors.weeks }}</span>
          </div>

          <div class="form-group">
            <label for="start_date">Дата начала (необязательно)</label>
            <ion-input
              id="start_date"
              v-model="formData.start_date"
              type="date"
              :class="{ 'input-error': errors.start_date }"
            ></ion-input>
            <span v-if="errors.start_date" class="error-message">{{ errors.start_date }}</span>
          </div>

          <div class="form-group">
            <label for="end_date">Дата окончания (необязательно)</label>
            <ion-input
              id="end_date"
              v-model="formData.end_date"
              type="date"
              :class="{ 'input-error': errors.end_date }"
              :min="formData.start_date"
            ></ion-input>
            <span v-if="errors.end_date" class="error-message">{{ errors.end_date }}</span>
            <span class="field-hint">Если указана дата начала, дата окончания должна быть позже</span>
          </div>

          <div class="form-actions">
            <button
              type="submit"
              class="modern-button primary-button"
              :disabled="submitting"
            >
              <ion-spinner v-if="submitting" name="crescent"></ion-spinner>
              <span v-else>
                <i :class="isEditMode ? 'fas fa-save' : 'fas fa-plus'"></i>
                {{ isEditMode ? 'Сохранить' : 'Создать цикл' }}
              </span>
            </button>

            <button
              type="button"
              class="modern-button secondary-button"
              @click="handleBack"
              :disabled="submitting"
            >
              <i class="fas fa-times"></i>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonInput,
  IonSpinner,
  toastController,
} from '@ionic/vue';
import apiClient from '@/services/api';
import { ApiError } from '@/types/api';

interface CycleFormData {
  name: string;
  weeks: number | null;
  start_date: string;
  end_date: string;
}

interface ValidationErrors {
  name?: string;
  weeks?: string;
  start_date?: string;
  end_date?: string;
}

const router = useRouter();
const route = useRoute();

const cycleId = computed(() => route.params.id as string);
const isEditMode = computed(() => cycleId.value && cycleId.value !== 'new');

const loading = ref(false);
const submitting = ref(false);
const errors = ref<ValidationErrors>({});

const formData = ref<CycleFormData>({
  name: '',
  weeks: null,
  start_date: '',
  end_date: '',
});

const fetchCycleData = async () => {
  if (!isEditMode.value) return;

  loading.value = true;
  try {
    const response = await apiClient.get(`/api/v1/cycles/${cycleId.value}`);
    const cycle = response.data.data;

    formData.value = {
      name: cycle.name || '',
      weeks: cycle.weeks || null,
      start_date: cycle.start_date ? cycle.start_date.split('T')[0] : '',
      end_date: cycle.end_date ? cycle.end_date.split('T')[0] : '',
    };
  } catch (err) {
    console.error('Failed to fetch cycle:', err);
    const toast = await toastController.create({
      message: 'Не удалось загрузить данные цикла',
      duration: 3000,
      color: 'danger',
    });
    await toast.present();
    router.back();
  } finally {
    loading.value = false;
  }
};

const validateForm = (): boolean => {
  errors.value = {};
  let isValid = true;

  if (!formData.value.name || formData.value.name.trim().length === 0) {
    errors.value.name = 'Название цикла обязательно';
    isValid = false;
  } else if (formData.value.name.trim().length < 3) {
    errors.value.name = 'Название должно содержать минимум 3 символа';
    isValid = false;
  }

  if (!formData.value.weeks || formData.value.weeks < 1) {
    errors.value.weeks = 'Укажите количество недель (минимум 1)';
    isValid = false;
  } else if (formData.value.weeks > 52) {
    errors.value.weeks = 'Максимальное количество недель: 52';
    isValid = false;
  }

  if (formData.value.start_date && formData.value.end_date) {
    const startDate = new Date(formData.value.start_date);
    const endDate = new Date(formData.value.end_date);
    
    if (endDate <= startDate) {
      errors.value.end_date = 'Дата окончания должна быть позже даты начала';
      isValid = false;
    }
  }

  return isValid;
};

const handleSubmit = async () => {
  if (!validateForm()) {
    const toast = await toastController.create({
      message: 'Пожалуйста, исправьте ошибки в форме',
      duration: 2000,
      color: 'warning',
    });
    await toast.present();
    return;
  }

  submitting.value = true;
  errors.value = {};

  try {
    const payload: any = {
      name: formData.value.name.trim(),
      weeks: formData.value.weeks,
    };

    if (formData.value.start_date) {
      payload.start_date = formData.value.start_date;
    }

    if (formData.value.end_date) {
      payload.end_date = formData.value.end_date;
    }

    if (isEditMode.value) {
      await apiClient.put(`/api/v1/cycles/${cycleId.value}`, payload);
      const toast = await toastController.create({
        message: 'Цикл успешно обновлен',
        duration: 2000,
        color: 'success',
      });
      await toast.present();
    } else {
      await apiClient.post('/api/v1/cycles', payload);
      const toast = await toastController.create({
        message: 'Цикл успешно создан',
        duration: 2000,
        color: 'success',
      });
      await toast.present();
    }

    router.push('/tabs/cycles');
  } catch (err) {
    console.error('Failed to save cycle:', err);
    const apiError = err as ApiError;
    
    if (apiError.errors) {
      errors.value = apiError.errors;
    }

    const toast = await toastController.create({
      message: apiError.message || `Не удалось ${isEditMode.value ? 'обновить' : 'создать'} цикл`,
      duration: 3000,
      color: 'danger',
    });
    await toast.present();
  } finally {
    submitting.value = false;
  }
};

const handleBack = () => {
  router.back();
};

onMounted(() => {
  if (isEditMode.value) {
    fetchCycleData();
  }
});
</script>

<style scoped>
.page-content {
  padding: 16px !important;
  padding-bottom: 80px !important;
  max-width: 600px;
  margin: 0 auto;
}

.page-title {
  font-size: 22px !important;
  font-weight: 700 !important;
  color: var(--ion-text-color) !important;
  margin: 0 0 6px 0 !important;
  padding-left: 0 !important;
}

.page-subtitle {
  font-size: 13px !important;
  color: var(--ion-color-medium) !important;
  margin: 0 0 12px 0 !important;
  padding-left: 0 !important;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  color: var(--ion-color-medium);
}

.loading-state ion-spinner {
  margin-bottom: 1rem;
}

.cycle-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.form-group ion-input {
  --padding-start: 16px !important;
  --padding-end: 16px !important;
  --border-width: 0 !important;
  --border-style: none !important;
  --border-color: transparent !important;
  --background: rgba(255, 255, 255, 0.05) !important;
  --color: var(--ion-text-color) !important;
  --placeholder-color: var(--ion-color-medium) !important;
  border-radius: 12px !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  padding: 0 !important;
  margin: 0 !important;
  width: 100% !important;
  box-sizing: border-box !important;
  height: 48px !important;
}

.form-group ion-input::part(native) {
  padding: 0 !important;
  border: none !important;
  border-radius: 12px !important;
  background: transparent !important;
  height: 100% !important;
  display: flex !important;
  align-items: center !important;
}

.form-group ion-input:focus-within {
  border-color: var(--ion-color-primary) !important;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2) !important;
}

.form-group ion-input.input-error {
  border-color: var(--ion-color-danger) !important;
}

.error-message {
  font-size: 12px;
  color: var(--ion-color-danger);
  margin-top: 4px;
}

.field-hint {
  font-size: 12px;
  color: var(--ion-color-medium);
  margin-top: 4px;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
}

.modern-button {
  background: var(--ion-color-primary);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 14px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 48px;
}

.modern-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modern-button.primary-button {
  background: var(--ion-color-primary);
}

.modern-button.secondary-button {
  background: rgba(255, 255, 255, 0.1);
  color: var(--ion-text-color);
}

.modern-button i {
  font-size: 16px;
}

.modern-button ion-spinner {
  width: 20px;
  height: 20px;
}

ion-toolbar ion-button i {
  font-size: 20px;
  color: var(--ion-color-primary);
}
</style>

