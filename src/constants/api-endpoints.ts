/**
 * API Endpoints Constants
 * 
 * All endpoints are relative paths that will be appended to baseURL
 * Base URL includes /api/v1 prefix from app.config.ts
 */

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },

  // Metrics
  METRICS: '/metrics',
  METRIC_BY_ID: (id: string) => `/metrics/${id}`,
  METRIC_CATEGORIES: '/metrics/categories',

  // Cycles
  CYCLES: '/cycles',
  CYCLE_BY_ID: (id: string) => `/cycles/${id}`,
  CYCLE_ACTIVE: '/cycles/active',
  CYCLE_START: (id: string) => `/cycles/${id}/start`,
  CYCLE_COMPLETE: (id: string) => `/cycles/${id}/complete`,

  // Plans
  PLANS: '/plans',
  PLAN_BY_ID: (id: string) => `/plans/${id}`,
  PLAN_DUPLICATE: (id: string) => `/plans/${id}/duplicate`,

  // Workouts
  WORKOUTS: '/workouts',
  WORKOUT_BY_ID: (id: string) => `/workouts/${id}`,
  WORKOUT_ACTIVE: '/workouts/active',
  WORKOUT_START: (id: string) => `/workouts/${id}/start`,
  WORKOUT_COMPLETE: (id: string) => `/workouts/${id}/complete`,
  WORKOUT_EXERCISE_SET: (workoutId: string, exerciseId: string, setId: string) =>
    `/workouts/${workoutId}/exercises/${exerciseId}/sets/${setId}`,

  // Exercises
  EXERCISES: '/exercises',
  EXERCISE_BY_ID: (id: string) => `/exercises/${id}`,
  EXERCISE_SEARCH: '/exercises/search',

  // Muscle Groups
  MUSCLE_GROUPS: '/muscle-groups',

  // Statistics
  STATISTICS: {
    OVERVIEW: '/user/statistics',
    WORKOUT_HISTORY: '/statistics/workout-history',
    PROGRESS_BY_EXERCISE: (exerciseId: string) => `/statistics/progress/${exerciseId}`,
    VOLUME_BY_MUSCLE_GROUP: '/statistics/volume-by-muscle-group',
    PERSONAL_RECORDS: '/user/records',
    TIME_ANALYTICS: '/user/time-analytics',
    EXERCISE_STATISTICS: '/user/exercise-statistics',
    MUSCLE_GROUP_STATISTICS: '/user/muscle-group-statistics',
  },

  // User
  USER: {
    PROFILE: '/user/profile',
    SETTINGS: '/user/settings',
  },
} as const;

