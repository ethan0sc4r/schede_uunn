import { useState } from 'react';
import { Download, Upload, Database, AlertTriangle } from 'lucide-react';
import { databaseApi } from '../services/api';
import { useToast } from '../contexts/ToastContext';

export default function DatabaseBackup() {
  const [isUploading, setIsUploading] = useState(false);
  const [showConfirmRestore, setShowConfirmRestore] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { success, error: showError, warning } = useToast();

  const handleDownloadBackup = async () => {
    try {
      await databaseApi.downloadBackup();
      success('Database backup scaricato con successo!');
    } catch (error: any) {
      console.error('Error downloading backup:', error);
      showError('Errore durante il download del backup');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.db') && !file.name.endsWith('.zip')) {
        showError('Il file deve essere un database .db o un backup completo .zip');
        return;
      }
      setSelectedFile(file);
      setShowConfirmRestore(true);
    }
  };

  const handleRestoreConfirm = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const result = await databaseApi.uploadRestore(selectedFile);
      success(`Database ripristinato con successo! Backup creato: ${result.backup_created}`);
      setShowConfirmRestore(false);
      setSelectedFile(null);

      // Suggest page reload
      setTimeout(() => {
        if (window.confirm('Database ripristinato. Vuoi ricaricare la pagina per vedere i cambiamenti?')) {
          window.location.reload();
        }
      }, 1000);
    } catch (error: any) {
      console.error('Error restoring database:', error);
      showError('Errore durante il ripristino del database');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-6">
        <Database className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">Backup Database</h2>
      </div>

      <div className="space-y-4">
        {/* Download Backup */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Scarica Backup Completo</h3>
          <p className="text-sm text-gray-600 mb-3">
            Scarica un file ZIP contenente il database e tutte le immagini (loghi, bandiere, silhouette, gallerie).
          </p>
          <button
            onClick={handleDownloadBackup}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Scarica Database
          </button>
        </div>

        {/* Upload Restore */}
        <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
          <div className="flex items-start gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Ripristina Backup</h3>
              <p className="text-sm text-gray-600 mb-2">
                <strong>ATTENZIONE:</strong> Questa operazione sostituirà completamente il database attuale.
                Un backup automatico verrà creato prima del ripristino.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors cursor-pointer inline-flex">
            <Upload className="h-4 w-4" />
            Seleziona File Backup (.zip o .db)
            <input
              type="file"
              accept=".db,.zip"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmRestore && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <h3 className="text-xl font-bold text-gray-900">Conferma Ripristino</h3>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                Stai per ripristinare il database dal file:
              </p>
              <p className="text-sm font-mono bg-gray-100 p-2 rounded break-all">
                {selectedFile.name}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Dimensione: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>Nota:</strong> Il database e le immagini attuali verranno salvati come backup automatico prima del ripristino.
                  {selectedFile.name.endsWith('.zip') && (
                    <span className="block mt-1">
                      Il file ZIP contiene database e immagini che verranno ripristinati.
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmRestore(false);
                  setSelectedFile(null);
                }}
                disabled={isUploading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Annulla
              </button>
              <button
                onClick={handleRestoreConfirm}
                disabled={isUploading}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                {isUploading ? 'Ripristino...' : 'Conferma Ripristino'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
