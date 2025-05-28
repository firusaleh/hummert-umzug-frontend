import { vi } from 'vitest';
import financeService from '../financeService';
import api from '../api';

// Mock the API module
vi.mock('../api');

describe('FinanceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear the service cache
    financeService.clearCache();
  });

  describe('Invoice Management', () => {
    test('getInvoices fetches invoices correctly', async () => {
      const mockInvoices = [
        { _id: '1', rechnungNummer: 'RE-2024-001', gesamtbetrag: 1000 },
        { _id: '2', rechnungNummer: 'RE-2024-002', gesamtbetrag: 2000 }
      ];

      api.get.mockResolvedValue({ data: { data: mockInvoices } });

      const result = await financeService.getInvoices();

      expect(api.get).toHaveBeenCalledWith('/finanzen/rechnungen', { params: {} });
      expect(result).toEqual(mockInvoices);
    });

    test('getInvoice fetches single invoice', async () => {
      const mockInvoice = { _id: '1', rechnungNummer: 'RE-2024-001' };
      api.get.mockResolvedValue({ data: { data: mockInvoice } });

      const result = await financeService.getInvoice('1');

      expect(api.get).toHaveBeenCalledWith('/finanzen/rechnungen/1', { params: {} });
      expect(result).toEqual(mockInvoice);
    });

    test('createInvoice posts new invoice and clears cache', async () => {
      const newInvoice = { rechnungNummer: 'RE-2024-003', gesamtbetrag: 3000 };
      const createdInvoice = { _id: '3', ...newInvoice };
      
      api.post.mockResolvedValue({ data: { data: createdInvoice } });

      const result = await financeService.createInvoice(newInvoice);

      expect(api.post).toHaveBeenCalledWith('/finanzen/rechnungen', newInvoice);
      expect(result).toEqual(createdInvoice);
    });

    test('updateInvoice updates existing invoice', async () => {
      const updates = { status: 'Bezahlt' };
      const updatedInvoice = { _id: '1', status: 'Bezahlt' };
      
      api.put.mockResolvedValue({ data: { data: updatedInvoice } });

      const result = await financeService.updateInvoice('1', updates);

      expect(api.put).toHaveBeenCalledWith('/finanzen/rechnungen/1', updates);
      expect(result).toEqual(updatedInvoice);
    });

    test('markInvoiceAsPaid updates invoice status to paid', async () => {
      const paidInvoice = { _id: '1', status: 'Bezahlt' };
      api.put.mockResolvedValue({ data: { data: paidInvoice } });

      const paymentDate = new Date('2024-01-15');
      const result = await financeService.markInvoiceAsPaid('1', paymentDate);

      expect(api.put).toHaveBeenCalledWith('/finanzen/rechnungen/1', {
        status: 'bezahlt',
        bezahltAm: paymentDate.toISOString()
      });
      expect(result).toEqual(paidInvoice);
    });

    test('deleteInvoice removes invoice', async () => {
      api.delete.mockResolvedValue({ data: { success: true } });

      const result = await financeService.deleteInvoice('1');

      expect(api.delete).toHaveBeenCalledWith('/finanzen/rechnungen/1');
      expect(result).toBe(true);
    });
  });

  describe('Quote Management', () => {
    test('getQuotes fetches quotes correctly', async () => {
      const mockQuotes = [
        { _id: '1', angebotNummer: 'ANG-2024-001', status: 'Entwurf' }
      ];

      api.get.mockResolvedValue({ data: { data: mockQuotes } });

      const result = await financeService.getQuotes();

      expect(api.get).toHaveBeenCalledWith('/finanzen/angebote', { params: {} });
      expect(result).toEqual(mockQuotes);
    });

    test('convertQuoteToInvoice converts quote to invoice', async () => {
      const newInvoice = { _id: 'inv1', rechnungNummer: 'RE-2024-001' };
      api.post.mockResolvedValue({ data: { data: newInvoice } });

      const result = await financeService.convertQuoteToInvoice('quote1');

      expect(api.post).toHaveBeenCalledWith('/finanzen/angebote/quote1/convert-to-invoice');
      expect(result).toEqual(newInvoice);
    });
  });

  describe('Expense Management', () => {
    test('getExpenses fetches project costs', async () => {
      const mockExpenses = [
        { _id: '1', kategorie: 'Personal', betrag: 500 },
        { _id: '2', kategorie: 'Material', betrag: 300 }
      ];

      api.get.mockResolvedValue({ data: { data: mockExpenses } });

      const result = await financeService.getExpenses();

      expect(api.get).toHaveBeenCalledWith('/finanzen/projektkosten', { params: {} });
      expect(result).toEqual(mockExpenses);
    });

    test('createExpense adds new expense', async () => {
      const newExpense = { kategorie: 'Fahrzeuge', betrag: 200 };
      const createdExpense = { _id: '3', ...newExpense };
      
      api.post.mockResolvedValue({ data: { data: createdExpense } });

      const result = await financeService.createExpense(newExpense);

      expect(api.post).toHaveBeenCalledWith('/finanzen/projektkosten', newExpense);
      expect(result).toEqual(createdExpense);
    });
  });

  describe('Analytics and Reporting', () => {
    test('getFinancialSummary calculates summary correctly', async () => {
      const mockInvoices = [
        { _id: '1', status: 'bezahlt', gesamtbetrag: 1000 },
        { _id: '2', status: 'offen', gesamtbetrag: 500, faelligkeitsdatum: '2024-12-31' }
      ];
      const mockQuotes = [
        { _id: '1', status: 'angenommen' },
        { _id: '2', status: 'abgelehnt' }
      ];
      const mockExpenses = [
        { _id: '1', betrag: 300 },
        { _id: '2', betrag: 200 }
      ];

      // Mock all required API calls
      api.get
        .mockResolvedValueOnce({ data: {} }) // overview
        .mockResolvedValueOnce({ data: { data: mockInvoices } }) // invoices
        .mockResolvedValueOnce({ data: { data: mockQuotes } }) // quotes
        .mockResolvedValueOnce({ data: { data: mockExpenses } }); // expenses

      const result = await financeService.getFinancialSummary(2024);

      expect(result.metrics).toMatchObject({
        totalRevenue: 1000,
        totalExpenses: 500,
        profit: 500,
        profitMargin: 50,
        openInvoicesCount: 1,
        openInvoicesAmount: 500,
        quoteAcceptanceRate: 50
      });
    });

    test('getMonthlyAnalytics generates monthly data', async () => {
      const mockInvoices = [
        { 
          _id: '1', 
          status: 'bezahlt', 
          gesamtbetrag: 1000,
          bezahltAm: '2024-01-15T00:00:00.000Z',
          rechnungsdatum: '2024-01-10T00:00:00.000Z'
        }
      ];
      const mockExpenses = [
        { 
          _id: '1', 
          betrag: 300,
          datum: '2024-01-20T00:00:00.000Z'
        }
      ];

      api.get
        .mockResolvedValueOnce({ data: { data: mockInvoices } })
        .mockResolvedValueOnce({ data: { data: mockExpenses } });

      const result = await financeService.getMonthlyAnalytics(3);

      expect(result).toHaveLength(3);
      expect(result[result.length - 1]).toMatchObject({
        revenue: 1000,
        expenses: 300,
        profit: 700,
        invoicesCreated: 1
      });
    });

    test('getCategoryBreakdown groups expenses by category', async () => {
      const mockExpenses = [
        { kategorie: 'Personal', betrag: 500 },
        { kategorie: 'Personal', betrag: 300 },
        { kategorie: 'Material', betrag: 200 },
        { kategorie: 'Fahrzeuge', betrag: 400 }
      ];

      api.get.mockResolvedValue({ data: { data: mockExpenses } });

      const result = await financeService.getCategoryBreakdown();

      expect(result).toEqual([
        { name: 'Personal', value: 800 },
        { name: 'Fahrzeuge', value: 400 },
        { name: 'Material', value: 200 }
      ]);
    });
  });

  describe('Caching', () => {
    test('uses cache for repeated requests', async () => {
      const mockData = [{ _id: '1', test: 'data' }];
      api.get.mockResolvedValue({ data: { data: mockData } });

      // First call - should hit API
      const result1 = await financeService.getInvoices();
      expect(api.get).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result2 = await financeService.getInvoices();
      expect(api.get).toHaveBeenCalledTimes(1); // Still only called once

      expect(result1).toEqual(result2);
    });

    test('clears cache on data modification', async () => {
      const mockData = [{ _id: '1', test: 'data' }];
      api.get.mockResolvedValue({ data: { data: mockData } });
      api.post.mockResolvedValue({ data: { success: true } });

      // Load data into cache
      await financeService.getInvoices();
      expect(api.get).toHaveBeenCalledTimes(1);

      // Create new invoice - should clear cache
      await financeService.createInvoice({});

      // Next get should hit API again
      await financeService.getInvoices();
      expect(api.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    test('handles API errors with response', async () => {
      const errorResponse = {
        response: {
          data: { message: 'Custom error message' }
        }
      };
      api.get.mockRejectedValue(errorResponse);

      await expect(financeService.getInvoices()).rejects.toThrow('Custom error message');
    });

    test('handles network errors', async () => {
      const networkError = {
        request: {}
      };
      api.get.mockRejectedValue(networkError);

      await expect(financeService.getInvoices()).rejects.toThrow(
        'Keine Verbindung zum Server. Bitte überprüfen Sie Ihre Internetverbindung.'
      );
    });

    test('handles unexpected errors', async () => {
      api.get.mockRejectedValue(new Error('Unknown error'));

      await expect(financeService.getInvoices()).rejects.toThrow(
        'Ein unerwarteter Fehler ist aufgetreten.'
      );
    });
  });

  describe('Bulk Operations', () => {
    test('bulkUpdateInvoiceStatus updates multiple invoices', async () => {
      const invoiceIds = ['1', '2', '3'];
      const status = 'Bezahlt';
      const updatedInvoices = invoiceIds.map(id => ({ _id: id, status }));
      
      api.put.mockResolvedValue({ data: { data: updatedInvoices } });

      const result = await financeService.bulkUpdateInvoiceStatus(invoiceIds, status);

      expect(api.put).toHaveBeenCalledWith('/finanzen/rechnungen/bulk-status', {
        invoiceIds,
        status
      });
      expect(result).toEqual(updatedInvoices);
    });

    test('bulkDeleteInvoices removes multiple invoices', async () => {
      const invoiceIds = ['1', '2', '3'];
      api.delete.mockResolvedValue({ data: { data: { deleted: 3 } } });

      const result = await financeService.bulkDeleteInvoices(invoiceIds);

      expect(api.delete).toHaveBeenCalledWith('/finanzen/rechnungen/bulk', {
        data: { invoiceIds }
      });
      expect(result).toEqual({ deleted: 3 });
    });
  });

  describe('Search Functionality', () => {
    test('searchFinancialDocuments searches all document types', async () => {
      const searchResults = {
        invoices: [{ _id: '1', type: 'invoice' }],
        quotes: [{ _id: '2', type: 'quote' }],
        expenses: [{ _id: '3', type: 'expense' }]
      };
      
      api.get.mockResolvedValue({ data: { data: searchResults } });

      const result = await financeService.searchFinancialDocuments('test query');

      expect(api.get).toHaveBeenCalledWith('/finanzen/search', {
        params: { q: 'test query', type: 'all' }
      });
      expect(result).toEqual(searchResults);
    });
  });
});