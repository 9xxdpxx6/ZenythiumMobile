/**
 * Cache Manager
 * Управление кешем данных и очистка при мутациях
 */

import { clearDataCache } from '@/composables/useDataFetching';

/**
 * Инициализация слушателей событий для очистки кеша
 */
export function initializeCacheManager(): void {
  // Очистка кеша циклов
  window.addEventListener('cycles-updated', () => {
    clearDataCache('homepage_statistics'); // Статистика может измениться
    // Кеш cycles не используется, так как там нет skipIfDataExists
  });

  // Очистка кеша планов
  window.addEventListener('plans-updated', () => {
    clearDataCache('homepage_statistics');
  });

  // Очистка кеша тренировок
  window.addEventListener('workout-updated', () => {
    clearDataCache('homepage_workouts');
    clearDataCache('homepage_statistics');
    clearDataCache('homepage_personal_records');
    clearDataCache('homepage_muscle_groups');
    clearDataCache('homepage_time_analytics'); // Время тренировок
    clearDataCache('homepage_exercise_stats'); // Статистика упражнений
  });

  window.addEventListener('workout-started', () => {
    clearDataCache('homepage_workouts');
  });

  window.addEventListener('workout-finished', () => {
    clearDataCache('homepage_workouts');
    clearDataCache('homepage_statistics');
    clearDataCache('homepage_personal_records');
    clearDataCache('homepage_muscle_groups');
    clearDataCache('homepage_time_analytics'); // Время тренировок
    clearDataCache('homepage_exercise_stats'); // Статистика упражнений
  });

  // Очистка кеша метрик
  window.addEventListener('metric-added', () => {
    clearDataCache('homepage_statistics');
    clearDataCache('homepage_personal_records');
    clearDataCache('homepage_metrics'); // Метрики для графика веса
  });

  window.addEventListener('metric-updated', () => {
    clearDataCache('homepage_statistics');
    clearDataCache('homepage_personal_records');
    clearDataCache('homepage_metrics'); // Метрики для графика веса
  });
}

