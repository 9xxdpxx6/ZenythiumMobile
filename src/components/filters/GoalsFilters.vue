<template>
  <div class="filters-section">
    <div class="filter-row">
      <div class="form-group">
        <label class="form-label">Статус</label>
        <CustomSelect
          v-model="localFilters.status"
          :options="statusOptions"
          placeholder="Все статусы"
          @update:model-value="handleChange"
        />
      </div>
    </div>
    
    <div class="filter-actions">
      <ion-button fill="outline" @click="handleReset">
        <i class="fas fa-undo"></i>
        Сбросить
      </ion-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { IonButton } from '@ionic/vue';
import CustomSelect from '@/components/ui/CustomSelect.vue';
import type { GoalFilters } from '@/composables/useGoals';

interface Props {
  filters: GoalFilters;
}

interface Emits {
  (e: 'update:filters', value: GoalFilters): void;
  (e: 'reset'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const localFilters = ref<GoalFilters>({ ...props.filters });

const statusOptions = [
  { value: null, label: 'Все статусы' },
  { value: 'active', label: 'Активные' },
  { value: 'completed', label: 'Завершенные' },
  { value: 'failed', label: 'Проваленные' },
  { value: 'cancelled', label: 'Отмененные' },
];

watch(() => props.filters, (newFilters) => {
  localFilters.value = { ...newFilters };
}, { deep: true });

const handleChange = () => {
  emit('update:filters', { ...localFilters.value });
};

const handleReset = () => {
  localFilters.value = { status: null };
  emit('reset');
};
</script>

<style scoped>
.filters-section {
  margin-bottom: 24px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.filter-row {
  margin-bottom: 12px;
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

.filter-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.filter-actions ion-button {
  flex: 1;
}
</style>

