#!/usr/bin/env node

/**
 * Umzüge Module Integration Test
 * Tests all functionality of the Umzüge module including:
 * - List view with pagination and filters
 * - Form creation with field validation
 * - Details view with real data
 * - API integration
 * - Field mapping verification
 */

const axios = require('axios');
const colors = require('colors/safe');

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const TEST_TOKEN = process.env.TEST_TOKEN || 'your-test-token';

// Test data
const testUmzug = {
  kundennummer: 'K-TEST-001',
  auftraggeber: {
    name: 'Test Kunde',
    telefon: '0123456789',
    email: 'test@example.com',
    isKunde: true
  },
  kontakte: [{
    name: 'Test Kunde',
    telefon: '0123456789',
    email: 'test@example.com',
    isKunde: true
  }],
  auszugsadresse: {
    strasse: 'Teststraße',
    hausnummer: '123',
    plz: '12345',
    ort: 'Berlin',
    land: 'Deutschland',
    etage: 3,
    aufzug: true,
    entfernung: 50
  },
  einzugsadresse: {
    strasse: 'Zielstraße',
    hausnummer: '456',
    plz: '54321',
    ort: 'München',
    land: 'Deutschland',
    etage: 2,
    aufzug: false,
    entfernung: 100
  },
  startDatum: new Date('2025-06-01T08:00:00'),
  endDatum: new Date('2025-06-01T16:00:00'),
  status: 'geplant',
  mitarbeiter: [],
  fahrzeuge: [],
  extraLeistungen: [
    {
      beschreibung: 'Verpackungsmaterial',
      preis: 50,
      menge: 10
    },
    {
      beschreibung: 'Möbelmontage',
      preis: 80,
      menge: 2
    }
  ],
  preis: {
    netto: 1000,
    brutto: 1190,
    mwst: 19,
    bezahlt: false,
    zahlungsart: 'rechnung'
  }
};

// Configure axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Test results
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// Helper functions
function logTest(testName, passed, error = null) {
  if (passed) {
    console.log(colors.green(`✓ ${testName}`));
    testResults.passed++;
  } else {
    console.log(colors.red(`✗ ${testName}`));
    if (error) {
      console.log(colors.red(`  Error: ${error}`));
      testResults.errors.push({ test: testName, error });
    }
    testResults.failed++;
  }
}

function logSection(sectionName) {
  console.log('\n' + colors.blue(`=== ${sectionName} ===`));
}

// Tests
async function testListEndpoint() {
  logSection('Testing List Endpoint');
  
  try {
    // Test basic list
    const response = await api.get('/umzuege');
    logTest('GET /umzuege returns data', response.status === 200);
    logTest('Response has data array', Array.isArray(response.data.data));
    logTest('Response has pagination', response.data.pagination !== undefined);
    
    // Test with filters
    const filteredResponse = await api.get('/umzuege?status=geplant');
    logTest('GET /umzuege with status filter', filteredResponse.status === 200);
    
    // Test with search
    const searchResponse = await api.get('/umzuege?search=Test');
    logTest('GET /umzuege with search', searchResponse.status === 200);
    
    // Test pagination
    const paginatedResponse = await api.get('/umzuege?page=1&limit=5');
    logTest('GET /umzuege with pagination', paginatedResponse.status === 200);
    logTest('Pagination limit works', paginatedResponse.data.data.length <= 5);
    
  } catch (error) {
    logTest('List endpoint tests', false, error.message);
  }
}

