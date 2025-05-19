// src/components/__tests__/FileUpload.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FileUpload from '../files/FileUpload.fixed';
import api from '../../services/api.fixed';

jest.mock('../../services/api.fixed');

describe('FileUpload', () => {
  const defaultProps = {
    projectId: 'project-123',
    taskId: 'task-456',
    onUploadSuccess: jest.fn(),
    onUploadError: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createFile = (name, size, type) => {
    const file = new File(['test'], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  };

  it('renders upload area', () => {
    render(<FileUpload {...defaultProps} />);
    
    expect(screen.getByText('Datei hochladen')).toBeInTheDocument();
    expect(screen.getByText(/Ziehe Dateien hierher/)).toBeInTheDocument();
    expect(screen.getByText(/Maximale Dateigröße:/)).toBeInTheDocument();
  });

  it('accepts valid files', async () => {
    render(<FileUpload {...defaultProps} />);
    
    const file = createFile('test.pdf', 1024, 'application/pdf');
    const input = screen.getByRole('button', { name: /durchsuche/i });
    
    fireEvent.click(input);
    const fileInput = document.querySelector('input[type="file"]');
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      configurable: true
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
      expect(screen.getByText('1 KB')).toBeInTheDocument();
    });
  });

  it('rejects files that are too large', async () => {
    render(<FileUpload {...defaultProps} maxFileSize={1024} />);
    
    const file = createFile('large.pdf', 2048, 'application/pdf');
    const fileInput = document.querySelector('input[type="file"]');
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      configurable: true
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByText(/Datei ist zu groß/)).toBeInTheDocument();
    });
  });

  it('rejects unsupported file types', async () => {
    render(<FileUpload {...defaultProps} acceptedFileTypes={['application/pdf']} />);
    
    const file = createFile('test.exe', 1024, 'application/x-executable');
    const fileInput = document.querySelector('input[type="file"]');
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      configurable: true
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByText(/Dateityp nicht erlaubt/)).toBeInTheDocument();
    });
  });

  it('handles drag and drop', async () => {
    render(<FileUpload {...defaultProps} />);
    
    const dropZone = screen.getByText(/Ziehe Dateien hierher/).closest('div');
    const file = createFile('test.pdf', 1024, 'application/pdf');
    
    fireEvent.dragEnter(dropZone);
    expect(dropZone).toHaveClass('border-blue-500');
    
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] }
    });
    
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
      expect(dropZone).not.toHaveClass('border-blue-500');
    });
  });

  it('uploads files successfully', async () => {
    api.file.upload.mockResolvedValue({
      success: true,
      data: { id: 'file-123', name: 'test.pdf' }
    });
    
    render(<FileUpload {...defaultProps} />);
    
    const file = createFile('test.pdf', 1024, 'application/pdf');
    const fileInput = document.querySelector('input[type="file"]');
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      configurable: true
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Hochladen'));
    
    await waitFor(() => {
      expect(api.file.upload).toHaveBeenCalledWith(
        expect.any(FormData),
        expect.objectContaining({
          onUploadProgress: expect.any(Function)
        })
      );
      expect(defaultProps.onUploadSuccess).toHaveBeenCalledWith([
        { id: 'file-123', name: 'test.pdf' }
      ]);
    });
  });

  it('handles upload errors', async () => {
    api.file.upload.mockRejectedValue(new Error('Upload failed'));
    
    render(<FileUpload {...defaultProps} />);
    
    const file = createFile('test.pdf', 1024, 'application/pdf');
    const fileInput = document.querySelector('input[type="file"]');
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      configurable: true
    });
    
    fireEvent.change(fileInput);
    fireEvent.click(screen.getByText('Hochladen'));
    
    await waitFor(() => {
      expect(defaultProps.onUploadError).toHaveBeenCalled();
      expect(screen.getByText(/konnten nicht hochgeladen werden/)).toBeInTheDocument();
    });
  });

  it('removes files from list', async () => {
    render(<FileUpload {...defaultProps} />);
    
    const file = createFile('test.pdf', 1024, 'application/pdf');
    const fileInput = document.querySelector('input[type="file"]');
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      configurable: true
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });
    
    const removeButton = screen.getByRole('button', { name: /x/i });
    fireEvent.click(removeButton);
    
    await waitFor(() => {
      expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
    });
  });

  it('clears all files', async () => {
    render(<FileUpload {...defaultProps} multiple={true} />);
    
    const file1 = createFile('test1.pdf', 1024, 'application/pdf');
    const file2 = createFile('test2.pdf', 1024, 'application/pdf');
    const fileInput = document.querySelector('input[type="file"]');
    
    Object.defineProperty(fileInput, 'files', {
      value: [file1, file2],
      configurable: true
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByText('test1.pdf')).toBeInTheDocument();
      expect(screen.getByText('test2.pdf')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Alle entfernen'));
    
    await waitFor(() => {
      expect(screen.queryByText('test1.pdf')).not.toBeInTheDocument();
      expect(screen.queryByText('test2.pdf')).not.toBeInTheDocument();
    });
  });

  it('shows upload progress', async () => {
    let progressCallback;
    api.file.upload.mockImplementation((formData, config) => {
      progressCallback = config.onUploadProgress;
      return new Promise(() => {});
    });
    
    render(<FileUpload {...defaultProps} />);
    
    const file = createFile('test.pdf', 1024, 'application/pdf');
    const fileInput = document.querySelector('input[type="file"]');
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      configurable: true
    });
    
    fireEvent.change(fileInput);
    fireEvent.click(screen.getByText('Hochladen'));
    
    await waitFor(() => {
      expect(api.file.upload).toHaveBeenCalled();
    });
    
    // Simulate progress
    progressCallback({ loaded: 512, total: 1024 });
    
    await waitFor(() => {
      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });

  it('handles multiple file selection when enabled', async () => {
    render(<FileUpload {...defaultProps} multiple={true} />);
    
    const file1 = createFile('test1.pdf', 1024, 'application/pdf');
    const file2 = createFile('test2.pdf', 1024, 'application/pdf');
    const fileInput = document.querySelector('input[type="file"]');
    
    expect(fileInput).toHaveAttribute('multiple');
    
    Object.defineProperty(fileInput, 'files', {
      value: [file1, file2],
      configurable: true
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByText('test1.pdf')).toBeInTheDocument();
      expect(screen.getByText('test2.pdf')).toBeInTheDocument();
    });
  });

  it('replaces file when multiple is false', async () => {
    render(<FileUpload {...defaultProps} multiple={false} />);
    
    const file1 = createFile('test1.pdf', 1024, 'application/pdf');
    const fileInput = document.querySelector('input[type="file"]');
    
    Object.defineProperty(fileInput, 'files', {
      value: [file1],
      configurable: true
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByText('test1.pdf')).toBeInTheDocument();
    });
    
    const file2 = createFile('test2.pdf', 1024, 'application/pdf');
    Object.defineProperty(fileInput, 'files', {
      value: [file2],
      configurable: true
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.queryByText('test1.pdf')).not.toBeInTheDocument();
      expect(screen.getByText('test2.pdf')).toBeInTheDocument();
    });
  });
});