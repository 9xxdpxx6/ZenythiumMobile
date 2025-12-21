/**
 * Export utility functions for file downloads
 */

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { errorHandler } from './error-handler';

/**
 * Download a blob file
 * On mobile devices, uses Share API to show share dialog
 * On web, uses browser download
 */
export async function downloadFile(blob: Blob, filename: string): Promise<void> {
  try {
    // Check if we're on a mobile platform
    if (Capacitor.isNativePlatform()) {
      // Convert blob to base64
      const base64Data = await blobToBase64(blob);
      
      // Write file to Documents directory (accessible for sharing)
      const writeResult = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Documents,
      });
      
      // Share the file using Share API
      // This will open a dialog where user can choose where to save/open the file
      await Share.share({
        title: filename,
        text: `Экспортированный файл: ${filename}`,
        url: writeResult.uri,
        dialogTitle: 'Сохранить или открыть файл',
      });
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
    }
  } catch (error) {
    errorHandler.log(error, 'export.downloadFile');
    throw error;
  }
}

/**
 * Download JSON data as a file
 */
export async function downloadJson(data: object, filename: string): Promise<void> {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    await downloadFile(blob, filename);
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


