import { createApp } from 'vue'
import App from './App.vue'
import router from './router';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App as CapacitorApp } from '@capacitor/app';

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
const initializeDeepLinks = () => {
  try {
    // Обработка deeplink при открытии приложения через ссылку
    CapacitorApp.addListener('appUrlOpen', (data: { url: string }) => {
      const url = new URL(data.url);
      
      // Проверяем, что это ссылка для сброса пароля
      if (url.pathname === '/reset-password') {
        const token = url.searchParams.get('token');
        const email = url.searchParams.get('email');
        
        if (token && email) {
          // Навигируем на страницу сброса пароля с параметрами
          router.push({
            path: '/reset-password',
            query: {
              token,
              email: decodeURIComponent(email)
            }
          });
        }
      }
    });

    // Обработка deeplink при запуске приложения (если оно было открыто через ссылку)
    CapacitorApp.getLaunchUrl().then((data) => {
      if (data?.url) {
        const url = new URL(data.url);
        
        if (url.pathname === '/reset-password') {
          const token = url.searchParams.get('token');
          const email = url.searchParams.get('email');
          
          if (token && email) {
            router.push({
              path: '/reset-password',
              query: {
                token,
                email: decodeURIComponent(email)
              }
            });
          }
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

// Инициализация приложения
router.isReady().then(async () => {
  await initializeStatusBar();
  initializeDeepLinks();
  app.mount('#app');
});
