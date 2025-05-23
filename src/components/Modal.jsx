// src/components/Modal.fixed.jsx
import React, { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import PropTypes from 'prop-types';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  footer,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = '',
  titleClassName = '',
  contentClassName = '',
  footerClassName = ''
}) => {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Größenklassen für das Modal
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full mx-4'
  };

  // Handle escape key press
  const handleEscape = useCallback((event) => {
    if (closeOnEscape && event.key === 'Escape') {
      onClose();
    }
  }, [closeOnEscape, onClose]);

  // Handle overlay click
  const handleOverlayClick = useCallback((event) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  }, [closeOnOverlayClick, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousFocusRef.current = document.activeElement;
      
      // Focus the modal
      if (modalRef.current) {
        modalRef.current.focus();
      }
      
      // Prevent body scrolling
      document.body.style.overflow = 'hidden';
      
      // Add escape key listener
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    } else {
      // Restore body scrolling
      document.body.style.overflow = '';
      
      // Restore focus to previous element
      if (previousFocusRef.current && previousFocusRef.current.focus) {
        previousFocusRef.current.focus();
      }
    }
  }, [isOpen, handleEscape]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        ref={modalRef}
        tabIndex={-1}
        className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 
            id="modal-title"
            className={`text-xl font-semibold text-gray-800 ${titleClassName}`}
          >
            {title}
          </h2>
          {showCloseButton && (
            <button 
              onClick={onClose} 
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Schließen"
            >
              <X size={20} />
            </button>
          )}
        </div>
        
        {/* Content */}
        <div className={`flex-1 overflow-y-auto p-4 ${contentClassName}`}>
          {children}
        </div>
        
        {/* Footer (optional) */}
        {footer && (
          <div className={`border-t p-4 ${footerClassName}`}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', 'full']),
  footer: PropTypes.node,
  showCloseButton: PropTypes.bool,
  closeOnOverlayClick: PropTypes.bool,
  closeOnEscape: PropTypes.bool,
  className: PropTypes.string,
  titleClassName: PropTypes.string,
  contentClassName: PropTypes.string,
  footerClassName: PropTypes.string
};

export default Modal;