// Secure configuration service
const config = {
  api: {
    baseURL: process.env.REACT_APP_API_URL || '/api',
    timeout: 30000,
  },
  
  auth: {
    tokenKey: 'auth_token',
    userKey: 'auth_user',
    tokenExpiry: 24 * 60 * 60 * 1000, // 24 hours
  },
  
  features: {
    enableLogging: process.env.NODE_ENV === 'development',
    enableDevTools: process.env.NODE_ENV === 'development',
  },
  
  // Safely log without exposing sensitive data
  safeLog: (message, data = {}) => {
    if (!config.features.enableLogging) return;
    
    const sanitized = { ...data };
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization'];
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    });
    
    console.log(message, sanitized);
  }
};

export default config;