/**
 * Export utility functions for file downloads
 */

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { errorHandler } from './error-handler';
import { logger } from './logger';

/**
 * Download a blob file
 * On mobile devices, saves file and opens Share dialog
 * On web, uses browser download
 */
export async function downloadFile(blob: Blob, filename: string): Promise<string | null> {
  try {
    // Check if we're on a mobile platform
    if (Capacitor.isNativePlatform()) {
      logger.info(`[export] Starting file export on native platform: ${filename}`);
      
      // Convert blob to base64
      const base64Data = await blobToBase64(blob);
      logger.info(`[export] Blob converted to base64, size: ${base64Data.length} chars`);
      
      // Use Cache directory for faster write and immediate sharing
      logger.info(`[export] Writing file to Cache directory for faster access`);
      
      // Write file to Cache directory (faster than Documents)
      const writeResult = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache,
      });
      
      logger.info(`[export] File written successfully, URI: ${writeResult.uri}`);
      
      // Immediately try to share the file using Share API
      // Use writeResult.uri directly to save time (skip getUri call)
      // Don't check canShare() first - just try to share immediately
      try {
        logger.info(`[export] Immediately attempting to share file with URI: ${writeResult.uri}`);
        
        await Share.share({
          url: writeResult.uri,
          dialogTitle: 'Сохранить или открыть файл',
        });
        
        logger.info('[export] Share dialog opened successfully');
      } catch (shareError) {
        logger.warn(`[export] Share API failed: ${shareError}`);
        // Если Share не сработал, файл всё равно сохранен в Cache
      }
      
      // Return URI (even if share failed, file is saved)
      return writeResult.uri;
    } else {
      // Web platform - use browser download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return null;
    }
  } catch (error) {
    errorHandler.log(error, 'export.downloadFile');
    throw error;
  }
}

/**
 * Download JSON data as a file
 */
export async function downloadJson(data: object, filename: string): Promise<string | null> {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    return await downloadFile(blob, filename);
  } catch (error) {
    errorHandler.log(error, 'export.downloadJson');
    throw error;
  }
}

/**
 * Convert Blob to base64 string
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}


