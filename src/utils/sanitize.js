// Input sanitization utilities
export const sanitize = {
  // Remove HTML tags and scripts
  html: (input) => {
    if (typeof input !== 'string') return input;
    return input
      .replace(/<script[^>]*>.*?</script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim();
  },
  
  // Sanitize for display in HTML
  display: (input) => {
    if (typeof input !== 'string') return input;
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };
    return input.replace(/[&<>"'/]/g, (m) => map[m]);
  },
  
  // Sanitize phone numbers
  phone: (input) => {
    if (typeof input !== 'string') return input;
    return input.replace(/[^0-9+-s()]/g, '');
  },
  
  // Sanitize email
  email: (input) => {
    if (typeof input !== 'string') return input;
    return input.toLowerCase().trim();
  },
  
  // Sanitize numeric input
  number: (input) => {
    const num = parseFloat(input);
    return isNaN(num) ? 0 : num;
  },
  
  // Sanitize object (remove null/undefined)
  object: (obj) => {
    const cleaned = {};
    Object.keys(obj).forEach(key => {
      if (obj[key] !== null && obj[key] !== undefined) {
        cleaned[key] = obj[key];
      }
    });
    return cleaned;
  }
};

export default sanitize;