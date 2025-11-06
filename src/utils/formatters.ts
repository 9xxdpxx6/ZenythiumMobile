/**
 * Formatters Utility
 */

/**
 * Format date to string
 */
export function formatDate(date: Date | string, format: string = 'YYYY-MM-DD'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    return 'Invalid Date';
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * Format time in seconds to HH:MM:SS or MM:SS
 */
export function formatTime(seconds: number, includeHours: boolean = true): string {
  if (isNaN(seconds) || seconds < 0) {
    return '00:00';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (includeHours && hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Format duration in minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
  if (isNaN(minutes) || minutes < 0) {
    return '0 min';
  }

  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);

  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }

  return `${mins}min`;
}

/**
 * Format number with decimals
 */
export function formatNumber(value: number, decimals: number = 0): string {
  if (isNaN(value)) {
    return '0';
  }

  return value.toFixed(decimals);
}

/**
 * Format weight with unit
 */
export function formatWeight(value: number, unit: 'kg' | 'lbs' = 'kg'): string {
  if (isNaN(value)) {
    return `0 ${unit}`;
  }

  return `${formatNumber(value, 1)} ${unit}`;
}

/**
 * Format distance with unit
 */
export function formatDistance(value: number, unit: 'km' | 'mi' | 'm' = 'km'): string {
  if (isNaN(value)) {
    return `0 ${unit}`;
  }

  return `${formatNumber(value, 2)} ${unit}`;
}

/**
 * Format relative time (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'just now';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  }

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }

  if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }

  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }

  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }

  const years = Math.floor(diffDays / 365);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  if (isNaN(value)) {
    return '0%';
  }

  return `${formatNumber(value, decimals)}%`;
}

/**
 * Format volume (weight × reps)
 */
export function formatVolume(weight: number, reps: number, unit: 'kg' | 'lbs' = 'kg'): string {
  const volume = weight * reps;
  return formatWeight(volume, unit);
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }

  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format list of items
 */
export function formatList(items: string[], maxItems: number = 3): string {
  if (items.length === 0) {
    return '';
  }

  if (items.length <= maxItems) {
    return items.join(', ');
  }

  const visible = items.slice(0, maxItems);
  const remaining = items.length - maxItems;
  return `${visible.join(', ')} +${remaining} more`;
}

/**
 * Converts a string to a hue value (0-360) for color generation
 */
export function hashStringToHue(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  // Map to [0, 360)
  return Math.abs(hash) % 360;
}

/**
 * Generates a color from a string using HSL format
 */
export function getColorFromString(name: string, saturation: number = 70, lightness: number = 55): string {
  const hue = hashStringToHue(name);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export const formatters = {
  date: formatDate,
  time: formatTime,
  duration: formatDuration,
  number: formatNumber,
  weight: formatWeight,
  distance: formatDistance,
  relativeTime: formatRelativeTime,
  percentage: formatPercentage,
  volume: formatVolume,
  truncate,
  capitalize,
  list: formatList,
  getColorFromString,
};

