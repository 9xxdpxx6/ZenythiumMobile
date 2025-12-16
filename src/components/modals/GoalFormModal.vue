<template>
  <ion-modal :is-open="isOpen" @willDismiss="handleClose">
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ isEditing ? 'Редактировать цель' : 'Создать цель' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleClose">
            <i class="fas fa-times"></i>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="modal-content">
      <div class="goal-form">
        <div v-if="error" class="modal-error">
          <i class="fas fa-exclamation-triangle"></i>
          {{ error }}
        </div>
        
        <div class="form-group">
          <label class="form-label">Тип цели</label>
          <CustomSelect
            v-model="localFormData.type"
            :options="goalTypeOptions"
            placeholder="Выберите тип цели"
            search-placeholder="Поиск типа цели..."
            @update:model-value="handleTypeChange"
          />
        </div>

        <div v-if="localShowExerciseField" class="form-group">
          <label class="form-label">Упражнение</label>
          <CustomSelect
            v-model="localFormData.exercise_id"
            :options="exerciseOptions"
            placeholder="Выберите упражнение"
            search-placeholder="Поиск упражнения..."
            @update:model-value="updateFormData"
          />
        </div>

        <div class="form-group">
          <CustomInput
            v-model="localFormData.title"
            label="Название цели"
            type="text"
            placeholder="Введите название цели"
            @update:model-value="updateFormData"
          />
        </div>

        <div class="form-group">
          <CustomInput
            v-model="localFormData.target_value"
            label="Целевое значение"
            type="number"
            placeholder="Введите целевое значение"
            :min="0"
            step="0.01"
            @update:model-value="updateFormData"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Дата начала</label>
          <VueDatePicker
            v-model="localFormData.start_date"
            format="dd.MM.yyyy"
            placeholder="Выберите дату начала"
            :enable-time-picker="false"
            auto-apply
            :dark="true"
            locale="ru"
            :week-start="1"
            :month-name-format="'long'"
            :year-range="[2020, 2030]"
            @update:model-value="updateFormData"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Дата окончания</label>
          <VueDatePicker
            v-model="localFormData.end_date"
            format="dd.MM.yyyy"
            placeholder="Выберите дату окончания"
            :enable-time-picker="false"
            auto-apply
            :dark="true"
            :min-date="localFormData.start_date || undefined"
            locale="ru"
            :week-start="1"
            :month-name-format="'long'"
            :year-range="[2020, 2030]"
            @update:model-value="updateFormData"
          />
        </div>
        
        <div class="form-group">
          <CustomTextarea
            v-model="localFormData.description"
            label="Описание"
            placeholder="Добавьте описание цели"
            :rows="3"
            @update:model-value="updateFormData"
          />
        </div>
        
        <div class="form-actions">
          <ion-button 
            expand="block" 
            @click="handleSubmit"
            :disabled="!isFormValid || isSaving"
            class="save-btn"
          >
            <ion-spinner v-if="isSaving" name="crescent"></ion-spinner>
            <span v-else>{{ isEditing ? 'Сохранить изменения' : 'Создать цель' }}</span>
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
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
import CustomSelect from '@/components/ui/CustomSelect.vue';
import CustomTextarea from '@/components/ui/CustomTextarea.vue';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import type { GoalFormData } from '@/composables/useGoals';
import type { GoalTypeInfo } from '@/types/models/goal.types';
import { requiresExercise } from '@/constants/goal-types';

interface Props {
  isOpen: boolean;
  formData: GoalFormData;
  isEditing: boolean;
  isSaving: boolean;
  error: string;
  goalTypeOptions: Array<{ value: string; label: string }>;
  exerciseOptions: Array<{ value: number; label: string }>;
  showExerciseField: boolean;
  goalTypes?: GoalTypeInfo[];
}

interface Emits {
  (e: 'close'): void;
  (e: 'save', form: GoalFormData): void;
  (e: 'update:formData', value: GoalFormData): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const localFormData = ref<GoalFormData>({ ...props.formData });

watch(() => props.formData, (newData) => {
  localFormData.value = { ...newData };
}, { deep: true });

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    localFormData.value = { ...props.formData };
  }
});

// Compute showExerciseField locally based on current type selection
const localShowExerciseField = computed(() => {
  return localFormData.value.type && requiresExercise(localFormData.value.type, props.goalTypes);
});

const isFormValid = computed(() => {
  if (!localFormData.value.type) return false;
  if (!localFormData.value.title?.trim()) return false;
  if (!localFormData.value.target_value || parseFloat(localFormData.value.target_value) <= 0) return false;
  if (!localFormData.value.start_date) return false;
  // Use local computed value for exercise field requirement
  if (localShowExerciseField.value && (!localFormData.value.exercise_id || localFormData.value.exercise_id === '')) return false;
  return true;
});

const handleTypeChange = () => {
  // Reset exercise_id when type changes and no longer requires exercise
  const needsExercise = requiresExercise(localFormData.value.type, props.goalTypes);
  
  if (!needsExercise) {
    localFormData.value.exercise_id = '';
  }
  updateFormData();
};

const updateFormData = () => {
  emit('update:formData', { ...localFormData.value });
};

const handleClose = () => {
  emit('close');
};

const handleSubmit = () => {
  emit('save', { ...localFormData.value });
};
</script>

<style scoped>
.modal-content {
  --padding-start: 20px;
  --padding-end: 20px;
  --padding-top: 20px;
  --padding-bottom: 20px;
}

.goal-form {
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 16px;
  padding-bottom: 120px; /* Большой отступ снизу, чтобы пользователь не думал, что что-то спрятано */
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

.form-label {
  font-weight: 600;
  color: var(--ion-text-color);
  font-size: 14px;
  margin-bottom: 8px;
  display: block;
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

