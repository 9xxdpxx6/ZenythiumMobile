<template>
  <BasePage>
    <PageHeader 
      title="Цели" 
      :end-button="{ icon: 'fas fa-plus', onClick: openAddModal, class: 'add-button' }"
    >
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
        <GoalsFilters
          v-model:filters="filters"
          @reset="resetFilters"
        />

        <!-- Goals List -->
        <div class="goals-list">
          <LoadingState v-if="loading" message="Загрузка целей..." />
          
          <div v-else-if="!goals || goals.length === 0" class="no-data">
            <i class="fas fa-bullseye chart-icon"></i>
            <p>Нет целей</p>
            <p class="no-data-text">
              Создайте свою первую цель для отслеживания прогресса
            </p>
            <ion-button fill="outline" @click="openAddModal">
              Создать цель
            </ion-button>
          </div>
          
          <div v-else class="goals-grid">
            <GoalCard
              v-for="goal in goals"
              :key="goal.id"
              :goal="goal"
              @edit="openEditModal"
              @delete="confirmDelete"
              @restore="restoreGoal"
            />
          </div>
        </div>
      </PageContainer>
    </ion-content>

    <GoalFormModal
      :is-open="isModalOpen"
      v-model:form-data="formData"
      :is-editing="isEditing"
      :is-saving="isSaving"
      :error="modalError"
      :goal-type-options="goalTypeOptions"
      :exercise-options="exerciseOptions"
      :show-exercise-field="showExerciseField"
      :goal-types="goalTypes"
      @close="handleCloseModal"
      @save="saveGoal"
    />

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmationModal
      :is-open="isDeleteModalOpen"
      :title="selectedGoal?.status === 'active' ? 'Отменить цель' : 'Удалить цель'"
      :message="selectedGoal?.status === 'active' 
        ? 'Вы уверены, что хотите отменить цель' 
        : 'Вы уверены, что хотите удалить цель'"
      :item-name="selectedGoal?.title"
      :warning-text="selectedGoal?.status === 'active' 
        ? 'Цель будет отменена, но вы сможете восстановить её позже.' 
        : undefined"
      @confirm="deleteGoal"
      @cancel="handleCloseDeleteModal"
    />
  </BasePage>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import {
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonButton,
} from '@ionic/vue';
import { useGoals } from '@/composables/useGoals';
import GoalCard from '@/components/cards/GoalCard.vue';
import GoalsFilters from '@/components/filters/GoalsFilters.vue';
import GoalFormModal from '@/components/modals/GoalFormModal.vue';
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal.vue';
import PageContainer from '@/components/ui/PageContainer.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import LoadingState from '@/components/ui/LoadingState.vue';

const router = useRouter();

const {
  goals,
  loading,
  filters,
  formData,
  isModalOpen,
  isDeleteModalOpen,
  selectedGoal,
  isEditing,
  isSaving,
  modalError,
  exerciseOptions,
  goalTypeOptions,
  showExerciseField,
  goalTypes,
  fetchData,
  openAddModal,
  openEditModal,
  handleCloseModal,
  saveGoal,
  confirmDelete,
  handleCloseDeleteModal,
  deleteGoal,
  restoreGoal,
  resetFilters,
} = useGoals();

const handleRefresh = async (event: CustomEvent) => {
  await fetchData();
  event.detail.complete();
};
</script>

<style scoped>
.goals-list {
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

.goals-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>

