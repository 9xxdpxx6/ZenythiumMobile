import { describe, it, expect } from 'vitest';
import { formatLocalDate, parseLocalDate, parseCalendarDateFromApi } from './local-date';

describe('local-date', () => {
  it('parseLocalDate round-trips YYYY-MM-DD without UTC shift', () => {
    const d = parseLocalDate('2024-03-29');
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2024);
    expect(d!.getMonth()).toBe(2);
    expect(d!.getDate()).toBe(29);
    expect(formatLocalDate(d!)).toBe('2024-03-29');
  });

  it('rejects invalid calendar dates', () => {
    expect(parseLocalDate('2024-02-30')).toBeNull();
    expect(parseLocalDate('not-a-date')).toBeNull();
  });

  it('parseCalendarDateFromApi: date-only uses local midnight, not UTC parse', () => {
    const d = parseCalendarDateFromApi('2024-03-29');
    expect(d).not.toBeNull();
    expect(formatLocalDate(d!)).toBe('2024-03-29');
  });

  it('formatLocalDate uses local components (example: same calendar day)', () => {
    const noon = new Date(2024, 2, 29, 12, 30, 0);
    expect(formatLocalDate(noon)).toBe('2024-03-29');
  });
});
