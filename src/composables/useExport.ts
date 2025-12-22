/**
 * Composable for handling file exports
 * Provides state management and error handling for file downloads
 */

import { Capacitor } from '@capacitor/core';
import { useToast } from './useToast';
import { errorHandler } from '@/utils/error-handler';
import { downloadFile, downloadJson } from '@/utils/export';

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
      let fileUri: string | null = null;

      if (format === 'pdf') {
        if (result instanceof Blob) {
          fileUri = await downloadFile(result, filename);
        } else {
          throw new Error('Ожидался Blob для PDF экспорта');
        }
      } else {
        if (typeof result === 'object' && result !== null) {
          fileUri = await downloadJson(result, filename);
        } else {
          throw new Error('Ожидался объект для JSON экспорта');
        }
      }

      // Show simple success message
      showSuccess('Файл успешно экспортирован');
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

