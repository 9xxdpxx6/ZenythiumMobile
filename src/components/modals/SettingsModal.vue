<template>
  <ion-modal :is-open="isOpen" @willDismiss="handleClose">
    <ion-header>
      <ion-toolbar>
        <ion-title>Настройки</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleClose">
            <i class="fas fa-times"></i>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="modal-content">
      <div class="settings-list">
        <button
          @click="openChangeNameModal"
          class="settings-item"
        >
          <div class="settings-item-icon">
            <i class="fas fa-user-edit"></i>
          </div>
          <div class="settings-item-content">
            <h3>Изменить имя</h3>
            <p>Изменить отображаемое имя</p>
          </div>
          <i class="fas fa-chevron-right settings-item-arrow"></i>
        </button>

        <button
          @click="openChangePasswordModal"
          class="settings-item"
        >
          <div class="settings-item-icon">
            <i class="fas fa-key"></i>
          </div>
          <div class="settings-item-content">
            <h3>Изменить пароль</h3>
            <p>Обновить пароль аккаунта</p>
          </div>
          <i class="fas fa-chevron-right settings-item-arrow"></i>
        </button>

        <div class="settings-divider"></div>

        <button
          @click="handleLogout"
          :disabled="loggingOut"
          class="settings-item settings-item-danger"
        >
          <div class="settings-item-icon">
            <ion-spinner v-if="loggingOut" name="crescent"></ion-spinner>
            <i v-else class="fas fa-sign-out-alt"></i>
          </div>
          <div class="settings-item-content">
            <h3>Выйти из аккаунта</h3>
            <p>Завершить текущую сессию</p>
          </div>
        </button>
      </div>
    </ion-content>

    <!-- Nested Modals -->
    <ChangeNameModal
      :is-open="changeNameModal.isOpen.value"
      :current-name="currentName"
      :error="changeNameError"
      @close="changeNameModal.close"
      @submit="handleChangeName"
    />

    <ChangePasswordModal
      :is-open="changePasswordModal.isOpen.value"
      :error="changePasswordError"
      @close="changePasswordModal.close"
      @submit="handleChangePassword"
    />
  </ion-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonSpinner,
} from '@ionic/vue';
import { useAuth, useModal, useToast } from '@/composables';
import { AuthService } from '@/services';
import ChangeNameModal from '@/components/modals/ChangeNameModal.vue';
import ChangePasswordModal from '@/components/modals/ChangePasswordModal.vue';
import type { ChangePasswordRequest, UpdateUserNameRequest } from '@/types/api';

interface Props {
  isOpen: boolean;
  currentName?: string;
}

interface Emits {
  (e: 'close'): void;
  (e: 'name-changed'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const router = useRouter();
const { logout } = useAuth();
const { showError, showSuccess } = useToast();

// Nested modals
const changeNameModal = useModal();
const changePasswordModal = useModal();
const changeNameError = ref<string>('');
const changePasswordError = ref<string>('');
const loggingOut = ref(false);

const handleClose = () => {
  emit('close');
};

const openChangeNameModal = () => {
  changeNameError.value = '';
  changeNameModal.open();
};

const openChangePasswordModal = () => {
  changePasswordError.value = '';
  changePasswordModal.open();
};

const handleChangeName = async (payload: UpdateUserNameRequest) => {
  changeNameError.value = '';
  try {
    await AuthService.updateUserName(payload);
    changeNameModal.close();
    await showSuccess('Имя успешно изменено');
    emit('name-changed');
  } catch (err: any) {
    const apiError = err as { message?: string; errors?: Record<string, string[]> };
    if (apiError.errors?.name) {
      changeNameError.value = apiError.errors.name[0];
    } else {
      changeNameError.value = apiError.message || 'Ошибка при изменении имени';
    }
  }
};

const handleChangePassword = async (payload: ChangePasswordRequest) => {
  changePasswordError.value = '';
  try {
    await AuthService.changePassword(payload);
    changePasswordModal.close();
    await showSuccess('Пароль успешно изменен');
  } catch (err: any) {
    const apiError = err as { message?: string; errors?: Record<string, string[]> };
    if (apiError.errors) {
      // Приоритет: current_password, затем password, затем password_confirmation
      if (apiError.errors.current_password) {
        changePasswordError.value = apiError.errors.current_password[0];
      } else if (apiError.errors.password) {
        changePasswordError.value = apiError.errors.password[0];
      } else if (apiError.errors.password_confirmation) {
        changePasswordError.value = apiError.errors.password_confirmation[0];
      } else {
        changePasswordError.value = apiError.message || 'Ошибка при изменении пароля';
      }
    } else {
      changePasswordError.value = apiError.message || 'Ошибка при изменении пароля';
    }
  }
};

const handleLogout = async () => {
  loggingOut.value = true;
  try {
    await logout();
    handleClose();
    router.push('/login');
  } catch (err) {
    await showError('Ошибка выхода из системы');
  } finally {
    loggingOut.value = false;
  }
};
</script>

<style scoped>
.modal-content {
  --padding-start: 0;
  --padding-end: 0;
  --padding-top: 0;
  --padding-bottom: 0;
}

.settings-list {
  padding: 8px 0;
}

.settings-item {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
  gap: 16px;
}

.settings-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.settings-item:active {
  background-color: rgba(255, 255, 255, 0.1);
}

.settings-item-danger {
  color: var(--ion-color-danger);
}

.settings-item-danger:hover {
  background-color: rgba(244, 67, 54, 0.1);
}

.settings-item-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.settings-item-icon i {
  font-size: 20px;
  color: var(--ion-color-primary);
}

.settings-item-danger .settings-item-icon i {
  color: var(--ion-color-danger);
}

.settings-item-content {
  flex: 1;
  text-align: left;
}

.settings-item-content h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.settings-item-content p {
  margin: 0;
  font-size: 14px;
  color: var(--ion-color-medium);
}

.settings-item-arrow {
  font-size: 14px;
  color: var(--ion-color-medium);
  flex-shrink: 0;
}

.settings-item-danger .settings-item-arrow {
  display: none;
}

.settings-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 8px 20px;
}
</style>



