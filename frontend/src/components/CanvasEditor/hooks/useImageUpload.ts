/**
 * useImageUpload Hook
 * Handles image uploads for canvas elements (logo, flag, silhouette, general)
 */

import { useState, useCallback } from 'react';
import { useToast } from '../../../contexts/ToastContext';

type ImageType = 'logos' | 'flags' | 'silhouettes' | 'general';

interface UseImageUploadReturn {
  isUploading: boolean;
  uploadImage: (file: File, type: ImageType) => Promise<string | null>;
  uploadLogo: (file: File) => Promise<string | null>;
  uploadFlag: (file: File) => Promise<string | null>;
  uploadSilhouette: (file: File) => Promise<string | null>;
  uploadGeneral: (file: File) => Promise<string | null>;
  setImageFromUrl: (url: string) => Promise<string>;
}

export const useImageUpload = (): UseImageUploadReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const { error: showError, success } = useToast();

  /**
   * Generic image upload function
   */
  const uploadImage = useCallback(
    async (file: File, type: ImageType): Promise<string | null> => {
      setIsUploading(true);

      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/api/upload/${type}`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const data = await response.json();
        success(`Immagine caricata con successo`);
        return data.path || data.filename;
      } catch (error: any) {
        console.error('Error uploading image:', error);
        showError(`Errore durante l'upload dell'immagine: ${error.message}`);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [showError, success]
  );

  /**
   * Upload logo image
   */
  const uploadLogo = useCallback(
    async (file: File): Promise<string | null> => {
      return uploadImage(file, 'logos');
    },
    [uploadImage]
  );

  /**
   * Upload flag image
   */
  const uploadFlag = useCallback(
    async (file: File): Promise<string | null> => {
      return uploadImage(file, 'flags');
    },
    [uploadImage]
  );

  /**
   * Upload silhouette image
   */
  const uploadSilhouette = useCallback(
    async (file: File): Promise<string | null> => {
      return uploadImage(file, 'silhouettes');
    },
    [uploadImage]
  );

  /**
   * Upload general image
   */
  const uploadGeneral = useCallback(
    async (file: File): Promise<string | null> => {
      return uploadImage(file, 'general');
    },
    [uploadImage]
  );

  /**
   * Set image from external URL (e.g., flag URLs)
   * Returns the URL as-is since external URLs don't need uploading
   */
  const setImageFromUrl = useCallback(async (url: string): Promise<string> => {
    // For external URLs (like flagcdn.com), we just return the URL
    // The backend will handle downloading and storing if needed
    return url;
  }, []);

  return {
    isUploading,
    uploadImage,
    uploadLogo,
    uploadFlag,
    uploadSilhouette,
    uploadGeneral,
    setImageFromUrl,
  };
};
