/**
 * Абсолютные URL внутри приложения с учётом Vite import.meta.env.BASE_URL (root deploy: '/').
 */
export function getAppOriginBase(): string {
  if (typeof window === 'undefined') return '';
  const base = import.meta.env.BASE_URL;
  const normalized = base.endsWith('/') ? base : `${base}/`;
  return `${window.location.origin}${normalized}`;
}

/**
 * Полный href для редиректа на /login (без жёсткого '/login' в обход BASE_URL).
 */
export function getLoginRedirectHref(): string {
  return new URL('login', getAppOriginBase()).href;
}
