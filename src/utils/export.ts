/**
 * Export utility functions for file downloads
 */

import { errorHandler } from './error-handler';

/**
 * Download a blob file
 */
export function downloadFile(blob: Blob, filename: string): void {
  try {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    errorHandler.log(error, 'export.downloadFile');
    throw error;
  }
}

/**
 * Download JSON data as a file
 */
export function downloadJson(data: object, filename: string): void {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    downloadFile(blob, filename);
  } catch (error) {
    errorHandler.log(error, 'export.downloadJson');
    throw error;
  }
}

