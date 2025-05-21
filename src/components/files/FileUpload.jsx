// src/components/files/FileUpload.jsx
import React, { useState } from 'react';
import { fileService } from '../../services/api';

const FileUpload = ({ projectId, taskId, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setError(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Bitte wähle eine Datei aus');
      return;
    }

    setUploading(true);
    setProgress(0);

    // Simulierter Upload-Fortschritt (in einer realen Anwendung würde hier eine Axios Request mit onUploadProgress verwendet werden)
    const progressInterval = setInterval(() => {
      setProgress(prevProgress => {
        const newProgress = prevProgress + 10;
        if (newProgress >= 90) {
          clearInterval(progressInterval);
        }
        return newProgress > 90 ? 90 : newProgress;
      });
    }, 300);

    try {
      // Create fileData with null-safety
      const fileData = {
        file,
        // Only include properties that have values
        ...(projectId && { project: projectId }),
        ...(taskId && { task: taskId })
      };

      // Log upload data for debugging
      console.log('Uploading file with data:', { 
        fileName: file?.name,
        fileSize: file?.size,
        projectId,
        taskId
      });

      await fileService.uploadFile(fileData);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      // Nach erfolgreichem Upload das Formular zurücksetzen
      setFile(null);
      
      // Event-Handler für erfolgreichen Upload aufrufen
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      clearInterval(progressInterval);
      setProgress(0);
      setError(err.response?.data?.message || 'Fehler beim Hochladen der Datei');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Datei hochladen</h3>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleUpload}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Datei auswählen
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            disabled={uploading}
            className="mt-1 block w-full"
          />
          <p className="mt-1 text-sm text-gray-500">
            Maximale Dateigröße: 10MB. Erlaubte Dateitypen: Bilder, PDFs, DOC, DOCX, XLS, XLSX, TXT, CSV
          </p>
        </div>
        
        {uploading && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-1">{progress}% hochgeladen</p>
          </div>
        )}
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={uploading || !file}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {uploading ? 'Wird hochgeladen...' : 'Hochladen'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FileUpload;