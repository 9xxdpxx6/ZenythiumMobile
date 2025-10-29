<template>
  <div class="custom-datepicker-wrapper">
    <label v-if="label" class="custom-datepicker-label">{{ label }}</label>
    <div class="custom-datepicker-container" :class="{ 'focused': isFocused, 'error': hasError }">
      <div class="custom-datepicker" @click="toggleCalendar">
        <div class="date-display">
          <span class="date-text">{{ displayDate }}</span>
          <i class="fas fa-calendar-alt date-icon"></i>
        </div>
      </div>
      
      <!-- Custom Calendar Dropdown -->
      <div v-if="showCalendar" class="calendar-dropdown">
        <div class="calendar-header">
          <button @click="previousMonth" class="nav-button">
            <i class="fas fa-chevron-left"></i>
          </button>
          <div class="month-year">
            {{ currentMonthName }} {{ currentYear }}
          </div>
          <button @click="nextMonth" class="nav-button">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
        
        <div class="calendar-weekdays">
          <div v-for="day in weekDays" :key="day" class="weekday">{{ day }}</div>
        </div>
        
        <div class="calendar-days">
          <div 
            v-for="day in calendarDays" 
            :key="`${day.date}-${day.month}-${day.year}`"
            class="calendar-day"
            :class="{ 
              'other-month': !day.isCurrentMonth,
              'today': day.isToday,
              'selected': day.isSelected
            }"
            @click="selectDate(day)"
          >
            {{ day.date }}
          </div>
        </div>
        
        <div class="calendar-footer">
          <button @click="cancelDate" class="cancel-btn">Отмена</button>
          <button @click="confirmDate" class="confirm-btn">Готово</button>
        </div>
      </div>
    </div>
    <div v-if="hasError && errorMessage" class="custom-datepicker-error">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

interface Props {
  modelValue?: string;
  label?: string;
  max?: string;
  min?: string;
  error?: boolean;
  errorMessage?: string;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'focus'): void;
  (e: 'blur'): void;
}

interface CalendarDay {
  date: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  error: false,
});

const emit = defineEmits<Emits>();

const isFocused = ref(false);
const showCalendar = ref(false);
const currentMonth = ref(new Date().getMonth());
const currentYear = ref(new Date().getFullYear());
const selectedDate = ref<Date | null>(null);

const hasError = computed(() => props.error);

const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const monthNames = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const currentMonthName = computed(() => monthNames[currentMonth.value]);

const displayDate = computed(() => {
  if (selectedDate.value) {
    return selectedDate.value.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  return 'Выберите дату';
});

const calendarDays = computed((): CalendarDay[] => {
  const days: CalendarDay[] = [];
  const today = new Date();
  const firstDayOfMonth = new Date(currentYear.value, currentMonth.value, 1);
  const lastDayOfMonth = new Date(currentYear.value, currentMonth.value + 1, 0);
  const firstDayWeek = (firstDayOfMonth.getDay() + 6) % 7; // Понедельник = 0
  
  // Добавляем дни предыдущего месяца
  const prevMonth = new Date(currentYear.value, currentMonth.value - 1, 0);
  for (let i = firstDayWeek - 1; i >= 0; i--) {
    const date = prevMonth.getDate() - i;
    days.push({
      date,
      month: currentMonth.value - 1,
      year: currentYear.value,
      isCurrentMonth: false,
      isToday: false,
      isSelected: false
    });
  }
  
  // Добавляем дни текущего месяца
  for (let date = 1; date <= lastDayOfMonth.getDate(); date++) {
    const isToday = date === today.getDate() && 
                   currentMonth.value === today.getMonth() && 
                   currentYear.value === today.getFullYear();
    
    const isSelected = selectedDate.value && 
                      date === selectedDate.value.getDate() && 
                      currentMonth.value === selectedDate.value.getMonth() && 
                      currentYear.value === selectedDate.value.getFullYear();
    
    days.push({
      date,
      month: currentMonth.value,
      year: currentYear.value,
      isCurrentMonth: true,
      isToday,
      isSelected: isSelected || false
    });
  }
  
  // Добавляем дни следующего месяца
  const remainingDays = 42 - days.length; // 6 недель * 7 дней
  for (let date = 1; date <= remainingDays; date++) {
    days.push({
      date,
      month: currentMonth.value + 1,
      year: currentYear.value,
      isCurrentMonth: false,
      isToday: false,
      isSelected: false
    });
  }
  
  return days;
});

const toggleCalendar = () => {
  showCalendar.value = !showCalendar.value;
  isFocused.value = showCalendar.value;
  if (showCalendar.value) {
    emit('focus');
  } else {
    emit('blur');
  }
};

const selectDate = (day: CalendarDay) => {
  if (!day.isCurrentMonth) return;
  
  selectedDate.value = new Date(day.year, day.month, day.date);
};

const confirmDate = () => {
  if (selectedDate.value) {
    const isoString = selectedDate.value.toISOString().split('T')[0];
    emit('update:modelValue', isoString);
  }
  showCalendar.value = false;
  isFocused.value = false;
  emit('blur');
};

const cancelDate = () => {
  showCalendar.value = false;
  isFocused.value = false;
  emit('blur');
};

const previousMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
};

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
};

