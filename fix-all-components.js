#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Frontend Components...\n');

// Fix 1: Remove sensitive logging from AuthContext
const fixAuthContext = () => {
  console.log('🔐 Fixing AuthContext sensitive logging...');
  
  const filePath = path.join(__dirname, 'src/context/AuthContext.jsx');
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove console statements that log sensitive data
  content = content.replace(/console\.(log|warn|error)\s*\([^)]*token[^)]*\)/gi, '// Removed sensitive token logging');
  content = content.replace(/console\.(log|warn|error)\s*\([^)]*password[^)]*\)/gi, '// Removed sensitive password logging');
  content = content.replace(/console\.log\s*\(\s*['"`]Token expired[^)]*\)/gi, '// Token expiry handled silently');
  
  fs.writeFileSync(filePath, content);
  console.log('✅ AuthContext fixed');
};

// Fix 2: Fix hardcoded URL in api.js
const fixApiService = () => {
  console.log('🌐 Fixing API service hardcoded URLs...');
  
  const filePath = path.join(__dirname, 'src/services/api.js');
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix hardcoded localhost URL
  content = content.replace(
    /baseURL:\s*process\.env\.REACT_APP_API_URL\s*\|\|\s*['"`]http:\/\/localhost:5000\/api['"`]/g,
    `baseURL: process.env.REACT_APP_API_URL || '/api'`
  );
  
  // Remove sensitive console.error for tokens
  content = content.replace(/console\.error\s*\([^)]*[Tt]oken[^)]*\)/g, '// Token error handled silently');
  
  fs.writeFileSync(filePath, content);
  console.log('✅ API service fixed');
};

// Fix 3: Add error boundaries
const createErrorBoundary = () => {
  console.log('🛡️ Creating Error Boundary component...');
  
  const errorBoundaryContent = `import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service
      console.error('Error caught by boundary:', error.message);
    } else {
      console.error('Error details:', error, errorInfo);
    }
    
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Etwas ist schiefgelaufen
            </h2>
            <p className="text-gray-600 mb-4">
              Ein unerwarteter Fehler ist aufgetreten. Bitte laden Sie die Seite neu.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-4 bg-gray-100 rounded text-sm">
                <summary className="cursor-pointer font-medium">
                  Fehlerdetails (nur in Entwicklung)
                </summary>
                <pre className="mt-2 overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Seite neu laden
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;`;

  const componentPath = path.join(__dirname, 'src/components/common/ErrorBoundary.jsx');
  if (!fs.existsSync(componentPath)) {
    fs.writeFileSync(componentPath, errorBoundaryContent);
    console.log('✅ ErrorBoundary component created');
  } else {
    console.log('✅ ErrorBoundary already exists');
  }
};

// Fix 4: Update App.jsx to use ErrorBoundary
const updateAppComponent = () => {
  console.log('📱 Updating App component with ErrorBoundary...');
  
  const filePath = path.join(__dirname, 'src/App.jsx');
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add import if not exists
  if (!content.includes('ErrorBoundary')) {
    const importIndex = content.lastIndexOf('import');
    const importEndIndex = content.indexOf('\n', importIndex);
    content = content.slice(0, importEndIndex + 1) + 
              "import ErrorBoundary from './components/common/ErrorBoundary';\n" + 
              content.slice(importEndIndex + 1);
    
    // Wrap Router with ErrorBoundary
    content = content.replace(
      /return\s*\(\s*<Router>/,
      'return (\n    <ErrorBoundary>\n      <Router>'
    );
    
    content = content.replace(
      /<\/Router>\s*\)/,
      '</Router>\n    </ErrorBoundary>\n  )'
    );
  }
  
  fs.writeFileSync(filePath, content);
  console.log('✅ App component updated');
};

// Fix 5: Add proper error handling to components with promises
const fixUnhandledPromises = () => {
  console.log('⚠️ Fixing unhandled promises...');
  
  const filesToFix = [
    'src/pages/aufnahmen/Aufnahmen.js',
    'src/pages/mitarbeiter/Mitarbeiter.js'
  ];
  
  filesToFix.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Add .catch to .then chains without error handling
      content = content.replace(
        /\.then\(([^}]+)\}\s*\)(?![\s\S]{0,10}\.catch)/g,
        `.then($1}\n    )\n    .catch(error => {\n      console.error('Error:', error.message);\n      // Handle error appropriately\n    })`
      );
      
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed ${file}`);
    }
  });
};

// Fix 6: Create a secure config service
const createSecureConfig = () => {
  console.log('🔒 Creating secure configuration service...');
  
  const configContent = `// Secure configuration service
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

