import { describe, it, expect } from 'vitest';
import { formatLocalDate, parseLocalDate } from '@/utils/local-date';

/**
 * Минимальный smoke: утилиты календарных дат (без монтирования Vue).
 */
describe('smoke: local-date utils', () => {
  it('parseLocalDate + formatLocalDate round-trip', () => {
    const d = parseLocalDate('2024-06-15');
    expect(d).not.toBeNull();
    expect(formatLocalDate(d!)).toBe('2024-06-15');
  });
});
