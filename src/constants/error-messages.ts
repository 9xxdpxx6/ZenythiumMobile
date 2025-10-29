/**
 * Error Messages Constants
 */

export const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: 'Ошибка сети. Проверьте подключение.',
  TIMEOUT_ERROR: 'Превышено время ожидания. Попробуйте еще раз.',
  SERVER_ERROR: 'Ошибка сервера. Попробуйте позже.',

  // Authentication errors
  AUTH_ERROR: 'Ошибка аутентификации. Войдите снова.',
  UNAUTHORIZED: 'У вас нет прав для выполнения этого действия.',
  SESSION_EXPIRED: 'Сеанс истек. Войдите снова.',
  INVALID_CREDENTIALS: 'Неверный email или пароль.',

  // Resource errors
  NOT_FOUND: 'Ресурс не найден.',
  ALREADY_EXISTS: 'Ресурс уже существует.',
  CONFLICT: 'Конфликт с существующими данными.',

  // Validation errors
  VALIDATION_ERROR: 'Проверьте введенные данные.',
  REQUIRED_FIELD: 'Это поле обязательно для заполнения.',
  INVALID_FORMAT: 'Неверный формат.',
  INVALID_EMAIL: 'Неверный адрес электронной почты.',
  PASSWORD_TOO_SHORT: 'Пароль должен содержать минимум 8 символов.',

  // Operation errors
  CREATE_FAILED: 'Не удалось создать ресурс.',
  UPDATE_FAILED: 'Не удалось обновить ресурс.',
  DELETE_FAILED: 'Не удалось удалить ресурс.',
  LOAD_FAILED: 'Не удалось загрузить данные.',

  // Workout errors
  WORKOUT_ALREADY_ACTIVE: 'У вас уже есть активная тренировка.',
  WORKOUT_NOT_FOUND: 'Тренировка не найдена.',
  CANNOT_START_WORKOUT: 'Не удалось начать тренировку.',
  CANNOT_COMPLETE_WORKOUT: 'Не удалось завершить тренировку.',

  // Generic
  UNKNOWN_ERROR: 'Произошла неизвестная ошибка.',
  TRY_AGAIN: 'Попробуйте еще раз.',
} as const;

