import { ref, onMounted, onUnmounted, watch, type Ref } from 'vue';
import { Capacitor } from '@capacitor/core';
import { appConfig } from '@/config/app.config';

export interface UseYandexCaptchaReturn {
  captchaToken: Ref<string | null>;
  captchaContainerRef: Ref<HTMLElement | null>;
  isLoaded: Ref<boolean>;
  reset: () => void;
  getToken: () => string | null;
}

// Типы для Yandex SmartCaptcha
declare global {
  interface Window {
    smartCaptcha?: {
      render: (container: HTMLElement, options: {
        sitekey: string;
        callback?: (token: string) => void;
      }) => void;
      reset?: (widgetId?: string) => void;
    };
  }
}

const SCRIPT_URL = 'https://smartcaptcha.cloud.yandex.ru/captcha.js';
let scriptLoaded = false;
let scriptLoading = false;

/**
 * Load Yandex SmartCaptcha script
 */
const loadScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (scriptLoaded) {
      resolve();
      return;
    }

    if (scriptLoading) {
      // Wait for existing loading
      const checkInterval = setInterval(() => {
        if (scriptLoaded) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      return;
    }

    scriptLoading = true;
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    // Не используем defer, чтобы иметь больше контроля над инициализацией
    
    script.onload = () => {
      // Ждем немного, чтобы window.smartCaptcha стал доступен
      setTimeout(() => {
        scriptLoaded = true;
        scriptLoading = false;
        resolve();
      }, 100);
    };
    
    script.onerror = () => {
      scriptLoading = false;
      reject(new Error('Failed to load Yandex SmartCaptcha script'));
    };
    
    document.head.appendChild(script);
  });
};

/**
 * Composable for Yandex SmartCaptcha integration
 * Only works on web platform - disabled on native mobile apps
 */