async function testCreateEndpoint() {
  logSection('Testing Create Endpoint');
  
  try {
    const response = await api.post('/umzuege', testUmzug);
    logTest('POST /umzuege creates new Umzug', response.status === 201 || response.status === 200);
    logTest('Response has _id', response.data._id !== undefined);
    
    // Verify field mapping
    const created = response.data;
    logTest('Field mapping: auftraggeber', created.auftraggeber?.name === testUmzug.auftraggeber.name);
    logTest('Field mapping: auszugsadresse', created.auszugsadresse?.strasse === testUmzug.auszugsadresse.strasse);
    logTest('Field mapping: einzugsadresse', created.einzugsadresse?.strasse === testUmzug.einzugsadresse.strasse);
    logTest('Field mapping: extraLeistungen', Array.isArray(created.extraLeistungen));
    
    return created._id;
  } catch (error) {
    logTest('Create endpoint test', false, error.response?.data?.message || error.message);
    return null;
  }
}

async function testGetByIdEndpoint(umzugId) {
  logSection('Testing Get By ID Endpoint');
  
  if (!umzugId) {
    logTest('GET /umzuege/:id', false, 'No ID available from create test');
    return;
  }
  
  try {
    const response = await api.get(`/umzuege/${umzugId}`);
    logTest('GET /umzuege/:id returns data', response.status === 200);
    logTest('Response has correct ID', response.data._id === umzugId);
    
    // Verify all fields are present
    const umzug = response.data;
    logTest('Has auftraggeber data', umzug.auftraggeber !== undefined);
    logTest('Has auszugsadresse data', umzug.auszugsadresse !== undefined);
    logTest('Has einzugsadresse data', umzug.einzugsadresse !== undefined);
    logTest('Has dates', umzug.startDatum !== undefined && umzug.endDatum !== undefined);
    logTest('Has status', umzug.status !== undefined);
    logTest('Has preis data', umzug.preis !== undefined);
    
  } catch (error) {
    logTest('Get by ID endpoint test', false, error.message);
  }
}

async function testUpdateEndpoint(umzugId) {
  logSection('Testing Update Endpoint');
  
  if (!umzugId) {
    logTest('PUT /umzuege/:id', false, 'No ID available from create test');
    return;
  }
  
  try {
    // Update status
    const statusUpdate = await api.put(`/umzuege/${umzugId}`, { status: 'bestaetigt' });
    logTest('PUT /umzuege/:id updates status', statusUpdate.status === 200);
    logTest('Status updated correctly', statusUpdate.data.status === 'bestaetigt');
    
    // Add note
    const noteUpdate = await api.put(`/umzuege/${umzugId}`, {
      notizen: [{
        text: 'Test note',
        datum: new Date(),
        ersteller: 'Test User'
      }]
    });
    logTest('Can add notes', noteUpdate.status === 200);
    
  } catch (error) {
    logTest('Update endpoint test', false, error.message);
  }
}

async function testFieldValidation() {
  logSection('Testing Field Validation');
  
  try {
    // Test missing required fields
    const invalidUmzug = {};
    try {
      await api.post('/umzuege', invalidUmzug);
      logTest('Validation: rejects empty data', false);
    } catch (error) {
      logTest('Validation: rejects empty data', error.response?.status === 400);
    }
    
    // Test invalid date
    const invalidDateUmzug = {
      ...testUmzug,
      startDatum: new Date('2025-06-02'),
      endDatum: new Date('2025-06-01')
    };
    try {
      await api.post('/umzuege', invalidDateUmzug);
      logTest('Validation: rejects invalid date range', false);
    } catch (error) {
      logTest('Validation: rejects invalid date range', error.response?.status === 400);
    }
    
    // Test invalid PLZ
    const invalidPLZUmzug = {
      ...testUmzug,
      auszugsadresse: {
        ...testUmzug.auszugsadresse,
        plz: '123' // Should be 5 digits
      }
    };
    try {
      await api.post('/umzuege', invalidPLZUmzug);
      logTest('Validation: validates PLZ format', false);
    } catch (error) {
      logTest('Validation: validates PLZ format', true);
    }
    
  } catch (error) {
    logTest('Field validation tests', false, error.message);
  }
}

