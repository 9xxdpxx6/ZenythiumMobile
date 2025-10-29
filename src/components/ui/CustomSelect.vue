<template>
  <div class="custom-select-container" ref="containerRef">
    <div 
      class="select-input" 
      :class="{ 'is-open': isOpen, 'has-value': selectedOption }"
      @click="toggleDropdown"
    >
      <div class="select-display">
        <span v-if="selectedOption" class="selected-text">
          {{ selectedOption.label }}
        </span>
        <span v-else class="placeholder">
          {{ placeholder }}
        </span>
      </div>
      <div class="select-actions">
        <i 
          v-if="isOpen && searchQuery" 
          @click.stop="clearSearch" 
          class="fas fa-times clear-icon"
        ></i>
        <i 
          class="fas fa-chevron-down dropdown-icon"
          :class="{ 'is-open': isOpen }"
        ></i>
      </div>
    </div>

    <div v-if="isOpen" class="select-dropdown">
      <div class="search-container">
        <i class="fas fa-search search-icon"></i>
        <input
          ref="searchInputRef"
          v-model="searchQuery"
          type="text"
          class="search-input"
          :placeholder="searchPlaceholder"
          @keydown.esc="closeDropdown"
          @keydown.down="navigateDown"
          @keydown.up="navigateUp"
          @keydown.enter="selectHighlighted"
        />
      </div>

      <div class="options-container">
        <div 
          v-if="filteredOptions.length === 0" 
          class="no-options"
        >
          <i class="fas fa-search"></i>
          <p>Ничего не найдено</p>
        </div>
        
        <div
          v-for="(option, index) in filteredOptions"
          :key="String(option.value)"
          class="select-option"
          :class="{ 
            'is-selected': option.value === modelValue,
            'is-highlighted': index === highlightedIndex 
          }"
          @click="selectOption(option)"
          @mouseenter="highlightedIndex = index"
        >
          <span class="option-text">{{ option.label }}</span>
          <i v-if="option.value === modelValue" class="fas fa-check check-icon"></i>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';

interface SelectOption {
  value: any;
  label: string;
}

interface Props {
  modelValue: any;
  options: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Выберите опцию',
  searchPlaceholder: 'Поиск...',
  disabled: false
});

const emit = defineEmits<{
  'update:modelValue': [value: any];
  'change': [value: any, option: SelectOption | null];
}>();

const containerRef = ref<HTMLElement>();
const searchInputRef = ref<HTMLInputElement>();
const isOpen = ref(false);
const searchQuery = ref('');
const highlightedIndex = ref(-1);

const selectedOption = computed(() => {
  return props.options.find(option => option.value === props.modelValue) || null;
});

const filteredOptions = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.options;
  }
  
  const query = searchQuery.value.toLowerCase().trim();
  return props.options.filter(option => 
    option.label.toLowerCase().includes(query)
  );
});

const toggleDropdown = () => {
  if (props.disabled) return;
  
  if (isOpen.value) {
    closeDropdown();
  } else {
    openDropdown();
  }
};

const openDropdown = async () => {
  isOpen.value = true;
  searchQuery.value = '';
  highlightedIndex.value = -1;
  
  await nextTick();
  if (searchInputRef.value) {
    searchInputRef.value.focus();
  }
};

const closeDropdown = () => {
  isOpen.value = false;
  searchQuery.value = '';
  highlightedIndex.value = -1;
};

const clearSearch = () => {
  searchQuery.value = '';
  highlightedIndex.value = -1;
  if (searchInputRef.value) {
    searchInputRef.value.focus();
  }
};

const selectOption = (option: SelectOption) => {
  emit('update:modelValue', option.value);
  emit('change', option.value, option);
  closeDropdown();
};

const selectHighlighted = () => {
  if (highlightedIndex.value >= 0 && filteredOptions.value[highlightedIndex.value]) {
    selectOption(filteredOptions.value[highlightedIndex.value]);
  }
};

const navigateDown = (e: KeyboardEvent) => {
  e.preventDefault();
  if (highlightedIndex.value < filteredOptions.value.length - 1) {
    highlightedIndex.value++;
  }
};

const navigateUp = (e: KeyboardEvent) => {
  e.preventDefault();
  if (highlightedIndex.value > 0) {
    highlightedIndex.value--;
  }
};

const handleClickOutside = (event: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    closeDropdown();
  }
};

// Сброс подсветки при изменении поискового запроса
watch(searchQuery, () => {
  highlightedIndex.value = -1;
});

// Сброс подсветки при изменении отфильтрованных опций
watch(filteredOptions, () => {
  highlightedIndex.value = -1;
});

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.custom-select-container {
  position: relative;
  width: 100%;
}

.select-input {
  background: #1F1F1F;
  border: 1px solid #6B7280;
  border-radius: 8px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
}

.select-input:hover {
  border-color: #6B7280;
}

.select-input.is-open {
  border-color: #6B7280;
  box-shadow: 0 0 0 2px rgba(107, 114, 128, 0.2);
}

.select-input.has-value .selected-text {
  color: var(--ion-text-color);
  font-weight: 500;
}

.select-display {
  flex: 1;
  display: flex;
  align-items: center;
}

.selected-text {
  color: #FFFFFF;
  font-size: 14px;
}

.placeholder {
  color: #6B7280;
  font-size: 14px;
}

.select-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.clear-icon {
  color: #6B7280;
  font-size: 12px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.clear-icon:hover {
  background: #6B7280;
  color: #FFFFFF;
}

.dropdown-icon {
  color: #6B7280;
  font-size: 12px;
  transition: transform 0.2s ease;
}

.dropdown-icon.is-open {
  transform: rotate(180deg);
}

.select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #1F1F1F;
  border: 1px solid #6B7280;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  margin-top: 4px;
  overflow: hidden;
}

.search-container {
  position: relative;
  padding: 12px;
  border-bottom: 1px solid #6B7280;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #6B7280;
  font-size: 14px;
  pointer-events: none;
}

.search-input {
  width: 100%;
  background: #1F1F1F;
  border: 1px solid #6B7280;
  border-radius: 6px;
  padding: 8px 8px 8px 32px;
  font-size: 14px;
  color: #FFFFFF;
  outline: none;
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: #6B7280;
  box-shadow: 0 0 0 2px rgba(107, 114, 128, 0.2);
}

.search-input::placeholder {
  color: #6B7280;
}

.options-container {
  max-height: 200px;
  overflow-y: auto;
}

.no-options {
  padding: 20px;
  text-align: center;
  color: #6B7280;
}

.no-options i {
  font-size: 24px;
  margin-bottom: 8px;
  display: block;
}

.no-options p {
  margin: 0;
  font-size: 14px;
}

.select-option {
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #6B7280;
}

.select-option:last-child {
  border-bottom: none;
}

.select-option.is-selected {
  background: #6B7280;
  color: #FFFFFF;
}

.select-option.is-selected .check-icon {
  color: white;
}

.option-text {
  font-size: 14px;
  color: #FFFFFF;
  flex: 1;
}

.select-option.is-selected .option-text {
  color: #FFFFFF;
  font-weight: 500;
}

.check-icon {
  color: #6B7280;
  font-size: 12px;
  margin-left: 8px;
}

/* Скроллбар */
.options-container::-webkit-scrollbar {
  width: 6px;
}

.options-container::-webkit-scrollbar-track {
  background: #1F1F1F;
}

.options-container::-webkit-scrollbar-thumb {
  background: #6B7280;
  border-radius: 3px;
}

.options-container::-webkit-scrollbar-thumb:hover {
  background: #6B7280;
}
</style>
