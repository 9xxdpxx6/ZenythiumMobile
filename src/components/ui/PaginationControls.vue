<template>
  <div v-if="meta && meta.last_page > 1" class="pagination">
    <button
      @click="handlePrevPage"
      :disabled="meta.current_page === 1 || loading"
      class="pagination-button"
    >
      <i class="fas fa-chevron-left"></i>
      Назад
    </button>
    <span class="pagination-info">
      Страница {{ meta.current_page }} из {{ meta.last_page }}
    </span>
    <button
      @click="handleNextPage"
      :disabled="meta.current_page === meta.last_page || loading"
      class="pagination-button"
    >
      Вперёд
      <i class="fas fa-chevron-right"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { PaginationMeta } from '@/types/api';

interface Props {
  meta: PaginationMeta | null;
  loading?: boolean;
}

interface Emits {
  (e: 'page-change', page: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<Emits>();

const handlePrevPage = (): void => {
  if (props.meta && props.meta.current_page > 1) {
    emit('page-change', props.meta.current_page - 1);
  }
};

const handleNextPage = (): void => {
  if (props.meta && props.meta.current_page < props.meta.last_page) {
    emit('page-change', props.meta.current_page + 1);
  }
};
</script>

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  padding: 16px;
}

.pagination-button {
  background: var(--ion-color-step-100);
  border: 1px solid var(--ion-color-step-200);
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: var(--ion-text-color);
  cursor: pointer;
  transition: none;
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-button:hover:not(:disabled) {
  background: var(--ion-color-step-200);
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 14px;
  color: var(--ion-color-medium);
}
</style>



