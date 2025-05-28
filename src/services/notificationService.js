// Enhanced Notification Service with full API integration
import api from './api';

class NotificationService {
  constructor() {
    this.endpoint = '/benachrichtigungen';
  }

  // Error handler
  handleResponse(promise) {
    return promise
      .then(response => ({ success: true, data: response.data }))
      .catch(error => {
        console.error('NotificationService error:', error);
        throw error;
      });
  }

  // Get all notifications
  async getAll(params = {}) {
    const defaultParams = {
      page: 1,
      limit: 50,
      sort: '-createdAt'
    };
    
    return this.handleResponse(
      api.get(this.endpoint, { 
        params: { ...defaultParams, ...params } 
      })
    );
  }

  // Get single notification
  async getById(id) {
    return this.handleResponse(
      api.get(`${this.endpoint}/${id}`)
    );
  }

  // Get unread count
  async getUnreadCount() {
    return this.handleResponse(
      api.get(`${this.endpoint}/ungelesen`)
    );
  }

  // Mark as read/unread
  async markAsRead(id, gelesen = true) {
    return this.handleResponse(
      api.put(`${this.endpoint}/${id}/gelesen`, { gelesen })
    );
  }

  // Mark all as read
  async markAllAsRead() {
    return this.handleResponse(
      api.put(`${this.endpoint}/alle-gelesen`)
    );
  }

  // Delete notification
  async delete(id) {
    return this.handleResponse(
      api.delete(`${this.endpoint}/${id}`)
    );
  }

  // Delete all read notifications
  async deleteAllRead() {
    return this.handleResponse(
      api.delete(`${this.endpoint}/alle-gelesen`)
    );
  }

  // Get notification preferences/settings
  async getPreferences() {
    return this.handleResponse(
      api.get(`${this.endpoint}/einstellungen`)
    );
  }

  // Update notification preferences/settings
  async updatePreferences(preferences) {
    return this.handleResponse(
      api.put(`${this.endpoint}/einstellungen`, preferences)
    );
  }

  // Push notification methods
  async subscribeToPush(subscription) {
    return this.handleResponse(
      api.post(`${this.endpoint}/push/subscribe`, { subscription })
    );
  }

  async unsubscribeFromPush() {
    return this.handleResponse(
      api.post(`${this.endpoint}/push/unsubscribe`)
    );
  }

  // Send test notification
  async sendTestNotification() {
    return this.handleResponse(
      api.post(`${this.endpoint}/test`)
    );
  }

  // Get notification statistics
  async getStatistics() {
    return this.handleResponse(
      api.get(`${this.endpoint}/statistik`)
    );
  }

  // Admin methods
  async createNotification(data) {
    return this.handleResponse(
      api.post(this.endpoint, data)
    );
  }

  async createMassNotification(data) {
    return this.handleResponse(
      api.post(`${this.endpoint}/masse`, data)
    );
  }

  async createTaskReminders() {
    return this.handleResponse(
      api.post(`${this.endpoint}/task-erinnerungen`)
    );
  }

  async sendEmailNotification(data) {
    return this.handleResponse(
      api.post(`${this.endpoint}/email`, data)
    );
  }

  // Real-time notification subscription
  subscribeToRealtimeUpdates(callback) {
    // This would be implemented with WebSocket/Socket.io
    // For now, return a dummy unsubscribe function
    console.log('Real-time notifications would be implemented here');
    return () => {
      console.log('Unsubscribing from real-time notifications');
    };
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;