/**
 * Composable for handling file exports
 * Provides state management and error handling for file downloads
 */

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

