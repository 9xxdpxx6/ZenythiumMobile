<template>
  <div class="personal-records-table">
    <div class="records-container modern-card" v-if="personalRecords && personalRecords.length > 0">
      <h3>Топ 10 личных рекордов</h3>
      <div class="records-grid">
        <div 
          v-for="record in limitedRecords" 
          :key="record.exercise_name"
          class="record-card"
        >
          <div class="record-header">
            <h4>{{ record.exercise_name }}</h4>
            <span class="muscle-group">{{ record.muscle_group }}</span>
          </div>
          <div class="record-stats">
            <div class="stat-item">
              <span class="stat-label">Макс. вес</span>
              <span class="stat-value">{{ record.max_weight }} кг</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Повторения</span>
              <span class="stat-value">{{ record.max_reps }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Дата</span>
              <span class="stat-value">{{ formatDate(record.achieved_date) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="no-data">
      <p>Нет данных о личных рекордах</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface PersonalRecord {
  exercise_name: string;
  muscle_group: string;
  max_weight: number;
  max_reps: number;
  achieved_date: string;
}

interface Props {
  personalRecords?: PersonalRecord[];
  limit?: number;
}

const props = withDefaults(defineProps<Props>(), {
  limit: 10,
});

const limitedRecords = computed(() => {
  if (!props.personalRecords) return [];
  return props.personalRecords.slice(0, props.limit);
});

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('ru-RU');
  } catch {
    return '-';
  }
};
</script>

<style scoped>
.personal-records-table {
  margin-bottom: 24px;
}

.records-container {
  padding: 16px !important;
}

.records-container h3 {
  margin: 0 0 16px 0 !important;
  font-size: 1.2rem;
  font-weight: 600;
  color: #ffffff;
  padding: 0 4px;
}

.records-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.record-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.record-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(139, 92, 246, 0.3);
  transform: translateY(-2px);
}

.record-header {
  margin-bottom: 12px;
}

.record-header h4 {
  margin: 0 0 4px 0;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.3;
}

.muscle-group {
  display: inline-block;
  background: rgba(139, 92, 246, 0.2);
  color: #8B5CF6;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
}

.record-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  color: #a0a0a0;
  font-size: 0.9rem;
  font-weight: 500;
}

.stat-value {
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 600;
}

.no-data {
  padding: 24px;
  text-align: center;
  color: var(--ion-color-medium);
}
</style>
