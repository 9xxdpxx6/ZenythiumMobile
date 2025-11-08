<template>
  <BasePage>
    <PageHeader title="Записи веса" :end-button="{ icon: 'fas fa-plus', onClick: openAddModal, class: 'add-button' }">
      <template #start>
          <ion-button @click="router.back()">
            <i class="fas fa-arrow-left"></i>
          </ion-button>
      </template>
    </PageHeader>

    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>
      <PageContainer>
        <MetricFilters
          v-model:filters="filters"
          @date-change="handleDateFilterChange"
          @reset="resetFilters"
        />

        <!-- Metrics List -->
        <div class="metrics-list">
          <LoadingState v-if="loading" message="Загрузка записей..." />
          
          <div v-else-if="!metrics || metrics.length === 0" class="no-data">
            <i class="fas fa-weight chart-icon"></i>
            <p>Нет записей веса</p>
            <p class="no-data-text">
              Начните отслеживать свой прогресс, добавив первую запись веса
            </p>
            <ion-button fill="outline" @click="openAddModal">
              Добавить запись
            </ion-button>
          </div>
          
          <div v-else class="metrics-grid">
            <MetricCard
              v-for="metric in metrics"
              :key="metric.id"
              :metric="metric as any"
              @edit="openEditModal"
              @delete="confirmDelete"
            />
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="pagination">
          <ion-button 
            fill="outline" 
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            <i class="fas fa-chevron-left"></i>
            Назад
          </ion-button>
          
          <div class="page-info">
            {{ currentPage }} из {{ totalPages }}
          </div>
          
          <ion-button 
            fill="outline" 
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
          >
            Вперед
            <i class="fas fa-chevron-right"></i>
          </ion-button>
        </div>
      </PageContainer>
    </ion-content>

    <MetricFormModal
      :is-open="isModalOpen"
      v-model:form-data="formData"
      :is-editing="isEditing"
      :is-saving="isSaving"
      :error="modalError"
      @close="handleCloseModal"
      @save="saveMetric"
    />

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmationModal
      :is-open="isDeleteModalOpen"
      title="Удалить запись"
      message="Вы уверены, что хотите удалить"
      :item-name="`запись от ${selectedMetric ? formatDate((selectedMetric as any).date) : ''}`"
      @confirm="deleteMetric"
      @cancel="handleCloseDeleteModal"
    />
  </BasePage>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonButton,
  IonSpinner,
  IonModal,
  IonButtons,
} from '@ionic/vue';
import { useMetrics } from '@/composables/useMetrics';
import MetricCard from '@/components/cards/MetricCard.vue';
import MetricFilters from '@/components/filters/MetricFilters.vue';
import MetricFormModal from '@/components/modals/MetricFormModal.vue';
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal.vue';
import PageContainer from '@/components/ui/PageContainer.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import LoadingState from '@/components/ui/LoadingState.vue';

const router = useRouter();

const {
  metrics,
  loading,
  filters,
  formData,
  currentPage,
  totalPages,
  isModalOpen,
  isDeleteModalOpen,
  selectedMetric,
  isEditing,
  isSaving,
  modalError,
  formatDate,
  openAddModal,
  openEditModal,
  handleCloseModal,
  saveMetric,
  confirmDelete,
  handleCloseDeleteModal,
  deleteMetric,
  handleDateFilterChange,
  resetFilters,
  applyFilters,
  goToPage,
  fetchData,
} = useMetrics();

// Utility function for time formatting (not in composable)
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Wrapper for page change
const changePage = (page: number) => {
  goToPage(page);
};

const handleRefresh = async (event: CustomEvent) => {
  await fetchData();
  event.detail.complete();
};
</script>

<style scoped>
.metrics-list {
  margin-bottom: 20px;
}

.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
  color: var(--ion-color-medium);
  padding: 20px;
  gap: 16px;
}

.chart-icon {
  margin-bottom: 0;
  font-size: 3rem;
  color: var(--ion-color-primary);
  opacity: 0.8;
}

.no-data p {
  margin: 0;
  font-size: 16px;
  line-height: 1.4;
}

.no-data-text {
  font-size: 14px !important;
  opacity: 0.8;
  max-width: 280px;
}

.no-data ion-button {
  --padding-start: 20px;
  --padding-end: 20px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  min-width: 140px;
  --border-radius: 8px;
}

.metrics-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-top: 1px solid var(--ion-color-step-200);
}

.page-info {
  font-size: 14px;
  color: var(--ion-color-medium);
  font-weight: 500;
}
</style>
