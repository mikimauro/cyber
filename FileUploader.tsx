import { useState, useCallback } from 'react';
import { Upload, FileImage, FileVideo, X, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FileUploaderProps {
  onFileSelected: (file: File) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  progress: number;
  selectedFile: File | null;
}

export function FileUploader({ 
  onFileSelected, 
  onAnalyze, 
  isAnalyzing, 
  progress,
  selectedFile 
}: FileUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!validTypes.includes(file.type)) {
      setError('Formato non supportato. Usa: JPG, PNG, WebP, GIF, MP4');
      return false;
    }

    if (file.size > maxSize) {
      setError('File troppo grande. Max 50MB');
      return false;
    }

    setError(null);
    return true;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        onFileSelected(file);
      }
    }
  }, [onFileSelected]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        onFileSelected(file);
      }
    }
  }, [onFileSelected]);

  const clearFile = () => {
    onFileSelected(null as any);
    setError(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-2xl p-12 text-center
            transition-all duration-300 cursor-pointer
            ${isDragActive 
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }
          `}
        >
          <input
            type="file"
            accept="image/*,video/mp4"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="flex flex-col items-center gap-4">
            <div className={`
              w-20 h-20 rounded-full flex items-center justify-center
              transition-all duration-300
              ${isDragActive 
                ? 'bg-blue-100 dark:bg-blue-900' 
                : 'bg-gray-100 dark:bg-gray-800'
              }
            `}>
              <Upload className={`
                w-10 h-10 transition-colors
                ${isDragActive ? 'text-blue-600' : 'text-gray-500'}
              `} />
            </div>
            
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {isDragActive ? 'Rilascia il file qui' : 'Trascina un file o clicca per selezionare'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Supporta: JPG, PNG, WebP, GIF, MP4 (max 50MB)
              </p>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-xs text-gray-500">
                Analisi sicura e privata - i file non vengono salvati
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0">
              {selectedFile.type.startsWith('image/') ? (
                <FileImage className="w-8 h-8 text-blue-600" />
              ) : (
                <FileVideo className="w-8 h-8 text-purple-600" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(selectedFile.size)} • {selectedFile.type}
                  </p>
                </div>
                <button
                  onClick={clearFile}
                  disabled={isAnalyzing}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {isAnalyzing && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Analisi in corso...
                    </span>
                    <span className="text-sm text-gray-500">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-gray-500 mt-2">
                    {progress < 30 && 'Analisi metadati EXIF...'}
                    {progress >= 30 && progress < 60 && 'Analisi Error Level...'}
                    {progress >= 60 && progress < 80 && 'Ricerca reverse image...'}
                    {progress >= 80 && 'Generazione report...'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {!isAnalyzing && (
            <div className="mt-6 flex gap-3">
              <Button 
                onClick={onAnalyze}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Shield className="w-4 h-4 mr-2" />
                Avvia Analisi Forense
              </Button>
              <Button 
                variant="outline" 
                onClick={clearFile}
              >
                Cambia File
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
