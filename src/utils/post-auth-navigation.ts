/**
 * Shared cycle deep link: guard кладёт pendingShareId в sessionStorage до логина.
 * После успешного login/register и при заходе на /login|/register уже авторизованным —
 * один источник: прочитать id, очистить ключ, вернуть путь назначения.
 */
const PENDING_SHARE_KEY = 'pendingShareId';

export function consumePostAuthDestination(): string {
  if (typeof sessionStorage === 'undefined') return '/tabs/home';
  const raw = sessionStorage.getItem(PENDING_SHARE_KEY);
  sessionStorage.removeItem(PENDING_SHARE_KEY);
  const id = raw?.trim();
  if (id) {
    return `/shared-cycles/${encodeURIComponent(id)}`;
  }
  return '/tabs/home';
}
