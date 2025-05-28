// Mitarbeiter Service - Real API Integration
import api from './api';

class MitarbeiterService {
  constructor() {
    this.endpoint = '/mitarbeiter';
  }

  // Get all employees with pagination and filters
  async getAll(params = {}) {
    try {
      const response = await api.get(this.endpoint, { params });
      return {
        success: true,
        data: response.data.data || response.data.mitarbeiter || [],
        pagination: response.data.pagination || {
          total: response.data.total || 0,
          pages: response.data.pages || 1,
          currentPage: params.page || 1,
          limit: params.limit || 20
        }
      };
    } catch (error) {
      console.error('Error fetching Mitarbeiter:', error);
      throw error;
    }
  }

  // Get single employee by ID
  async getById(id) {
    try {
      const response = await api.get(`${this.endpoint}/${id}`);
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error('Error fetching Mitarbeiter:', error);
      throw error;
    }
  }

  // Create new employee
  async create(mitarbeiterData) {
    try {
      const response = await api.post(this.endpoint, mitarbeiterData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'Mitarbeiter erfolgreich erstellt'
      };
    } catch (error) {
      console.error('Error creating Mitarbeiter:', error);
      throw error;
    }
  }

  // Update employee
  async update(id, updates) {
    try {
      const response = await api.put(`${this.endpoint}/${id}`, updates);
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'Mitarbeiter erfolgreich aktualisiert'
      };
    } catch (error) {
      console.error('Error updating Mitarbeiter:', error);
      throw error;
    }
  }

  // Delete employee
  async delete(id) {
    try {
      const response = await api.delete(`${this.endpoint}/${id}`);
      return {
        success: true,
        message: response.data.message || 'Mitarbeiter erfolgreich gelöscht'
      };
    } catch (error) {
      console.error('Error deleting Mitarbeiter:', error);
      throw error;
    }
  }

  // Add working hours
  async addArbeitszeit(id, arbeitszeitData) {
    try {
      const response = await api.post(`${this.endpoint}/${id}/arbeitszeiten`, arbeitszeitData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Arbeitszeit erfolgreich hinzugefügt'
      };
    } catch (error) {
      console.error('Error adding Arbeitszeit:', error);
      throw error;
    }
  }

  // Get working hours
  async getArbeitszeiten(id, params = {}) {
    try {
      const response = await api.get(`${this.endpoint}/${id}/arbeitszeiten`, { params });
      return {
        success: true,
        data: response.data.data || response.data.arbeitszeiten || [],
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('Error fetching Arbeitszeiten:', error);
      throw error;
    }
  }

  // Update working hours
  async updateArbeitszeit(id, arbeitszeitId, updates) {
    try {
      const response = await api.put(`${this.endpoint}/${id}/arbeitszeiten/${arbeitszeitId}`, updates);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Arbeitszeit erfolgreich aktualisiert'
      };
    } catch (error) {
      console.error('Error updating Arbeitszeit:', error);
      throw error;
    }
  }

  // Delete working hours
  async deleteArbeitszeit(id, arbeitszeitId) {
    try {
      const response = await api.delete(`${this.endpoint}/${id}/arbeitszeiten/${arbeitszeitId}`);
      return {
        success: true,
        message: 'Arbeitszeit erfolgreich gelöscht'
      };
    } catch (error) {
      console.error('Error deleting Arbeitszeit:', error);
      throw error;
    }
  }

  // Add qualification
  async addQualifikation(id, qualifikationData) {
    try {
      const response = await api.post(`${this.endpoint}/${id}/qualifikationen`, qualifikationData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Qualifikation erfolgreich hinzugefügt'
      };
    } catch (error) {
      console.error('Error adding Qualifikation:', error);
      throw error;
    }
  }

  // Delete qualification
  async deleteQualifikation(id, qualifikationId) {
    try {
      const response = await api.delete(`${this.endpoint}/${id}/qualifikationen/${qualifikationId}`);
      return {
        success: true,
        message: 'Qualifikation erfolgreich entfernt'
      };
    } catch (error) {
      console.error('Error deleting Qualifikation:', error);
      throw error;
    }
  }

  // Upload document
  async uploadDokument(id, file) {
    try {
      const formData = new FormData();
      formData.append('dokument', file);
      
      const response = await api.post(`${this.endpoint}/${id}/dokumente`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Dokument erfolgreich hochgeladen'
      };
    } catch (error) {
      console.error('Error uploading Dokument:', error);
      throw error;
    }
  }

  // Get monthly report
  async getMonatsbericht(id, year, month) {
    try {
      const response = await api.get(`${this.endpoint}/${id}/monatsbericht`, {
        params: { year, month }
      });
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error('Error fetching Monatsbericht:', error);
      throw error;
    }
  }

  // Get available employees for a date
  async getVerfuegbare(datum) {
    try {
      const response = await api.get(`${this.endpoint}/verfuegbar`, {
        params: { datum }
      });
      return {
        success: true,
        data: response.data.data || response.data.mitarbeiter || []
      };
    } catch (error) {
      console.error('Error fetching verfügbare Mitarbeiter:', error);
      throw error;
    }
  }

  // Search employees
  async search(query) {
    try {
      const response = await api.get(`${this.endpoint}/search`, {
        params: { q: query }
      });
      return {
        success: true,
        data: response.data.data || response.data.results || []
      };
    } catch (error) {
      console.error('Error searching Mitarbeiter:', error);
      throw error;
    }
  }

  // Get employee statistics
  async getStatistics(id) {
    try {
      const response = await api.get(`${this.endpoint}/${id}/statistik`);
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  }
}

// Create singleton instance
const mitarbeiterService = new MitarbeiterService();

export default mitarbeiterService;