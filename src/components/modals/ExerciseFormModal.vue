<template>
  <ion-modal :is-open="isOpen" @didDismiss="$emit('close')">
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ isEditing ? 'Редактировать упражнение' : 'Создать упражнение' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="$emit('close')">
            <i class="fas fa-times"></i>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="modal-content">
        <form @submit.prevent="handleSubmit" class="exercise-form">
        <CustomInput
          v-model="localForm.name"
          label="Название упражнения *"
          placeholder="Введите название упражнения"
          :error="!!errors?.name"
          :error-message="errors?.name?.[0]"
        />

        <div class="form-group">
          <label class="form-label">Группа мышц *</label>
          <CustomSelect
            v-model="localForm.muscle_group_id"
            :options="muscleGroupOptions"
            placeholder="Выберите группу мышц"
            search-placeholder="Поиск группы мышц..."
          />
          <div v-if="errors?.muscle_group_id" class="error-message">{{ errors.muscle_group_id[0] }}</div>
        </div>

        <CustomTextarea
          v-model="localForm.description"
          label="Описание"
          placeholder="Описание упражнения (необязательно)"
          :rows="3"
        />

        <div class="form-group">
          <label class="form-label">Статус</label>
          <div class="checkbox-container">
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="localForm.is_active"
                class="checkbox-input"
              />
              <span class="checkbox-text">Активное упражнение</span>
            </label>
          </div>
        </div>

        <div class="form-actions">
          <ion-button 
            type="button" 
            fill="outline" 
            @click="$emit('close')"
            :disabled="submitting"
            expand="block"
          >
            Отмена
          </ion-button>
          <ion-button 
            type="submit" 
            :disabled="submitting"
            class="submit-button"
            expand="block"
          >
            <ion-spinner v-if="submitting" name="crescent"></ion-spinner>
            {{ isEditing ? 'Сохранить' : 'Создать' }}
          </ion-button>
        </div>
      </form>
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
  IonButtons,
  IonButton,
  IonSpinner,
} from '@ionic/vue';
import CustomInput from '@/components/ui/CustomInput.vue';
import CustomSelect from '@/components/ui/CustomSelect.vue';
import CustomTextarea from '@/components/ui/CustomTextarea.vue';

interface Props {
  isOpen: boolean;
  form: {
    name: string;
    description: string;
    muscle_group_id: number | string;
    is_active: boolean;
  };
  errors?: Record<string, string[]>;
  muscleGroupOptions: Array<{ value: number; label: string }>;
  isEditing: boolean;
  submitting: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  submit: [form: {
    name: string;
    description: string;
    muscle_group_id: number | string;
    is_active: boolean;
  }];
}>();

const localForm = ref({ ...props.form });

watch(() => props.form, (newForm) => {
  Object.assign(localForm.value, newForm);
}, { deep: true });

const handleSubmit = () => {
  emit('submit', { ...localForm.value });
};
</script>

<style scoped>
.modal-content {
  padding: 20px;
}

.exercise-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 0 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-weight: 600;
  color: var(--ion-text-color);
  font-size: 14px;
}

.error-message {
  color: var(--ion-color-danger);
  font-size: 12px;
  margin-top: 4px;
}

.checkbox-container {
  margin-top: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 12px;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  accent-color: var(--ion-color-primary);
  cursor: pointer;
}

.checkbox-text {
  font-size: 14px;
  color: var(--ion-text-color);
  user-select: none;
}

.form-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 20px;
  width: 100%;
}

.submit-button {
  --padding-start: 24px;
  --padding-end: 24px;
}
</style>
