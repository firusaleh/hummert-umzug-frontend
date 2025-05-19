// src/components/__tests__/Pagination.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Pagination from '../common/Pagination.fixed';

describe('Pagination', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 10,
    totalCount: 100,
    limit: 10,
    onPageChange: jest.fn(),
    onLimitChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders pagination info correctly', () => {
    render(<Pagination {...defaultProps} />);
    expect(screen.getByText(/Zeige 1 bis 10 von 100 Einträgen/)).toBeInTheDocument();
  });

  it('renders correct page numbers with ellipsis', () => {
    render(<Pagination {...defaultProps} currentPage={5} />);
    
    // Should show: 1 ... 3 4 5 6 7 ... 10
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getAllByText('...')).toHaveLength(2);
  });

  it('disables previous buttons on first page', () => {
    render(<Pagination {...defaultProps} currentPage={1} />);
    
    expect(screen.getByLabelText('Erste Seite')).toBeDisabled();
    expect(screen.getByLabelText('Vorherige Seite')).toBeDisabled();
    expect(screen.getByLabelText('Nächste Seite')).not.toBeDisabled();
    expect(screen.getByLabelText('Letzte Seite')).not.toBeDisabled();
  });

  it('disables next buttons on last page', () => {
    render(<Pagination {...defaultProps} currentPage={10} />);
    
    expect(screen.getByLabelText('Erste Seite')).not.toBeDisabled();
    expect(screen.getByLabelText('Vorherige Seite')).not.toBeDisabled();
    expect(screen.getByLabelText('Nächste Seite')).toBeDisabled();
    expect(screen.getByLabelText('Letzte Seite')).toBeDisabled();
  });

  it('calls onPageChange when page button is clicked', () => {
    render(<Pagination {...defaultProps} />);
    
    fireEvent.click(screen.getByLabelText('Gehe zu Seite 3'));
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(3);
  });

  it('calls onPageChange when navigation buttons are clicked', () => {
    render(<Pagination {...defaultProps} currentPage={5} />);
    
    fireEvent.click(screen.getByLabelText('Erste Seite'));
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(1);
    
    fireEvent.click(screen.getByLabelText('Vorherige Seite'));
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(4);
    
    fireEvent.click(screen.getByLabelText('Nächste Seite'));
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(6);
    
    fireEvent.click(screen.getByLabelText('Letzte Seite'));
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(10);
  });

  it('calls onLimitChange when page size is changed', () => {
    render(<Pagination {...defaultProps} />);
    
    const select = screen.getByLabelText('Anzeigen:');
    fireEvent.change(select, { target: { value: '20' } });
    
    expect(defaultProps.onLimitChange).toHaveBeenCalledWith(20);
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(1);
  });

  it('does not render when totalCount is 0', () => {
    const { container } = render(<Pagination {...defaultProps} totalCount={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('hides size changer when showSizeChanger is false', () => {
    render(<Pagination {...defaultProps} showSizeChanger={false} />);
    expect(screen.queryByLabelText('Anzeigen:')).not.toBeInTheDocument();
  });

  it('shows quick jumper for more than 10 pages', () => {
    render(<Pagination {...defaultProps} totalPages={15} />);
    expect(screen.getByLabelText('Gehe zu:')).toBeInTheDocument();
  });

  it('hides quick jumper when showQuickJumper is false', () => {
    render(<Pagination {...defaultProps} totalPages={15} showQuickJumper={false} />);
    expect(screen.queryByLabelText('Gehe zu:')).not.toBeInTheDocument();
  });

  it('handles quick jump on Enter key', () => {
    render(<Pagination {...defaultProps} totalPages={15} />);
    
    const input = screen.getByLabelText('Seitenzahl eingeben');
    fireEvent.change(input, { target: { value: '8' } });
    fireEvent.keyPress(input, { key: 'Enter' });
    
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(8);
  });

  it('ignores invalid quick jump values', () => {
    render(<Pagination {...defaultProps} totalPages={15} />);
    
    const input = screen.getByLabelText('Seitenzahl eingeben');
    
    // Too high
    fireEvent.change(input, { target: { value: '20' } });
    fireEvent.keyPress(input, { key: 'Enter' });
    expect(defaultProps.onPageChange).not.toHaveBeenCalled();
    expect(input.value).toBe('1'); // Reset to current page
    
    // Too low
    fireEvent.change(input, { target: { value: '0' } });
    fireEvent.keyPress(input, { key: 'Enter' });
    expect(defaultProps.onPageChange).not.toHaveBeenCalled();
    
    // Non-numeric
    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.keyPress(input, { key: 'Enter' });
    expect(defaultProps.onPageChange).not.toHaveBeenCalled();
  });

  it('disables all controls when disabled prop is true', () => {
    render(<Pagination {...defaultProps} disabled={true} />);
    
    expect(screen.getByLabelText('Erste Seite')).toBeDisabled();
    expect(screen.getByLabelText('Vorherige Seite')).toBeDisabled();
    expect(screen.getByLabelText('Nächste Seite')).toBeDisabled();
    expect(screen.getByLabelText('Letzte Seite')).toBeDisabled();
    expect(screen.getByLabelText('Anzeigen:')).toBeDisabled();
    
    // Page buttons should still be disabled
    const pageButton = screen.getByLabelText('Gehe zu Seite 2');
    fireEvent.click(pageButton);
    expect(defaultProps.onPageChange).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const { container } = render(<Pagination {...defaultProps} className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('uses custom pageSizeOptions', () => {
    const customOptions = [5, 15, 25];
    render(<Pagination {...defaultProps} pageSizeOptions={customOptions} />);
    
    const select = screen.getByLabelText('Anzeigen:');
    const options = select.querySelectorAll('option');
    
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent('5 pro Seite');
    expect(options[1]).toHaveTextContent('15 pro Seite');
    expect(options[2]).toHaveTextContent('25 pro Seite');
  });

  it('marks current page with aria-current', () => {
    render(<Pagination {...defaultProps} currentPage={3} />);
    
    const currentPageButton = screen.getByLabelText('Gehe zu Seite 3');
    expect(currentPageButton).toHaveAttribute('aria-current', 'page');
    
    const otherPageButton = screen.getByLabelText('Gehe zu Seite 2');
    expect(otherPageButton).not.toHaveAttribute('aria-current');
  });
});