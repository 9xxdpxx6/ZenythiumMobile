import { createApp } from 'vue'
import App from './App.vue'
import router from './router';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

import { IonicVue } from '@ionic/vue';

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* @import '@ionic/vue/css/palettes/dark.always.css'; */
/* @import '@ionic/vue/css/palettes/dark.class.css'; */
import '@ionic/vue/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';
import './theme/modern-dark.css';
import './theme/utilities.css';
import './theme/datepicker.css';
import './theme/tab-transitions.css';
import './theme/swipe-back.css';

/* Font Awesome */
import '@fortawesome/fontawesome-free/css/all.css';

/* Vue Datepicker */
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';

/* Import CustomInput component */
import CustomInput from './components/ui/CustomInput.vue';

/* Import BasePage component for automatic swipe-back */
import BasePage from './components/swipe-back/BasePage.vue';

/* Initialize cache manager */
import { initializeCacheManager } from './utils/cache-manager';

/* Push Notifications Service */
import { PushNotificationService } from './services/push-notifications.service';
import { logger } from './utils/logger';

const app = createApp(App)
  .use(IonicVue)
  .use(router)
  .component('CustomInput', CustomInput)
  .component('VueDatePicker', VueDatePicker)
  .component('BasePage', BasePage);

// Инициализация менеджера кеша
initializeCacheManager();

// Инициализация Status Bar (без overlay - контент не перекрывает системные панели)
const initializeStatusBar = async () => {
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch {
    // StatusBar доступен только в нативных приложениях (Android/iOS)
    // В веб-версии это нормально, не выводим ошибку в консоль
  }
};

// Обработка deeplinks для сброса пароля
const parseResetPasswordUrl = (urlString: string): { token: string; email: string } | null => {
  try {
    // Поддержка custom scheme (zenythium://reset-password?token=...&email=...)
    // и обычных https ссылок (https://zenythium.netlify.app/reset-password?token=...&email=...)
    let url: URL;
    
    // Если это custom scheme, нужно добавить протокол для парсинга
    if (urlString.startsWith('zenythium://')) {
      url = new URL(urlString.replace('zenythium://', 'https://'));
    } else {
      url = new URL(urlString);
    }
    
    // Проверяем, что это ссылка для сброса пароля
    const isResetPassword = url.pathname === '/reset-password' || 
                           url.host === 'reset-password' ||
                           urlString.includes('/reset-password');
    
    if (isResetPassword) {
      const token = url.searchParams.get('token');
      const email = url.searchParams.get('email');
      
      if (token && email) {
        return {
          token,
          email: decodeURIComponent(email)
        };
      }
    }
  } catch (error) {
    console.warn('Failed to parse reset password URL:', error);
  }
  
  return null;
};

// Обработка deeplinks для общих программ
const parseSharedCycleUrl = (urlString: string): { shareId: string } | null => {
  try {
    // Поддержка custom scheme (zenythium://shared-cycles/{shareId})
    // и обычных https ссылок (https://zenythium.ru/shared-cycles/{shareId})
    let url: URL;
    
    // Если это custom scheme, нужно добавить протокол для парсинга
    if (urlString.startsWith('zenythium://')) {
      url = new URL(urlString.replace('zenythium://', 'https://'));
    } else {
      url = new URL(urlString);
    }
    
    // Проверяем, что это ссылка на общую программу
    // Паттерн: /shared-cycles/{shareId}
    const sharedCycleMatch = url.pathname.match(/^\/shared-cycles\/([^\/]+)$/);
    
    if (sharedCycleMatch) {
      const shareId = sharedCycleMatch[1];
      if (shareId) {
        return { shareId };
      }
    }
  } catch (error) {
    console.warn('Failed to parse shared cycle URL:', error);
  }
  
  return null;
};

const navigateToResetPassword = (token: string, email: string) => {
  // Закрываем все открытые модалки перед навигацией
  const modals = document.querySelectorAll('ion-modal');
  modals.forEach((modal: any) => {
    if (modal.isOpen) {
      modal.dismiss();
    }
  });

  // Используем replace вместо push, чтобы заменить текущий роут
  router.replace({
    path: '/reset-password',
    query: {
      token,
      email
    }
  });
};

