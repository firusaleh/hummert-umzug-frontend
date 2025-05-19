// src/components/files/FileUpload.fixed.jsx
import React, { useState, useRef } from 'react';
import { Upload, X, File, CheckCircle } from 'lucide-react';
import api from '../../services/api.fixed';
import PropTypes from 'prop-types';

const FileUpload = ({ 
  projectId, 
  taskId, 
  onUploadSuccess,
  onUploadError,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  acceptedFileTypes = [
    'image/*',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ],
  multiple = false,
  dragAndDrop = true,
  showPreview = true
}) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // File type mapping for display
  const fileTypeMapping = {
    'image/*': 'Bilder',
    'application/pdf': 'PDF',
    'application/msword': 'DOC',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.ms-excel': 'XLS',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    'text/plain': 'TXT',
    'text/csv': 'CSV'
  };

  // Get accepted file types display string
  const getAcceptedTypesDisplay = () => {
    return acceptedFileTypes
      .map(type => fileTypeMapping[type] || type)
      .join(', ');
  };

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Validate file
  const validateFile = (file) => {
    if (file.size > maxFileSize) {
      return `Datei ist zu groß. Maximum: ${formatFileSize(maxFileSize)}`;
    }

    const isTypeAccepted = acceptedFileTypes.some(acceptedType => {
      if (acceptedType.includes('*')) {
        const baseType = acceptedType.split('/')[0];
        return file.type.startsWith(baseType);
      }
      return file.type === acceptedType;
    });

    if (!isTypeAccepted) {
      return `Dateityp nicht erlaubt. Erlaubt: ${getAcceptedTypesDisplay()}`;
    }

    return null;
  };

  // Handle file selection
  const handleFileSelect = (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);
    const validFiles = [];
    const errors = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push({
          file,
          id: Date.now() + Math.random(),
          status: 'pending'
        });
      }
    });

    if (errors.length > 0) {
      setError(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      if (multiple) {
        setFiles(prev => [...prev, ...validFiles]);
      } else {
        setFiles([validFiles[0]]);
      }
      setError(null);
    }
  };

  // Handle file input change
  const handleFileChange = (e) => {
    handleFileSelect(e.target.files);
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // Remove file from list
  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setUploadProgress(prev => {
      const updated = { ...prev };
      delete updated[fileId];
      return updated;
    });
  };

  // Upload single file
  const uploadFile = async (fileItem) => {
    const formData = new FormData();
    formData.append('file', fileItem.file);
    if (projectId) formData.append('projectId', projectId);
    if (taskId) formData.append('taskId', taskId);

    try {
      const response = await api.file.upload(formData, {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(prev => ({
            ...prev,
            [fileItem.id]: progress
          }));
        }
      });

      if (response.success) {
        setFiles(prev => 
          prev.map(f => 
            f.id === fileItem.id 
              ? { ...f, status: 'success', uploadedFile: response.data }
              : f
          )
        );
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Upload fehlgeschlagen');
      }
    } catch (error) {
      setFiles(prev => 
        prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'error', error: error.message }
            : f
        )
      );
      throw error;
    }
  };

  // Upload all files
  const handleUpload = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setUploading(true);
    setError(null);

    const uploadPromises = pendingFiles.map(fileItem => uploadFile(fileItem));

    try {
      const results = await Promise.allSettled(uploadPromises);
      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      if (successful.length > 0 && onUploadSuccess) {
        onUploadSuccess(successful.map(r => r.value));
      }

      if (failed.length > 0) {
        const errorMessage = `${failed.length} Datei(en) konnten nicht hochgeladen werden`;
        setError(errorMessage);
        if (onUploadError) {
          onUploadError(failed.map(r => r.reason));
        }
      }
    } catch (error) {
      setError('Ein unerwarteter Fehler ist aufgetreten');
      if (onUploadError) {
        onUploadError([error]);
      }
    } finally {
      setUploading(false);
    }
  };

  // Clear all files
  const clearFiles = () => {
    setFiles([]);
    setUploadProgress({});
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Datei hochladen</h3>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <pre className="whitespace-pre-wrap">{error}</pre>
        </div>
      )}
      
      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={dragAndDrop ? handleDrag : undefined}
        onDragLeave={dragAndDrop ? handleDrag : undefined}
        onDragOver={dragAndDrop ? handleDrag : undefined}
        onDrop={dragAndDrop ? handleDrop : undefined}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {dragAndDrop ? (
            <>
              Ziehe Dateien hierher oder{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-500"
              >
                durchsuche
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 hover:text-blue-500"
            >
              Dateien auswählen
            </button>
          )}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Maximale Dateigröße: {formatFileSize(maxFileSize)}
        </p>
        <p className="text-xs text-gray-500">
          Erlaubte Dateitypen: {getAcceptedTypesDisplay()}
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          accept={acceptedFileTypes.join(',')}
          multiple={multiple}
          className="hidden"
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map(fileItem => (
            <div
              key={fileItem.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <File className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {fileItem.file.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(fileItem.file.size)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {fileItem.status === 'pending' && (
                  <span className="text-sm text-gray-500">Bereit</span>
                )}
                
                {fileItem.status === 'uploading' && (
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress[fileItem.id] || 0}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500">
                      {uploadProgress[fileItem.id] || 0}%
                    </span>
                  </div>
                )}
                
                {fileItem.status === 'success' && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                
                {fileItem.status === 'error' && (
                  <span className="text-sm text-red-600">{fileItem.error}</span>
                )}
                
                {fileItem.status !== 'uploading' && (
                  <button
                    type="button"
                    onClick={() => removeFile(fileItem.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      {files.length > 0 && (
        <div className="mt-4 flex justify-end space-x-3">
          <button
            type="button"
            onClick={clearFiles}
            disabled={uploading}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            Alle entfernen
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || files.every(f => f.status !== 'pending')}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {uploading ? 'Wird hochgeladen...' : 'Hochladen'}
          </button>
        </div>
      )}
    </div>
  );
};

FileUpload.propTypes = {
  projectId: PropTypes.string,
  taskId: PropTypes.string,
  onUploadSuccess: PropTypes.func,
  onUploadError: PropTypes.func,
  maxFileSize: PropTypes.number,
  acceptedFileTypes: PropTypes.arrayOf(PropTypes.string),
  multiple: PropTypes.bool,
  dragAndDrop: PropTypes.bool,
  showPreview: PropTypes.bool
};

export default FileUpload;