async function testDeleteEndpoint(umzugId) {
  logSection('Testing Delete Endpoint');
  
  if (!umzugId) {
    logTest('DELETE /umzuege/:id', false, 'No ID available from create test');
    return;
  }
  
  try {
    const response = await api.delete(`/umzuege/${umzugId}`);
    logTest('DELETE /umzuege/:id', response.status === 200 || response.status === 204);
    
    // Verify deletion
    try {
      await api.get(`/umzuege/${umzugId}`);
      logTest('Umzug is deleted', false);
    } catch (error) {
      logTest('Umzug is deleted', error.response?.status === 404);
    }
    
  } catch (error) {
    logTest('Delete endpoint test', false, error.message);
  }
}

async function testFrontendFieldMapping() {
  logSection('Testing Frontend Field Mapping');
  
  // This simulates what the frontend does
  const frontendData = {
    kundennummer: 'K-TEST-002',
    auftraggeber: {
      name: 'Frontend Test',
      telefon: '0987654321',
      email: 'frontend@test.de'
    },
    auszugsadresse: {
      strasse: 'Frontend Str',
      hausnummer: '1',
      plz: '10115',
      ort: 'Berlin'
    },
    einzugsadresse: {
      strasse: 'Frontend Ziel',
      hausnummer: '2',
      plz: '80333',
      ort: 'München'
    },
    startDatum: '2025-07-01T09:00:00',
    endDatum: '2025-07-01T17:00:00',
    extraLeistungen: [
      { beschreibung: 'Test Service', preis: 100, menge: 1 }
    ]
  };
  
  try {
    const response = await api.post('/umzuege', frontendData);
    logTest('Frontend data structure accepted', response.status === 201 || response.status === 200);
    
    const created = response.data;
    logTest('Frontend mapping: auftraggeber saved correctly', 
      created.auftraggeber?.name === frontendData.auftraggeber.name);
    logTest('Frontend mapping: addresses saved correctly', 
      created.auszugsadresse?.strasse === frontendData.auszugsadresse.strasse);
    logTest('Frontend mapping: extraLeistungen saved correctly', 
      created.extraLeistungen?.length === 1);
    
    // Clean up
    if (created._id) {
      await api.delete(`/umzuege/${created._id}`);
    }
    
  } catch (error) {
    logTest('Frontend field mapping test', false, error.response?.data?.message || error.message);
  }
}

// Main test runner
async function runTests() {
  console.log(colors.cyan('\n🧪 Umzüge Module Integration Tests\n'));
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Using token: ${TEST_TOKEN ? 'Yes' : 'No'}\n`);
  
  try {
    // Run tests in sequence
    await testListEndpoint();
    
    const createdId = await testCreateEndpoint();
    
    await testGetByIdEndpoint(createdId);
    
    await testUpdateEndpoint(createdId);
    
    await testFieldValidation();
    
    await testFrontendFieldMapping();
    
    await testDeleteEndpoint(createdId);
    
  } catch (error) {
    console.error(colors.red('\nTest suite error:'), error.message);
  }
  
  // Summary
  console.log(colors.cyan('\n=== Test Summary ==='));
  console.log(colors.green(`Passed: ${testResults.passed}`));
  console.log(colors.red(`Failed: ${testResults.failed}`));
  console.log(`Total: ${testResults.passed + testResults.failed}`);
  
  if (testResults.errors.length > 0) {
    console.log(colors.red('\n=== Errors ==='));
    testResults.errors.forEach(({ test, error }) => {
      console.log(colors.red(`${test}: ${error}`));
    });
  }
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Check if backend is running
async function checkBackend() {
  try {
    await axios.get(`${API_BASE_URL}/health`);
    return true;
  } catch (error) {
    console.error(colors.red('❌ Backend is not running at ' + API_BASE_URL));
    console.log(colors.yellow('Please start the backend with: cd backend && npm run dev'));
    return false;
  }
}

// Run tests
(async () => {
  const backendRunning = await checkBackend();
  if (backendRunning) {
    await runTests();
  } else {
    process.exit(1);
  }
})();