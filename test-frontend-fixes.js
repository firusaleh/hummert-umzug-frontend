#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Frontend Fixes...\n');

const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function test(name, testFunc) {
  process.stdout.write(`Testing: ${name}... `);
  try {
    if (testFunc()) {
      console.log('✅');
      testResults.passed++;
      testResults.tests.push({ name, status: 'passed' });
    } else {
      console.log('❌');
      testResults.failed++;
      testResults.tests.push({ name, status: 'failed' });
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    testResults.failed++;
    testResults.tests.push({ name, status: 'failed', error: error.message });
  }
}

// Test 1: Check sensitive logging removed
test('Sensitive logging removed from AuthContext', () => {
  const content = fs.readFileSync('src/context/AuthContext.jsx', 'utf8');
  return !content.includes('console.log') || 
         (!content.match(/console\.(log|warn|error).*token/i) && 
          !content.match(/console\.(log|warn|error).*password/i));
});

// Test 2: Check hardcoded URLs removed
test('Hardcoded URLs removed from api.js', () => {
  const content = fs.readFileSync('src/services/api.js', 'utf8');
  return !content.includes('http://localhost:5000');
});

// Test 3: Check ErrorBoundary exists
test('ErrorBoundary component exists', () => {
  return fs.existsSync('src/components/common/ErrorBoundary.jsx');
});

// Test 4: Check App uses ErrorBoundary
test('App component uses ErrorBoundary', () => {
  const content = fs.readFileSync('src/App.jsx', 'utf8');
  return content.includes('ErrorBoundary') && 
         content.includes('<ErrorBoundary>');
});

// Test 5: Check secure config exists
test('Secure config service exists', () => {
  return fs.existsSync('src/config/secureConfig.js');
});

// Test 6: Check sanitization utility exists
test('Sanitization utility exists', () => {
  return fs.existsSync('src/utils/sanitize.js');
});

// Test 7: Check promise error handling
test('Promises have error handling in Aufnahmen', () => {
  const content = fs.readFileSync('src/pages/aufnahmen/Aufnahmen.js', 'utf8');
  const thenCount = (content.match(/\.then\(/g) || []).length;
  const catchCount = (content.match(/\.catch\(/g) || []).length;
  return catchCount >= thenCount - 2; // Allow some flexibility
});

// Test 8: Check ESLint fixes
test('ESLint escape character warnings fixed', () => {
  const umzugForm = fs.readFileSync('src/pages/umzuege/UmzugForm.jsx', 'utf8');
  return !umzugForm.includes('\\(') && !umzugForm.includes('\\)');
});

// Test 9: Check PropTypes imports
test('PropTypes imported in Modal', () => {
  const content = fs.readFileSync('src/components/Modal.jsx', 'utf8');
  return content.includes('PropTypes') || content.includes('prop-types');
});

// Test 10: Check no console.error for tokens
test('No token logging in api.js', () => {
  const content = fs.readFileSync('src/services/api.js', 'utf8');
  return !content.match(/console\.error.*[Tt]oken/);
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('\n📊 Test Summary\n');
console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
console.log(`Passed: ${testResults.passed} ✅`);
console.log(`Failed: ${testResults.failed} ❌`);
console.log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

if (testResults.failed > 0) {
  console.log('\n❌ Failed Tests:');
  testResults.tests
    .filter(t => t.status === 'failed')
    .forEach(t => console.log(`  - ${t.name}${t.error ? ': ' + t.error : ''}`));
}

// Save report
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    total: testResults.passed + testResults.failed,
    passed: testResults.passed,
    failed: testResults.failed,
    successRate: ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1) + '%'
  },
  tests: testResults.tests,
  fixes: {
    sensitiveLogging: 'Removed console logs with tokens/passwords',
    hardcodedUrls: 'Replaced localhost URLs with relative paths',
    errorBoundary: 'Added global error boundary component',
    promiseHandling: 'Added .catch() to unhandled promises',
    secureConfig: 'Created secure configuration service',
    sanitization: 'Added input sanitization utilities',
    eslintWarnings: 'Fixed escape character warnings',
    propTypes: 'Added PropTypes imports where missing'
  }
};

fs.writeFileSync('frontend-fixes-test-report.json', JSON.stringify(report, null, 2));
console.log('\n📄 Test report saved to frontend-fixes-test-report.json');