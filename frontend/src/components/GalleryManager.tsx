import { useState, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Loader } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { navalUnitsApi } from '../services/api';
import { getImageUrl } from '../utils/imageUtils';
import { useToast } from '../contexts/ToastContext';
import type { GalleryImage } from '../types/index.ts';

interface GalleryManagerProps {
  unitId: number;
}

export default function GalleryManager({ unitId }: GalleryManagerProps) {
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [captions, setCaptions] = useState<{ [key: string]: string }>({});
  const [isDragging, setIsDragging] = useState(false);

  // Fetch gallery images
  const { data: galleryData, isLoading } = useQuery({
    queryKey: ['gallery', unitId],
    queryFn: () => navalUnitsApi.getGallery(unitId),
  });

  const gallery = galleryData?.gallery || [];

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ file, caption }: { file: File; caption?: string }) => {
      return navalUnitsApi.uploadGalleryImage(unitId, file, caption);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery', unitId] });
      queryClient.invalidateQueries({ queryKey: ['unit', unitId] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (imageId: number) => navalUnitsApi.deleteGalleryImage(unitId, imageId),
    onSuccess: () => {
      success('Immagine eliminata con successo');
      queryClient.invalidateQueries({ queryKey: ['gallery', unitId] });
      queryClient.invalidateQueries({ queryKey: ['unit', unitId] });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files).filter(file =>
        file.type.startsWith('image/')
      );
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    const newCaptions = { ...captions };
    delete newCaptions[`temp-${index}`];
    setCaptions(newCaptions);
  };

  const uploadSelectedFiles = async () => {
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const caption = captions[`temp-${i}`];

        // Upload file first
        const result = await uploadMutation.mutateAsync({ file, caption });

        // If caption exists, update it separately
        if (caption && result.image_id) {
          await navalUnitsApi.updateGalleryCaption(unitId, result.image_id, caption);
        }
      }
      success(`${selectedFiles.length} immagini caricate con successo`);
      setSelectedFiles([]);
      setCaptions({});
    } catch (error) {
      showError('Errore durante il caricamento delle immagini');
    }
  };

  const deleteImage = async (imageId: number) => {
    if (confirm('Sei sicuro di voler eliminare questa immagine?')) {
      await deleteMutation.mutateAsync(imageId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Galleria Immagini</h3>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-2">
            Trascina qui le immagini oppure
          </p>
          <label className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
            Seleziona File
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
          <p className="text-xs text-gray-500 mt-2">
            Formati supportati: JPG, PNG, GIF, WebP
          </p>
        </div>
      </div>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">File selezionati ({selectedFiles.length})</h4>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="h-16 w-16 object-cover rounded"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <input
                    type="text"
                    placeholder="Didascalia (opzionale)"
                    value={captions[`temp-${index}`] || ''}
                    onChange={(e) => setCaptions(prev => ({ ...prev, [`temp-${index}`]: e.target.value }))}
                    className="mt-1 text-sm input-field"
                  />
                </div>
                <button
                  onClick={() => removeSelectedFile(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={uploadSelectedFiles}
            disabled={uploadMutation.isPending}
            className="w-full btn-primary disabled:opacity-50"
          >
            {uploadMutation.isPending ? 'Caricamento...' : `Carica ${selectedFiles.length} immagini`}
          </button>
        </div>
      )}

      {/* Existing Gallery */}
      {gallery.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Immagini caricate ({gallery.length})</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {gallery.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={getImageUrl(image.image_path)}
                  alt={image.caption || 'Gallery image'}
                  className="w-full h-32 object-cover rounded-lg"
                />
                {image.caption && (
                  <p className="text-xs text-gray-600 mt-1 truncate">{image.caption}</p>
                )}
                <button
                  onClick={() => deleteImage(image.id)}
                  className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {gallery.length === 0 && selectedFiles.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p>Nessuna immagine nella galleria</p>
          <p className="text-sm mt-1">Aggiungi immagini trascinandole o selezionandole</p>
        </div>
      )}
    </div>
  );
}
