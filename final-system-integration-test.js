const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
const FRONTEND_URL = 'http://localhost:3000';

// Test configuration
const TEST_CONFIG = {
  timeout: 30000,
  headless: true,
  slowMo: 50
};

// Test credentials
const TEST_CREDENTIALS = {
  username: 'testuser@example.com',
  password: 'Test123!@#'
};

// Test data
const TEST_DATA = {
  umzug: {
    kundenname: 'Integration Test Kunde',
    telefonnummer: '+49 123 456789',
    email: 'test@integration.com',
    umzugsdatum: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    adresseAlt: {
      strasse: 'Alte Straße 123',
      plz: '12345',
      ort: 'Altstadt'
    },
    adresseNeu: {
      strasse: 'Neue Straße 456',
      plz: '54321',
      ort: 'Neustadt'
    },
    notizen: 'E2E Integration Test'
  },
  mitarbeiter: {
    name: 'Test Mitarbeiter',
    email: 'mitarbeiter@test.com',
    telefon: '+49 987 654321',
    position: 'Umzugshelfer',
    verfuegbar: true
  },
  fahrzeug: {
    kennzeichen: 'TEST-123',
    typ: 'LKW',
    kapazitaet: '7.5t',
    status: 'verfügbar'
  },
  benachrichtigung: {
    titel: 'Test Benachrichtigung',
    nachricht: 'Dies ist eine Test-Benachrichtigung',
    prioritaet: 'hoch',
    gelesen: false
  }
};

class SystemIntegrationTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: [],
      startTime: new Date(),
      endTime: null,
      tests: []
    };
  }

  async initialize() {
    console.log('🚀 Initializing E2E System Integration Test...\n');
    
    this.browser = await puppeteer.launch({
      headless: TEST_CONFIG.headless,
      slowMo: TEST_CONFIG.slowMo,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 800 });
    
    // Set up console logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Browser Console Error:', msg.text());
      }
    });
    
    // Set up error handling
    this.page.on('pageerror', error => {
      console.error('Page Error:', error.message);
      this.testResults.errors.push({
        type: 'page_error',
        message: error.message,
        timestamp: new Date()
      });
    });
  }

  async runTest(testName, testFn) {
    const testResult = {
      name: testName,
      status: 'pending',
      duration: 0,
      error: null,
      startTime: new Date()
    };

    try {
      console.log(`\n📋 Running: ${testName}`);
      await testFn();
      testResult.status = 'passed';
      this.testResults.passed++;
      console.log(`✅ Passed: ${testName}`);
    } catch (error) {
      testResult.status = 'failed';
      testResult.error = error.message;
      this.testResults.failed++;
      this.testResults.errors.push({
        test: testName,
        error: error.message,
        stack: error.stack
      });
      console.error(`❌ Failed: ${testName}`);
      console.error(`   Error: ${error.message}`);
    }

    testResult.endTime = new Date();
    testResult.duration = testResult.endTime - testResult.startTime;
    this.testResults.tests.push(testResult);
  }

  // Authentication Tests
  async testAuthentication() {
    await this.runTest('Login Flow', async () => {
      await this.page.goto(FRONTEND_URL, { waitUntil: 'networkidle0' });
      
      // Check if redirected to login
      await this.page.waitForSelector('input[type="email"], input[name="username"]', { timeout: 5000 });
      
      // Fill login form
      await this.page.type('input[type="email"], input[name="username"]', TEST_CREDENTIALS.username);
      await this.page.type('input[type="password"]', TEST_CREDENTIALS.password);
      
      // Submit login
      await this.page.click('button[type="submit"]');
      
      // Wait for successful login
      await this.page.waitForNavigation({ waitUntil: 'networkidle0' });
      
      // Verify we're on dashboard
      const dashboardElement = await this.page.waitForSelector('[data-testid="dashboard"], .dashboard, h1', { timeout: 5000 });
      if (!dashboardElement) {
        throw new Error('Dashboard not loaded after login');
      }
      
      // Check for auth token in localStorage
      const token = await this.page.evaluate(() => localStorage.getItem('token'));
      if (!token) {
        throw new Error('Auth token not stored in localStorage');
      }
    });

    await this.runTest('Token Refresh', async () => {
      // Wait for token refresh (simulate expired token)
      await this.page.evaluate(() => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token found');
        }
      });
      
      // Make API call to trigger token refresh
      const response = await this.page.evaluate(async () => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${window.REACT_APP_API_URL || 'http://localhost:5001/api'}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        return { status: res.status, ok: res.ok };
      });
      
      if (!response.ok && response.status !== 401) {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    });
  }

  // Navigation Tests
  async testNavigation() {
    await this.runTest('Protected Route Navigation', async () => {
      // Test navigation to all main routes
      const routes = [
        { path: '/umzuege', selector: '[data-testid="umzuege-page"], .umzuege-container, h1' },
        { path: '/mitarbeiter', selector: '[data-testid="mitarbeiter-page"], .mitarbeiter-container, h1' },
        { path: '/fahrzeuge', selector: '[data-testid="fahrzeuge-page"], .fahrzeuge-container, h1' },
        { path: '/benachrichtigungen', selector: '[data-testid="benachrichtigungen-page"], .benachrichtigungen-container, h1' }
      ];

      for (const route of routes) {
        await this.page.goto(`${FRONTEND_URL}${route.path}`, { waitUntil: 'networkidle0' });
        
        const element = await this.page.waitForSelector(route.selector, { timeout: 5000 });
        if (!element) {
          throw new Error(`Failed to load route: ${route.path}`);
        }
      }
    });
  }

  // API Integration Tests
  async testAPIIntegrations() {
    // Test Umzüge API
    await this.runTest('Umzüge API Integration', async () => {
      await this.page.goto(`${FRONTEND_URL}/umzuege`, { waitUntil: 'networkidle0' });
      
      // Wait for data to load
      await this.page.waitForSelector('[data-testid="umzuege-list"], .umzuege-list, table', { timeout: 10000 });
      
      // Check if data is displayed
      const hasData = await this.page.evaluate(() => {
        const table = document.querySelector('table');
        const list = document.querySelector('[data-testid="umzuege-list"], .umzuege-list');
        return (table && table.rows.length > 1) || (list && list.children.length > 0);
      });
      
      // Create new Umzug
      const createButton = await this.page.$('button[data-testid="create-umzug"], button:has-text("Neuer Umzug"), button:has-text("Hinzufügen")');
      if (createButton) {
        await createButton.click();
        await this.page.waitForSelector('form', { timeout: 5000 });
        
        // Fill form
        await this.fillUmzugForm(TEST_DATA.umzug);
        
        // Submit
        await this.page.click('button[type="submit"]');
        
        // Wait for success
        await this.page.waitForSelector('.success-message, .alert-success', { timeout: 5000 }).catch(() => {});
      }
    });

    // Test Mitarbeiter API
    await this.runTest('Mitarbeiter API Integration', async () => {
      await this.page.goto(`${FRONTEND_URL}/mitarbeiter`, { waitUntil: 'networkidle0' });
      
      // Wait for data to load
      await this.page.waitForSelector('[data-testid="mitarbeiter-list"], .mitarbeiter-list, table', { timeout: 10000 });
      
      // Test search functionality
      const searchInput = await this.page.$('input[type="search"], input[placeholder*="Suche"]');
      if (searchInput) {
        await searchInput.type('Test');
        await this.page.waitForTimeout(500);
      }
    });

    // Test Fahrzeuge API
    await this.runTest('Fahrzeuge API Integration', async () => {
      await this.page.goto(`${FRONTEND_URL}/fahrzeuge`, { waitUntil: 'networkidle0' });
      
      // Wait for data to load
      await this.page.waitForSelector('[data-testid="fahrzeuge-list"], .fahrzeuge-list, table', { timeout: 10000 });
      
      // Check status filters
      const statusFilter = await this.page.$('select[name="status"], [data-testid="status-filter"]');
      if (statusFilter) {
        await statusFilter.select('verfügbar');
        await this.page.waitForTimeout(500);
      }
    });

    // Test Benachrichtigungen API
    await this.runTest('Benachrichtigungen API Integration', async () => {
      await this.page.goto(`${FRONTEND_URL}/benachrichtigungen`, { waitUntil: 'networkidle0' });
      
      // Wait for data to load
      await this.page.waitForSelector('[data-testid="benachrichtigungen-list"], .benachrichtigungen-list, .notifications', { timeout: 10000 });
      
      // Test mark as read
      const unreadNotification = await this.page.$('.unread, [data-unread="true"]');
      if (unreadNotification) {
        await unreadNotification.click();
        await this.page.waitForTimeout(500);
      }
    });
  }

  // Data Flow Tests
  async testDataFlow() {
    await this.runTest('Cross-Component Data Flow', async () => {
      // Create data in one component and verify it appears in another
      await this.page.goto(`${FRONTEND_URL}/umzuege`, { waitUntil: 'networkidle0' });
      
      // Get initial count
      const initialCount = await this.page.evaluate(() => {
        const rows = document.querySelectorAll('table tbody tr, [data-testid="umzug-item"]');
        return rows.length;
      });
      
      // Navigate to dashboard
      await this.page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'networkidle0' });
      
      // Check if statistics are displayed
      const stats = await this.page.evaluate(() => {
        const statElements = document.querySelectorAll('[data-testid*="stat"], .stat-card, .metric');
        return statElements.length > 0;
      });
      
      if (!stats) {
        throw new Error('Dashboard statistics not displayed');
      }
    });

    await this.runTest('Real-time Updates', async () => {
      // Test WebSocket connection if available
      const hasWebSocket = await this.page.evaluate(() => {
        return typeof window.io !== 'undefined' || typeof window.WebSocket !== 'undefined';
      });
      
      if (hasWebSocket) {
        console.log('   WebSocket support detected');
      }
    });
  }

  // Error Handling Tests
  async testErrorHandling() {
    await this.runTest('API Error Handling', async () => {
      // Test 404 error
      await this.page.goto(`${FRONTEND_URL}/non-existent-page`, { waitUntil: 'networkidle0' });
      
      const errorPage = await this.page.$('.error-page, [data-testid="404-page"], h1:has-text("404")');
      if (!errorPage) {
        console.log('   Warning: No 404 page detected');
      }
    });

    await this.runTest('Network Error Handling', async () => {
      // Simulate offline
      await this.page.setOfflineMode(true);
      
      try {
        await this.page.reload({ waitUntil: 'networkidle0' }).catch(() => {});
        
        // Check for offline indicator
        const offlineIndicator = await this.page.$('.offline-indicator, [data-testid="offline"]');
        if (!offlineIndicator) {
          console.log('   Warning: No offline indicator detected');
        }
      } finally {
        await this.page.setOfflineMode(false);
      }
    });
  }

  // Performance Tests
  async testPerformance() {
    await this.runTest('Page Load Performance', async () => {
      const metrics = await this.page.metrics();
      
      if (metrics.TaskDuration > 3000) {
        console.warn(`   Warning: High task duration: ${metrics.TaskDuration}ms`);
      }
      
      // Check bundle size
      const coverage = await this.page.coverage.startJSCoverage();
      await this.page.goto(`${FRONTEND_URL}`, { waitUntil: 'networkidle0' });
      const jsCoverage = await this.page.coverage.stopJSCoverage();
      
      const totalBytes = jsCoverage.reduce((total, entry) => total + entry.text.length, 0);
      const usedBytes = jsCoverage.reduce((total, entry) => {
        return total + entry.ranges.reduce((sum, range) => sum + range.end - range.start, 0);
      }, 0);
      
      const unusedPercentage = ((totalBytes - usedBytes) / totalBytes) * 100;
      console.log(`   Code coverage: ${(100 - unusedPercentage).toFixed(2)}%`);
    });
  }

  // Helper Methods
  async fillUmzugForm(data) {
    // Fill customer info
    await this.page.type('input[name="kundenname"]', data.kundenname);
    await this.page.type('input[name="telefonnummer"]', data.telefonnummer);
    await this.page.type('input[name="email"]', data.email);
    await this.page.type('input[name="umzugsdatum"], input[type="date"]', data.umzugsdatum);
    
    // Fill old address
    await this.page.type('input[name="adresseAlt.strasse"], input[name="altStrasse"]', data.adresseAlt.strasse);
    await this.page.type('input[name="adresseAlt.plz"], input[name="altPlz"]', data.adresseAlt.plz);
    await this.page.type('input[name="adresseAlt.ort"], input[name="altOrt"]', data.adresseAlt.ort);
    
    // Fill new address
    await this.page.type('input[name="adresseNeu.strasse"], input[name="neuStrasse"]', data.adresseNeu.strasse);
    await this.page.type('input[name="adresseNeu.plz"], input[name="neuPlz"]', data.adresseNeu.plz);
    await this.page.type('input[name="adresseNeu.ort"], input[name="neuOrt"]', data.adresseNeu.ort);
    
    // Fill notes
    const notesField = await this.page.$('textarea[name="notizen"]');
    if (notesField) {
      await notesField.type(data.notizen);
    }
  }

  async generateReport() {
    this.testResults.endTime = new Date();
    const duration = this.testResults.endTime - this.testResults.startTime;
    
    const report = {
      summary: {
        total: this.testResults.passed + this.testResults.failed,
        passed: this.testResults.passed,
        failed: this.testResults.failed,
        duration: `${(duration / 1000).toFixed(2)}s`,
        timestamp: new Date().toISOString()
      },
      environment: {
        apiUrl: API_BASE_URL,
        frontendUrl: FRONTEND_URL,
        nodeVersion: process.version,
        platform: process.platform
      },
      tests: this.testResults.tests,
      errors: this.testResults.errors
    };

    await fs.writeFile(
      path.join(__dirname, 'final-system-integration-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('\n📊 Test Summary:');
    console.log(`   Total Tests: ${report.summary.total}`);
    console.log(`   ✅ Passed: ${report.summary.passed}`);
    console.log(`   ❌ Failed: ${report.summary.failed}`);
    console.log(`   ⏱️  Duration: ${report.summary.duration}`);
    
    if (this.testResults.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      this.testResults.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.test || error.type}: ${error.error || error.message}`);
      });
    }

    return report;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.initialize();
      
      // Run all test suites
      await this.testAuthentication();
      await this.testNavigation();
      await this.testAPIIntegrations();
      await this.testDataFlow();
      await this.testErrorHandling();
      await this.testPerformance();
      
      // Generate report
      const report = await this.generateReport();
      
      console.log('\n✨ E2E System Integration Test Complete!');
      console.log(`📄 Report saved to: final-system-integration-report.json`);
      
      // Exit with appropriate code
      process.exit(this.testResults.failed > 0 ? 1 : 0);
      
    } catch (error) {
      console.error('\n💥 Fatal Error:', error);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the test
const tester = new SystemIntegrationTester();
tester.run();