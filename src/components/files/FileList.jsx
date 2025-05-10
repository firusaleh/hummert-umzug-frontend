// src/components/files/FileList.jsx
import React, { useState, useEffect } from 'react';
import { fileService } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

const FileList = ({ projectId, taskId, refreshTrigger }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Funktion zum Laden der Dateien
  const loadFiles = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {};
      if (projectId) params.project = projectId;
      if (taskId) params.task = taskId;

      const response = await fileService.getFiles(params);
      setFiles(response.data);
    } catch (err) {
      setError('Fehler beim Laden der Dateien');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Effekt zum Laden der Dateien beim ersten Rendern und wenn refreshTrigger sich ändert
  useEffect(() => {
    loadFiles();
  }, [projectId, taskId, refreshTrigger]);

  // Datei löschen
  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Möchtest du diese Datei wirklich löschen?')) {
      return;
    }

    try {
      await fileService.deleteFile(fileId);
      // Nach erfolgreichem Löschen die Liste aktualisieren
      loadFiles();
    } catch (err) {
      setError('Fehler beim Löschen der Datei');
      console.error(err);
    }
  };

  // Dateityp-Icon bestimmen
  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) {
      return '🖼️';
    } else if (fileType === 'application/pdf') {
      return '📄';
    } else if (
      fileType === 'application/msword' ||
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return '📝';
    } else if (
      fileType === 'application/vnd.ms-excel' ||
      fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      return '📊';
    } else if (fileType === 'text/plain' || fileType === 'text/csv') {
      return '📋';
    } else {
      return '📎';
    }
  };

  // Dateigröße formatieren
  const formatFileSize = (bytes) => {
    if (bytes < 1024) {
      return bytes + ' B';
    } else if (bytes < 1048576) {
      return (bytes / 1024).toFixed(1) + ' KB';
    } else {
      return (bytes / 1048576).toFixed(1) + ' MB';
    }
  };

  // Datum formatieren
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: de });
  };

  if (loading) {
    return <div className="text-center py-4">Dateien werden geladen...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (files.length === 0) {
    return <div className="text-center py-4 text-gray-500">Keine Dateien vorhanden</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Datei
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Größe
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Hochgeladen
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Aktionen
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {files.map(file => (
            <tr key={file._id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <span className="text-xl mr-2">{getFileIcon(file.fileType)}</span>
                  <div className="ml-1">
                    <div className="text-sm font-medium text-gray-900">
                      {file.originalName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {file.uploadedBy?.username || 'Unbekannter Benutzer'}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatFileSize(file.fileSize)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(file.createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <a
                  href={`${process.env.REACT_APP_API_URL || ''}/uploads/${file.fileName}`}
                  download={file.originalName}
                  className="text-indigo-600 hover:text-indigo-900 mr-4"
                >
                  Herunterladen
                </a>
                <button
                  onClick={() => handleDeleteFile(file._id)}
                  className="text-red-600 hover:text-red-900"
                >
                  Löschen
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FileList;