export function useYandexCaptcha(): UseYandexCaptchaReturn {
  const captchaToken = ref<string | null>(null);
  const captchaContainerRef = ref<HTMLElement | null>(null);
  const isLoaded = ref(false);

  // Check if we're on native platform - captcha is web-only
  const isNativePlatform = Capacitor.isNativePlatform();

  const siteKey = appConfig.yandexCaptchaSiteKey;

  if (!siteKey && !isNativePlatform) {
    console.warn('Yandex Captcha client key (site key) is not configured. Please set VITE_YANDEX_CAPTCHA_SITE_KEY in environment variables. Note: Use CLIENT key, not server key!');
  }

  const initializeCaptcha = async (): Promise<void> => {
    // Don't initialize captcha on native platforms
    if (isNativePlatform) {
      console.log('[Captcha] Native platform detected - skipping Yandex SmartCaptcha initialization');
      return;
    }

    // Disable captcha in development mode
    if (import.meta.env.DEV) {
      console.log('[Captcha] Development mode detected - skipping Yandex SmartCaptcha initialization');
      return;
    }

    if (!siteKey) {
      console.warn('Yandex Captcha site key is not configured');
      return;
    }

    if (!captchaContainerRef.value) {
      return;
    }

    try {
      // Clear container first
      captchaContainerRef.value.innerHTML = '';

      // Создаем элемент с data-атрибутами для автоматической инициализации
      const captchaDiv = document.createElement('div');
      captchaDiv.className = 'smart-captcha';
      captchaDiv.setAttribute('data-sitekey', siteKey);
      captchaContainerRef.value.appendChild(captchaDiv);

      // Загружаем скрипт (если еще не загружен)
      await loadScript();
      
      // Ждем, пока window.smartCaptcha станет доступен
      let waitAttempts = 0;
      const maxWaitAttempts = 20;
      while (!window.smartCaptcha && waitAttempts < maxWaitAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        waitAttempts++;
      }

      if (!window.smartCaptcha) {
        console.error('Yandex SmartCaptcha script loaded but window.smartCaptcha is not available after waiting');
        return;
      }

      // Ждем немного, чтобы скрипт успел инициализировать капчу автоматически
      // Проверяем несколько раз с интервалами
      let attempts = 0;
      const maxAttempts = 15;
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 200));
        const hasIframe = captchaContainerRef.value.querySelector('.smart-captcha iframe');
        const hasWidget = captchaContainerRef.value.querySelector('.smart-captcha [id*="smart-captcha"]');
        const captchaElement = captchaContainerRef.value.querySelector('.smart-captcha');
        const hasContent = captchaElement ? captchaElement.children.length > 0 : false;
        if (hasIframe || hasWidget || hasContent) {
          console.log('Yandex SmartCaptcha initialized automatically');
          break; // Капча инициализирована
        }
        attempts++;
      }

      // Если автоматическая инициализация не сработала, пробуем программную
      const checkCaptchaElement = captchaContainerRef.value.querySelector('.smart-captcha');
      const isInitialized = captchaContainerRef.value.querySelector('.smart-captcha iframe') || 
                           captchaContainerRef.value.querySelector('.smart-captcha [id*="smart-captcha"]') ||
                           (checkCaptchaElement ? checkCaptchaElement.children.length > 0 : false);
      
      if (!isInitialized) {
        console.log('Automatic initialization failed, trying programmatic initialization');
        // Очищаем и пробуем программную инициализацию
        captchaContainerRef.value.innerHTML = '';
        const programmaticDiv = document.createElement('div');
        programmaticDiv.id = `smart-captcha-${Date.now()}`;
        captchaContainerRef.value.appendChild(programmaticDiv);

        try {
          if (window.smartCaptcha.render) {
            window.smartCaptcha.render(programmaticDiv, {
              sitekey: siteKey,
              callback: (token: string) => {
                console.log('Yandex SmartCaptcha token received via callback');
                captchaToken.value = token;
              },
            });
            console.log('Yandex SmartCaptcha initialized programmatically');
          } else {
            console.warn('window.smartCaptcha.render is not available');
            // Возвращаемся к автоматической инициализации
            captchaContainerRef.value.innerHTML = '';
            const autoDiv = document.createElement('div');
            autoDiv.className = 'smart-captcha';
            autoDiv.setAttribute('data-sitekey', siteKey);
            captchaContainerRef.value.appendChild(autoDiv);
          }
        } catch (renderError) {
          console.warn('Programmatic render failed, trying automatic initialization:', renderError);
          // Если программная инициализация не сработала, возвращаемся к автоматической
          captchaContainerRef.value.innerHTML = '';
          const autoDiv = document.createElement('div');
          autoDiv.className = 'smart-captcha';
          autoDiv.setAttribute('data-sitekey', siteKey);
          captchaContainerRef.value.appendChild(autoDiv);
        }
      } else {
        console.log('Yandex SmartCaptcha initialized successfully');
      }

      // Слушаем изменения в DOM для получения токена
      const observer = new MutationObserver(() => {
        // Проверяем hidden input
        const hiddenInput = captchaContainerRef.value?.querySelector<HTMLInputElement>('input[name="smart-token"]');
        if (hiddenInput?.value) {
          captchaToken.value = hiddenInput.value;
        }
        // Также проверяем data-атрибут токена
        const captchaElement = captchaContainerRef.value?.querySelector('.smart-captcha');
        if (captchaElement) {
          const tokenAttr = captchaElement.getAttribute('data-smart-token');
          if (tokenAttr && !captchaToken.value) {
            captchaToken.value = tokenAttr;
          }
        }
      });

      observer.observe(captchaContainerRef.value, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['value', 'data-smart-token'],
      });

      // Cleanup observer on unmount
      onUnmounted(() => {
        observer.disconnect();
      });

      isLoaded.value = true;
    } catch (error) {
      console.error('Failed to initialize Yandex SmartCaptcha:', error);
    }
  };

  // Watch for container ref changes and initialize when mounted
  watch(captchaContainerRef, (newVal) => {
    if (newVal) {
      // Use nextTick to ensure DOM is ready
      setTimeout(() => {
        initializeCaptcha();
      }, 100);
    }
  }, { immediate: true });

  // Also try to initialize on mount
  onMounted(() => {
    if (captchaContainerRef.value) {
      setTimeout(() => {
        initializeCaptcha();
      }, 100);
    }
  });

  const reset = (): void => {
    captchaToken.value = null;
    if (captchaContainerRef.value && window.smartCaptcha?.reset) {
      // Пытаемся сбросить через API, если доступно
      try {
        const captchaDiv = captchaContainerRef.value.querySelector('[id^="smart-captcha-"]');
        if (captchaDiv) {
          window.smartCaptcha.reset();
        }
      } catch (error) {
        console.warn('Failed to reset captcha via API, reinitializing:', error);
      }
    }
    // Переинициализируем капчу
    if (captchaContainerRef.value) {
      captchaContainerRef.value.innerHTML = '';
      setTimeout(() => {
        initializeCaptcha();
      }, 100);
    }
  };

  const getToken = (): string | null => {
    return captchaToken.value;
  };


  return {
    captchaToken,
    captchaContainerRef,
    isLoaded,
    reset,
    getToken,
  };
}

