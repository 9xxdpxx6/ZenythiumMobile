export interface CycleFormData {
  name: string;
  weeks: string;
  start_date: Date | null;
  end_date: Date | null;
}

export interface ValidationErrors {
  name?: string | string[];
  weeks?: string | string[];
  start_date?: string | string[];
  end_date?: string | string[];
}

export function useCycleFormValidation() {
  // Функция для получения первой ошибки из массива
  const getFirstError = (error: string | string[] | undefined): string => {
    if (!error) return '';
    if (Array.isArray(error)) {
      return error[0] || '';
    }
    return error;
  };

  // Функция валидации формы
  const validateForm = (formData: CycleFormData): { isValid: boolean; errors: ValidationErrors } => {
    const errors: ValidationErrors = {};
    let isValid = true;

    // Валидация названия цикла
    if (!formData.name || formData.name.trim().length === 0) {
      errors.name = 'Название цикла обязательно';
      isValid = false;
    } else if (formData.name.trim().length < 3) {
      errors.name = 'Название должно содержать минимум 3 символа';
      isValid = false;
    }

    // Валидация количества недель
    if (!formData.weeks || formData.weeks.trim().length === 0) {
      errors.weeks = 'Укажите количество недель (минимум 1)';
      isValid = false;
    } else {
      const weeksNum = parseInt(formData.weeks);
      if (isNaN(weeksNum) || weeksNum < 1) {
        errors.weeks = 'Укажите количество недель (минимум 1)';
        isValid = false;
      } else if (weeksNum > 52) {
        errors.weeks = 'Максимальное количество недель: 52';
        isValid = false;
      }
    }

    // Валидация дат
    if (formData.start_date && formData.end_date) {
      if (formData.end_date <= formData.start_date) {
        errors.end_date = 'Дата окончания должна быть позже даты начала';
        isValid = false;
      }
    }

    return { isValid, errors };
  };

  // Функция валидации отдельного поля
  const validateField = (field: keyof CycleFormData, value: any): string => {
    // Создаем копию текущих данных формы для валидации
    const tempFormData: CycleFormData = {
      name: '',
      weeks: '',
      start_date: null,
      end_date: null,
      [field]: value
    };

    // Для валидации дат нужны оба поля
    if (field === 'end_date' && tempFormData.start_date) {
      tempFormData.start_date = tempFormData.start_date;
    }

    const { errors } = validateForm(tempFormData);
    return getFirstError(errors[field]);
  };

  return {
    validateForm,
    validateField,
    getFirstError
  };
}
