// src/components/__tests__/Modal.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Modal from '../Modal.fixed';

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    title: 'Test Modal',
    children: <div>Test Content</div>
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Ensure body overflow is reset
    document.body.style.overflow = '';
  });

  it('renders when isOpen is true', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<Modal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<Modal {...defaultProps} />);
    const closeButton = screen.getByLabelText('Schließen');
    fireEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked', () => {
    render(<Modal {...defaultProps} />);
    const overlay = screen.getByRole('dialog').parentElement;
    fireEvent.click(overlay);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when overlay click is disabled', () => {
    render(<Modal {...defaultProps} closeOnOverlayClick={false} />);
    const overlay = screen.getByRole('dialog').parentElement;
    fireEvent.click(overlay);
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Escape key is pressed', () => {
    render(<Modal {...defaultProps} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when Escape handling is disabled', () => {
    render(<Modal {...defaultProps} closeOnEscape={false} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('prevents body scrolling when open', () => {
    render(<Modal {...defaultProps} />);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body scrolling when closed', () => {
    const { rerender } = render(<Modal {...defaultProps} />);
    expect(document.body.style.overflow).toBe('hidden');
    
    rerender(<Modal {...defaultProps} isOpen={false} />);
    expect(document.body.style.overflow).toBe('');
  });

  it('applies correct size classes', () => {
    const { rerender } = render(<Modal {...defaultProps} size="sm" />);
    expect(screen.getByRole('dialog')).toHaveClass('max-w-md');

    rerender(<Modal {...defaultProps} size="lg" />);
    expect(screen.getByRole('dialog')).toHaveClass('max-w-4xl');
  });

  it('renders footer when provided', () => {
    const footer = <div>Footer Content</div>;
    render(<Modal {...defaultProps} footer={footer} />);
    expect(screen.getByText('Footer Content')).toBeInTheDocument();
  });

  it('hides close button when showCloseButton is false', () => {
    render(<Modal {...defaultProps} showCloseButton={false} />);
    expect(screen.queryByLabelText('Schließen')).not.toBeInTheDocument();
  });

  it('applies custom class names', () => {
    render(
      <Modal
        {...defaultProps}
        className="custom-modal"
        titleClassName="custom-title"
        contentClassName="custom-content"
        footerClassName="custom-footer"
        footer={<div>Footer</div>}
      />
    );
    
    expect(screen.getByRole('dialog')).toHaveClass('custom-modal');
    expect(screen.getByText('Test Modal')).toHaveClass('custom-title');
  });

  it('manages focus correctly', async () => {
    const button = document.createElement('button');
    document.body.appendChild(button);
    button.focus();
    
    const { rerender } = render(<Modal {...defaultProps} />);
    
    // Modal should be focused when opened
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toHaveFocus();
    });
    
    // Previous focus should be restored when closed
    rerender(<Modal {...defaultProps} isOpen={false} />);
    await waitFor(() => {
      expect(button).toHaveFocus();
    });
    
    document.body.removeChild(button);
  });

  it('stops event propagation on modal content click', () => {
    const onOverlayClick = jest.fn();
    render(
      <div onClick={onOverlayClick}>
        <Modal {...defaultProps} />
      </div>
    );
    
    const modalContent = screen.getByRole('dialog');
    fireEvent.click(modalContent);
    expect(onOverlayClick).not.toHaveBeenCalled();
  });
});