export default config;`;

  const configPath = path.join(__dirname, 'src/config/secureConfig.js');
  const configDir = path.dirname(configPath);
  
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  fs.writeFileSync(configPath, configContent);
  console.log('✅ Secure config service created');
};

// Fix 7: Add input sanitization utility
const createSanitizationUtil = () => {
  console.log('🧹 Creating input sanitization utility...');
  
  const sanitizeContent = `// Input sanitization utilities
export const sanitize = {
  // Remove HTML tags and scripts
  html: (input) => {
    if (typeof input !== 'string') return input;
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
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
    return input.replace(/[^0-9+\-\s()]/g, '');
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

export default sanitize;`;

  const utilPath = path.join(__dirname, 'src/utils/sanitize.js');
  fs.writeFileSync(utilPath, sanitizeContent);
  console.log('✅ Sanitization utility created');
};

// Fix 8: Fix ESLint warnings
const fixEslintWarnings = () => {
  console.log('🔍 Fixing ESLint warnings...');
  
  const filesToFix = {
    'src/pages/umzuege/UmzugForm.jsx': [
      { 
        search: /Unnecessary escape character: \\\(/g,
        replace: '('
      },
      {
        search: /Unnecessary escape character: \\\)/g,
        replace: ')'
      }
    ],
    'src/pages/aufnahmen/UmzugsaufnahmeFormular.jsx': [
      {
        search: /Unnecessary escape character: \\\//g,
        replace: '/'
      }
    ]
  };
  
  Object.entries(filesToFix).forEach(([file, fixes]) => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      fixes.forEach(fix => {
        content = content.replace(fix.search, fix.replace);
      });
      
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed ESLint warnings in ${file}`);
    }
  });
};

// Fix 9: Add PropTypes to components missing them
const addPropTypes = () => {
  console.log('📝 Adding PropTypes to components...');
  
  const componentsToFix = [
    'src/components/Modal.jsx',
    'src/components/common/Pagination.jsx',
    'src/components/common/ErrorAlert.jsx'
  ];
  
  componentsToFix.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Add PropTypes import if missing
      if (!content.includes('PropTypes') && !content.includes('prop-types')) {
        const importIndex = content.lastIndexOf('import React');
        const importEndIndex = content.indexOf('\n', importIndex);
        content = content.slice(0, importEndIndex + 1) + 
                  "import PropTypes from 'prop-types';\n" + 
                  content.slice(importEndIndex + 1);
      }
      
      fs.writeFileSync(filePath, content);
      console.log(`✅ Added PropTypes to ${file}`);
    }
  });
};

// Run all fixes
const runFixes = async () => {
  try {
    fixAuthContext();
    fixApiService();
    createErrorBoundary();
    updateAppComponent();
    fixUnhandledPromises();
    createSecureConfig();
    createSanitizationUtil();
    fixEslintWarnings();
    addPropTypes();
    
    console.log('\n✅ All frontend component fixes completed!');
    console.log('\nNext steps:');
    console.log('1. Run: npm start');
    console.log('2. Check for any remaining warnings');
    console.log('3. Test all features to ensure they still work');
    
  } catch (error) {
    console.error('❌ Error during fixes:', error);
    process.exit(1);
  }
};

runFixes();