// Обработка клика вне календаря
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.custom-datepicker-wrapper')) {
    showCalendar.value = false;
    isFocused.value = false;
    emit('blur');
  }
};

// Инициализация выбранной даты
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    selectedDate.value = new Date(newValue);
    currentMonth.value = selectedDate.value.getMonth();
    currentYear.value = selectedDate.value.getFullYear();
  }
}, { immediate: true });

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

// Методы для внешнего использования
const open = () => {
  showCalendar.value = true;
  isFocused.value = true;
  emit('focus');
};

const close = () => {
  showCalendar.value = false;
  isFocused.value = false;
  emit('blur');
};

defineExpose({
  open,
  close,
});
</script>

<style scoped>
.custom-datepicker-wrapper {
  margin: 16px 0;
  position: relative;
}

.custom-datepicker-label {
  display: block;
  color: var(--ion-text-color);
  font-weight: 500;
  margin-bottom: 8px;
  font-size: 14px;
}

.custom-datepicker-container {
  position: relative;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease;
  overflow: visible;
}

.custom-datepicker-container.focused {
  border-color: var(--ion-color-primary);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.custom-datepicker-container.error {
  border-color: var(--ion-color-danger);
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}

.custom-datepicker {
  padding: 12px 16px;
  cursor: pointer;
  min-height: 48px;
  display: flex;
  align-items: center;
}

.date-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.date-text {
  color: var(--ion-text-color);
  font-size: 16px;
}

.date-icon {
  color: var(--ion-color-primary);
  font-size: 18px;
}

.calendar-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #1e1e1e;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  margin-top: 4px;
  overflow: hidden;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.nav-button {
  background: transparent;
  border: none;
  color: var(--ion-text-color);
  font-size: 18px;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.nav-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.month-year {
  color: var(--ion-text-color);
  font-weight: 600;
  font-size: 16px;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding: 8px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.weekday {
  text-align: center;
  color: var(--ion-color-medium);
  font-size: 12px;
  font-weight: 500;
  padding: 8px 0;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding: 8px 16px;
  gap: 2px;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
  color: var(--ion-text-color);
}

.calendar-day:hover {
  background: rgba(255, 255, 255, 0.1);
}

.calendar-day.other-month {
  color: var(--ion-color-medium);
  opacity: 0.5;
}

.calendar-day.today {
  background: rgba(99, 102, 241, 0.2);
  color: var(--ion-color-primary);
  font-weight: 600;
}

.calendar-day.selected {
  background: var(--ion-color-primary);
  color: white;
  font-weight: 600;
}

.calendar-footer {
  display: flex;
  justify-content: space-between;
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  gap: 12px;
}

.cancel-btn, .confirm-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: transparent;
  color: var(--ion-color-medium);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.05);
}

.confirm-btn {
  background: var(--ion-color-primary);
  color: white;
}

.confirm-btn:hover {
  background: var(--ion-color-primary-shade);
}

.custom-datepicker-error {
  margin-top: 4px;
  color: var(--ion-color-danger);
  font-size: 12px;
  font-weight: 500;
}

/* Темная тема */
@media (prefers-color-scheme: dark) {
  .custom-datepicker-container {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .custom-datepicker-container.focused {
    border-color: var(--ion-color-primary);
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
  }
  
  .custom-datepicker-container.error {
    border-color: var(--ion-color-danger);
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
  }
}
</style>