const navigateToSharedCycle = (shareId: string) => {
  // Закрываем все открытые модалки перед навигацией
  const modals = document.querySelectorAll('ion-modal');
  modals.forEach((modal: any) => {
    if (modal.isOpen) {
      modal.dismiss();
    }
  });

  // Используем replace вместо push, чтобы заменить текущий роут
  router.replace({
    path: `/shared-cycles/${shareId}`
  });
};

const initializeDeepLinks = () => {
  try {
    // Обработка deeplink при открытии приложения через ссылку
    CapacitorApp.addListener('appUrlOpen', (data: { url: string }) => {
      // Сначала проверяем ссылку на общую программу
      const sharedCycleParams = parseSharedCycleUrl(data.url);
      if (sharedCycleParams) {
        navigateToSharedCycle(sharedCycleParams.shareId);
        return;
      }
      
      // Затем проверяем ссылку на сброс пароля
      const resetPasswordParams = parseResetPasswordUrl(data.url);
      if (resetPasswordParams) {
        navigateToResetPassword(resetPasswordParams.token, resetPasswordParams.email);
      }
    });

    // Обработка deeplink при запуске приложения (если оно было открыто через ссылку)
    CapacitorApp.getLaunchUrl().then((data) => {
      if (data?.url) {
        // Сначала проверяем ссылку на общую программу
        const sharedCycleParams = parseSharedCycleUrl(data.url);
        if (sharedCycleParams) {
          navigateToSharedCycle(sharedCycleParams.shareId);
          return;
        }
        
        // Затем проверяем ссылку на сброс пароля
        const resetPasswordParams = parseResetPasswordUrl(data.url);
        if (resetPasswordParams) {
          navigateToResetPassword(resetPasswordParams.token, resetPasswordParams.email);
        }
      }
    }).catch(() => {
      // Если getLaunchUrl не поддерживается или нет launch URL, это нормально
    });
  } catch (error) {
    // В веб-версии Capacitor App может быть недоступен, это нормально
    console.warn('Deep links initialization failed:', error);
  }
};

// Инициализация push-уведомлений
const initializePushNotifications = async () => {
  try {
    const pushService = PushNotificationService.getInstance();
    await pushService.initialize();

    // Обработка получения уведомления (когда приложение в foreground)
    pushService.onNotificationReceived((notification) => {
      logger.info('Push notification received in app', { notification });
      // Здесь можно показать toast или обновить UI
    });

    // Обработка нажатия на уведомление
    pushService.onNotificationActionPerformed((action) => {
      logger.info('Push notification action performed', { action });
      // Здесь можно выполнить навигацию на нужный экран
      // Например, если в data есть workout_id, открыть страницу тренировки
      if (action.notification?.data) {
        const data = action.notification.data;
        if (data.workout_id) {
          router.push(`/workout/${data.workout_id}`);
        }
      }
    });
  } catch (error) {
    // Ошибки уже логируются в сервисе, здесь просто игнорируем
    // чтобы не блокировать запуск приложения
  }
};

// Обработка URL при открытии в браузере (веб-версия)
const handleWebUrl = () => {
  if (typeof window === 'undefined') return;
  
  const currentUrl = window.location.href;
  
  // Проверяем ссылку на общую программу
  const sharedCycleParams = parseSharedCycleUrl(currentUrl);
  if (sharedCycleParams) {
    navigateToSharedCycle(sharedCycleParams.shareId);
    return;
  }
  
  // Проверяем ссылку на сброс пароля
  const resetPasswordParams = parseResetPasswordUrl(currentUrl);
  if (resetPasswordParams) {
    navigateToResetPassword(resetPasswordParams.token, resetPasswordParams.email);
  }
};

// Инициализация приложения
router.isReady().then(async () => {
  await initializeStatusBar();
  initializeDeepLinks();
  await initializePushNotifications();
  
  // Обработка URL при открытии в браузере (только для веб-версии)
  if (typeof Capacitor === 'undefined' || !Capacitor.isNativePlatform()) {
    handleWebUrl();
  }
  
  app.mount('#app');
});
