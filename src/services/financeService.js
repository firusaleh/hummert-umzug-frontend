import api from './api';
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';

class FinanceService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Cache management
  getCacheKey(endpoint, params) {
    return `${endpoint}:${JSON.stringify(params)}`;
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
  }

  // API calls with error handling
  async fetchWithCache(endpoint, params = {}) {
    const cacheKey = this.getCacheKey(endpoint, params);
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await api.get(endpoint, { params });
      const data = response.data.data || response.data;
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      // Server responded with error
      const message = error.response.data?.message || error.response.data?.error || 'Ein Fehler ist aufgetreten';
      return new Error(message);
    } else if (error.request) {
      // Request made but no response
      return new Error('Keine Verbindung zum Server. Bitte überprüfen Sie Ihre Internetverbindung.');
    } else {
      // Other errors
      return new Error('Ein unerwarteter Fehler ist aufgetreten.');
    }
  }

  // Overview and summary data
  async getFinancialOverview(dateRange = null) {
    const params = {};
    if (dateRange) {
      params.startDate = dateRange.start.toISOString();
      params.endDate = dateRange.end.toISOString();
    }
    
    return this.fetchWithCache('/finanzen/uebersicht', params);
  }

  async getFinancialSummary(year = new Date().getFullYear()) {
    try {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      
      const [overview, invoices, quotes, expenses] = await Promise.all([
        this.getFinancialOverview({ start: startDate, end: endDate }),
        this.getInvoices({ startDate, endDate }),
        this.getQuotes({ startDate, endDate }),
        this.getExpenses({ startDate, endDate })
      ]);

      // Calculate additional metrics
      const paidInvoices = invoices.filter(inv => inv.status === 'bezahlt');
      const totalRevenue = paidInvoices.reduce((sum, inv) => sum + (inv.gesamtbetrag || 0), 0);
      const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.betrag || 0), 0);
      const profit = totalRevenue - totalExpenses;
      
      const openInvoices = invoices.filter(inv => 
        inv.status !== 'bezahlt' && inv.status !== 'storniert'
      );
      const overdueInvoices = openInvoices.filter(inv => {
        const dueDate = parseISO(inv.faelligkeitsdatum);
        return dueDate < new Date();
      });

      const acceptedQuotes = quotes.filter(q => q.status === 'angenommen');
      const quoteAcceptanceRate = quotes.length > 0 
        ? (acceptedQuotes.length / quotes.length * 100)
        : 0;

      return {
        overview,
        metrics: {
          totalRevenue,
          totalExpenses,
          profit,
          profitMargin: totalRevenue > 0 ? (profit / totalRevenue * 100) : 0,
          openInvoicesCount: openInvoices.length,
          openInvoicesAmount: openInvoices.reduce((sum, inv) => sum + (inv.gesamtbetrag || 0), 0),
          overdueInvoicesCount: overdueInvoices.length,
          overdueInvoicesAmount: overdueInvoices.reduce((sum, inv) => sum + (inv.gesamtbetrag || 0), 0),
          quoteAcceptanceRate,
          avgInvoiceValue: paidInvoices.length > 0 ? totalRevenue / paidInvoices.length : 0,
          avgExpenseValue: expenses.length > 0 ? totalExpenses / expenses.length : 0
        }
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Invoice management
  async getInvoices(params = {}) {
    return this.fetchWithCache('/finanzen/rechnungen', params);
  }

  async getInvoice(id) {
    return this.fetchWithCache(`/finanzen/rechnungen/${id}`);
  }

  async createInvoice(data) {
    try {
      this.clearCache(); // Clear cache on create
      const response = await api.post('/finanzen/rechnungen', data);
      return response.data.data || response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateInvoice(id, data) {
    try {
      this.clearCache(); // Clear cache on update
      const response = await api.put(`/finanzen/rechnungen/${id}`, data);
      return response.data.data || response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteInvoice(id) {
    try {
      this.clearCache(); // Clear cache on delete
      await api.delete(`/finanzen/rechnungen/${id}`);
      return true;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateInvoiceStatus(id, status) {
    return this.updateInvoice(id, { status });
  }

  async markInvoiceAsPaid(id, paymentDate = new Date()) {
    return this.updateInvoice(id, { 
      status: 'bezahlt',
      bezahltAm: paymentDate.toISOString()
    });
  }

  // Quote management
  async getQuotes(params = {}) {
    return this.fetchWithCache('/finanzen/angebote', params);
  }

  async getQuote(id) {
    return this.fetchWithCache(`/finanzen/angebote/${id}`);
  }

  async createQuote(data) {
    try {
      this.clearCache();
      const response = await api.post('/finanzen/angebote', data);
      return response.data.data || response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateQuote(id, data) {
    try {
      this.clearCache();
      const response = await api.put(`/finanzen/angebote/${id}`, data);
      return response.data.data || response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteQuote(id) {
    try {
      this.clearCache();
      await api.delete(`/finanzen/angebote/${id}`);
      return true;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async convertQuoteToInvoice(quoteId) {
    try {
      this.clearCache();
      const response = await api.post(`/finanzen/angebote/${quoteId}/convert-to-invoice`);
      return response.data.data || response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Expense management
  async getExpenses(params = {}) {
    return this.fetchWithCache('/finanzen/projektkosten', params);
  }

  async getExpense(id) {
    return this.fetchWithCache(`/finanzen/projektkosten/${id}`);
  }

  async createExpense(data) {
    try {
      this.clearCache();
      const response = await api.post('/finanzen/projektkosten', data);
      return response.data.data || response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateExpense(id, data) {
    try {
      this.clearCache();
      const response = await api.put(`/finanzen/projektkosten/${id}`, data);
      return response.data.data || response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteExpense(id) {
    try {
      this.clearCache();
      await api.delete(`/finanzen/projektkosten/${id}`);
      return true;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Analytics and reporting
  async getMonthlyAnalytics(months = 12) {
    try {
      const endDate = endOfMonth(new Date());
      const startDate = startOfMonth(subMonths(endDate, months - 1));
      
      const [invoices, expenses] = await Promise.all([
        this.getInvoices({ startDate, endDate }),
        this.getExpenses({ startDate, endDate })
      ]);

      // Generate monthly data
      const monthlyData = [];
      for (let i = months - 1; i >= 0; i--) {
        const monthDate = subMonths(endDate, i);
        const monthKey = format(monthDate, 'yyyy-MM');
        const monthName = format(monthDate, 'MMM yyyy');
        
        // Calculate revenue (paid invoices)
        const monthRevenue = invoices
          .filter(inv => {
            if (!inv.bezahltAm || inv.status !== 'bezahlt') return false;
            return format(parseISO(inv.bezahltAm), 'yyyy-MM') === monthKey;
          })
          .reduce((sum, inv) => sum + (inv.gesamtbetrag || 0), 0);
        
        // Calculate expenses
        const monthExpenses = expenses
          .filter(exp => format(parseISO(exp.datum), 'yyyy-MM') === monthKey)
          .reduce((sum, exp) => sum + (exp.betrag || 0), 0);
        
        // Count invoices created
        const invoicesCreated = invoices
          .filter(inv => format(parseISO(inv.rechnungsdatum), 'yyyy-MM') === monthKey)
          .length;
        
        monthlyData.push({
          month: monthName,
          monthKey,
          revenue: monthRevenue,
          expenses: monthExpenses,
          profit: monthRevenue - monthExpenses,
          invoicesCreated,
          profitMargin: monthRevenue > 0 ? ((monthRevenue - monthExpenses) / monthRevenue * 100) : 0
        });
      }
      
      return monthlyData;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getCategoryBreakdown(dateRange = null) {
    try {
      const expenses = await this.getExpenses(dateRange ? {
        startDate: dateRange.start,
        endDate: dateRange.end
      } : {});
      
      const categories = {};
      expenses.forEach(expense => {
        const category = expense.kategorie || 'Sonstige';
        categories[category] = (categories[category] || 0) + (expense.betrag || 0);
      });
      
      return Object.entries(categories)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getCustomerAnalytics(customerId, year = new Date().getFullYear()) {
    try {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      
      const [invoices, quotes] = await Promise.all([
        this.getInvoices({ 
          startDate, 
          endDate,
          kundeId: customerId 
        }),
        this.getQuotes({ 
          startDate, 
          endDate,
          kundeId: customerId 
        })
      ]);
      
      const totalRevenue = invoices
        .filter(inv => inv.status === 'bezahlt')
        .reduce((sum, inv) => sum + (inv.gesamtbetrag || 0), 0);
      
      const openAmount = invoices
        .filter(inv => inv.status !== 'bezahlt' && inv.status !== 'storniert')
        .reduce((sum, inv) => sum + (inv.gesamtbetrag || 0), 0);
      
      const quoteConversionRate = quotes.length > 0
        ? (quotes.filter(q => q.status === 'angenommen').length / quotes.length * 100)
        : 0;
      
      return {
        totalRevenue,
        openAmount,
        invoiceCount: invoices.length,
        quoteCount: quotes.length,
        quoteConversionRate,
        avgInvoiceValue: invoices.length > 0 ? totalRevenue / invoices.length : 0
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Export functionality
  async exportData(type, format = 'csv', dateRange = null) {
    try {
      const params = {
        format,
        ...(dateRange && {
          startDate: dateRange.start.toISOString(),
          endDate: dateRange.end.toISOString()
        })
      };
      
      const response = await api.get(`/finanzen/export/${type}`, {
        params,
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_${format(new Date(), 'yyyy-MM-dd')}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Bulk operations
  async bulkUpdateInvoiceStatus(invoiceIds, status) {
    try {
      this.clearCache();
      const response = await api.put('/finanzen/rechnungen/bulk-status', {
        invoiceIds,
        status
      });
      return response.data.data || response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async bulkDeleteInvoices(invoiceIds) {
    try {
      this.clearCache();
      const response = await api.delete('/finanzen/rechnungen/bulk', {
        data: { invoiceIds }
      });
      return response.data.data || response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Search functionality
  async searchFinancialDocuments(query, type = 'all') {
    try {
      const params = { q: query, type };
      const response = await api.get('/finanzen/search', { params });
      return response.data.data || response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

export default new FinanceService();