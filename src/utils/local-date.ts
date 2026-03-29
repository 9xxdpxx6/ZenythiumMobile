/**
 * Календарные даты (date-only) в локальной зоне: без сдвига через UTC при сериализации YYYY-MM-DD.
 */

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Сериализация календарной даты в YYYY-MM-DD по локальным year/month/date (не UTC).
 */
export function formatLocalDate(date: Date): string {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Разбор строго YYYY-MM-DD в Date в полночь локальной зоны (без парсинга как UTC).
 */
export function parseLocalDate(value: string): Date | null {
  const m = DATE_ONLY.exec(value.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) {
    return null;
  }
  return dt;
}

/**
 * Загрузка из API: date-only строка или ISO datetime → дата для UI (локальная календарная дата).
 * Для полного ISO берётся локальный календарный день момента времени.
 */
export function parseCalendarDateFromApi(value: string | null | undefined): Date | null {
  if (value == null || value === '') return null;
  const s = String(value).trim();
  const only = parseLocalDate(s);
  if (only) return only;
  const inst = new Date(s);
  if (Number.isNaN(inst.getTime())) return null;
  return new Date(inst.getFullYear(), inst.getMonth(), inst.getDate());
}
