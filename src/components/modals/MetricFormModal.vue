<template>
  <ion-modal :is-open="isOpen" @willDismiss="handleClose">
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ isEditing ? 'Редактировать запись' : 'Добавить запись' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleClose">
            <i class="fas fa-times"></i>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="modal-content">
      <div class="metric-form">
        <div v-if="error" class="modal-error">
          <i class="fas fa-exclamation-triangle"></i>
          {{ error }}
        </div>
        
        <div class="form-group">
          <VueDatePicker
            v-model="localFormData.date"
            format="dd.MM.yyyy"
            placeholder="Дата измерения"
            :enable-time-picker="false"
            auto-apply
            :dark="true"
            :max-date="new Date()"
            locale="ru"
            :week-start="1"
            :month-name-format="'long'"
            :year-range="[2020, 2030]"
            @update:model-value="updateFormData"
          />
        </div>
        
        <div class="form-group">
          <CustomInput
            v-model="localFormData.weight"
            label="Вес (кг)"
            type="number"
            placeholder="Введите вес"
            :min="0"
            :max="1000"
            step="0.01"
            @update:model-value="updateFormData"
          />
        </div>
        
        <div class="form-group">
          <CustomTextarea
            v-model="localFormData.note"
            label="Заметка (необязательно)"
            placeholder="Добавьте заметку к измерению"
            :rows="3"
            @update:model-value="updateFormData"
          />
        </div>
        
        <div class="form-actions">
          <ion-button 
            expand="block" 
            @click="$emit('save')"
            :disabled="!localFormData.weight || !localFormData.date || isSaving"
            class="save-btn"
          >
            <ion-spinner v-if="isSaving" name="crescent"></ion-spinner>
            <span v-else>{{ isEditing ? 'Сохранить изменения' : 'Добавить запись' }}</span>
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
import CustomTextarea from '@/components/ui/CustomTextarea.vue';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import type { MetricFormData } from '@/composables/useMetrics';

interface Props {
  isOpen: boolean;
  formData: MetricFormData;
  isEditing: boolean;
  isSaving: boolean;
  error: string;
}

interface Emits {
  (e: 'close'): void;
  (e: 'save'): void;
  (e: 'update:formData', value: MetricFormData): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const localFormData = ref<MetricFormData>({ ...props.formData });

watch(() => props.formData, (newData) => {
  localFormData.value = { ...newData };
}, { deep: true });

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    localFormData.value = { ...props.formData };
  }
});

const updateFormData = () => {
  emit('update:formData', { ...localFormData.value });
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

.metric-form {
  max-width: 500px;
  margin: 0 auto;
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
}

.save-btn {
  --border-radius: 12px;
  --padding-top: 14px;
  --padding-bottom: 14px;
  font-weight: 600;
}
</style>


