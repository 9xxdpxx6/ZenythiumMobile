<template>
  <ion-page>
    <PageHeader 
      title="Циклы" 
      :end-button="{ icon: 'fas fa-plus', onClick: createCycle, class: 'add-button' }"
    />

    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <PageContainer>
        <h1 class="page-title">Циклы тренировок</h1>
        <p class="page-subtitle">Управляйте своими тренировочными циклами</p>

        <!-- Поле поиска -->
        <SearchInput
          v-model="searchQuery"
          placeholder="Поиск циклов..."
          @search="handleSearchInput"
          @clear="clearSearch"
        />

        <LoadingState v-if="loading" message="Загрузка циклов..." />

        <div v-else-if="cycles && cycles.length > 0">
          <div class="cycles-list card-list">
            <CycleCard
              v-for="cycle in cycles"
              :key="cycle.id"
              :cycle="cycle as Cycle"
              @click="handleCycleClick"
              @share="shareCycle.handleShare"
            />
          </div>
        </div>

        <EmptyState
          v-else
          icon="fas fa-sync-alt"
          title="Нет циклов"
          message="Создайте свой первый тренировочный цикл"
          action-text="Создать цикл"
          action-icon="fas fa-plus"
          :action-handler="createCycle"
        />
      </PageContainer>
    </ion-content>

    <!-- Share Cycle Modal -->
    <ShareCycleModal
      :is-open="shareCycle.shareModal.isOpen.value"
      :cycle-id="shareCycle.cycleId.value"
      @close="shareCycle.shareModal.close()"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { clearDataCache } from '@/composables/useDataFetching';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonContent,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/vue';
import { useDataFetching, useFilters, useToast, useShareCycle } from '@/composables';
import { cyclesService } from '@/services';
import SearchInput from '@/components/ui/SearchInput.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import LoadingState from '@/components/ui/LoadingState.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import PageContainer from '@/components/ui/PageContainer.vue';
import CycleCard from '@/components/cards/CycleCard.vue';
import ShareCycleModal from '@/components/modals/ShareCycleModal.vue';
import type { Cycle } from '@/types/models/cycle.types';

const router = useRouter();

// Filters
const { filters, updateFilter } = useFilters({
  search: '',
});

// Use composables

const { data: cycles, loading, error, execute, refresh } = useDataFetching(
  () => cyclesService.getAll(filters),
  { 
    immediate: false,
    skipIfDataExists: true, // Включаем кеш
    cacheKey: 'cycles_list'
  }
);

const searchQuery = ref('');
const searchTimeout = ref<NodeJS.Timeout | null>(null);

const fetchCycles = async () => {
  updateFilter('search', searchQuery.value);
  await execute();
};

const handleRefresh = async (event: CustomEvent) => {
  // Очищаем кеш при ручном обновлении
  clearDataCache('cycles_list');
  await refresh();
  event.detail.complete();
};

const handleSearchInput = (value: string) => {
  searchQuery.value = value;
  if (searchTimeout.value) clearTimeout(searchTimeout.value);
  // Очищаем кеш при поиске, чтобы загрузить новые данные
  clearDataCache('cycles_list');
  searchTimeout.value = setTimeout(() => fetchCycles(), 300);
};

const clearSearch = () => {
  searchQuery.value = '';
  if (searchTimeout.value) clearTimeout(searchTimeout.value);
  // Очищаем кеш при очистке поиска
  clearDataCache('cycles_list');
  fetchCycles();
};

const handleCycleClick = (cycle: Cycle | null) => {
  if (!cycle) return;
  router.push(`/cycle/${cycle.id}`);
};

const shareCycle = useShareCycle();

const createCycle = () => router.push('/cycle/new');

const handleCyclesUpdated = () => {
  // Очищаем кеш при обновлении циклов извне
  clearDataCache('cycles_list');
  fetchCycles();
};

onMounted(() => {
  fetchCycles();
  window.addEventListener('cycles-updated', handleCyclesUpdated);
});

onUnmounted(() => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
  window.removeEventListener('cycles-updated', handleCyclesUpdated);
});
</script>

<style scoped>
.cycles-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Кнопка добавления в заголовке */
.add-button {
  --background: transparent !important;
  --background-hover: transparent !important;
  --background-focused: transparent !important;
  --background-activated: transparent !important;
  --border-width: 0 !important;
  --border-style: none !important;
  --border-color: transparent !important;
  --color: white !important;
  --color-hover: rgba(255, 255, 255, 0.8) !important;
  --color-focused: white !important;
  --color-activated: rgba(255, 255, 255, 0.8) !important;
  --box-shadow: none !important;
  --padding-start: 8px !important;
  --padding-end: 8px !important;
  --padding-top: 8px !important;
  --padding-bottom: 8px !important;
  margin: 0 !important;
  width: 40px !important;
  height: 40px !important;
}

.add-button i {
  font-size: 20px !important;
  color: white !important;
}
</style>
