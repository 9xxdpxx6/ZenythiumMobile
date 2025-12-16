import { ref, onMounted, onUnmounted, watch, type Ref } from 'vue';
import { appConfig } from '@/config/app.config';

export interface UseYandexCaptchaReturn {
  captchaToken: Ref<string | null>;
  captchaContainerRef: Ref<HTMLElement | null>;
  isLoaded: Ref<boolean>;
  reset: () => void;
  getToken: () => string | null;
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
    script.defer = true;
    script.async = true;
    
    script.onload = () => {
      scriptLoaded = true;
      scriptLoading = false;
      resolve();
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
 */
export function useYandexCaptcha(): UseYandexCaptchaReturn {
  const captchaToken = ref<string | null>(null);
  const captchaContainerRef = ref<HTMLElement | null>(null);
  const isLoaded = ref(false);

  const siteKey = appConfig.yandexCaptchaSiteKey;

  if (!siteKey) {
    console.warn('Yandex Captcha site key is not configured. Please set VITE_YANDEX_CAPTCHA_SITE_KEY in environment variables.');
  }

  const initializeCaptcha = async (): Promise<void> => {
    if (!siteKey) {
      return;
    }

    if (!captchaContainerRef.value) {
      return;
    }

    try {
      await loadScript();
      
      // Clear container first
      captchaContainerRef.value.innerHTML = '';

      // Create captcha container div with required attributes
      // Yandex SmartCaptcha will automatically initialize when script loads
      const captchaDiv = document.createElement('div');
      captchaDiv.className = 'smart-captcha';
      captchaDiv.setAttribute('data-sitekey', siteKey);
      captchaContainerRef.value.appendChild(captchaDiv);

      // Listen for token in hidden input that SmartCaptcha creates
      const observer = new MutationObserver(() => {
        const hiddenInput = captchaContainerRef.value?.querySelector<HTMLInputElement>('input[name="smart-token"]');
        if (hiddenInput?.value) {
          captchaToken.value = hiddenInput.value;
        }
      });

      observer.observe(captchaContainerRef.value, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['value'],
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
    if (captchaContainerRef.value) {
      captchaContainerRef.value.innerHTML = '';
      // Reinitialize after a short delay
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

