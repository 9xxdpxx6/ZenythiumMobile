/**
 * Composable for handling file exports
 * Provides utilities for downloading files (PDF, JSON) from API responses
 */

import { useToast } from './useToast';
import { errorHandler } from '@/utils/error-handler';

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
    errorHandler.log(error, 'useExport.downloadFile');
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
    errorHandler.log(error, 'useExport.downloadJson');
    throw error;
  }
}

/**
 * Handle export with proper error handling and user feedback
 */
export function useExport() {
  const { showSuccess, showError } = useToast();

  const handleExport = async (
    exportFn: () => Promise<Blob | object>,
    filename: string,
    format: 'json' | 'pdf'
  ): Promise<void> => {
    try {
      const result = await exportFn();

      if (format === 'pdf') {
        if (result instanceof Blob) {
          downloadFile(result, filename);
          showSuccess('Файл успешно экспортирован');
        } else {
          throw new Error('Ожидался Blob для PDF экспорта');
        }
      } else {
        if (typeof result === 'object' && result !== null) {
          downloadJson(result, filename);
          showSuccess('Файл успешно экспортирован');
        } else {
          throw new Error('Ожидался объект для JSON экспорта');
        }
      }
    } catch (error) {
      errorHandler.log(error, 'useExport.handleExport');
      const errorMessage = errorHandler.format(error);
      showError(errorMessage || 'Ошибка при экспорте файла');
    }
  };

  return {
    downloadFile,
    downloadJson,
    handleExport,
  };
}

