#!/usr/bin/env node

/**
 * Fahrzeuge Module Integration Test
 * Tests all functionality of the Fahrzeuge module including:
 * - List view with filters and search
 * - Form creation with validation
 * - Details view with all data
 * - Kilometerstand updates
 * - API integration
 * - Field mapping verification
 */

const axios = require('axios');
const colors = require('colors/safe');

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const TEST_TOKEN = process.env.TEST_TOKEN || 'your-test-token';

// Test data
const testFahrzeug = {
  kennzeichen: 'B-TEST 123',
  bezeichnung: 'Test Transporter',
  typ: 'Transporter',
  kapazitaet: {
    ladeflaeche: {
      laenge: 400,
      breite: 200,
      hoehe: 250
    },
    ladegewicht: 1500
  },
  baujahr: 2020,
  anschaffungsdatum: new Date('2020-06-15'),
  tuev: new Date('2025-12-31'),
  fuehrerscheinklasse: 'B',
  status: 'Verfügbar',
  kilometerstand: 50000,
  naechsterService: new Date('2025-06-15'),
  versicherung: {
    gesellschaft: 'Test Versicherung AG',
    vertragsnummer: 'TEST123456',
    ablaufdatum: new Date('2025-12-31')
  },
  notizen: 'Test Fahrzeug für Integration Tests'
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
    const response = await api.get('/fahrzeuge');
    logTest('GET /fahrzeuge returns data', response.status === 200);
    logTest('Response has data array', Array.isArray(response.data.data || response.data));
    
    // Test with filters
    const typeResponse = await api.get('/fahrzeuge?typ=Transporter');
    logTest('GET /fahrzeuge with type filter', typeResponse.status === 200);
    
    const statusResponse = await api.get('/fahrzeuge?status=Verfügbar');
    logTest('GET /fahrzeuge with status filter', statusResponse.status === 200);
    
    // Test with search
    const searchResponse = await api.get('/fahrzeuge?search=Test');
    logTest('GET /fahrzeuge with search', searchResponse.status === 200);
    
    // Test pagination
    const paginatedResponse = await api.get('/fahrzeuge?page=1&limit=5');
    logTest('GET /fahrzeuge with pagination', paginatedResponse.status === 200);
    
  } catch (error) {
    logTest('List endpoint tests', false, error.message);
  }
}

async function testCreateEndpoint() {
  logSection('Testing Create Endpoint');
  
  try {
    const response = await api.post('/fahrzeuge', testFahrzeug);
    logTest('POST /fahrzeuge creates new Fahrzeug', response.status === 201 || response.status === 200);
    logTest('Response has _id', response.data._id !== undefined);
    
    // Verify field mapping
    const created = response.data;
    logTest('Field mapping: kennzeichen', created.kennzeichen === testFahrzeug.kennzeichen);
    logTest('Field mapping: typ', created.typ === testFahrzeug.typ);
    logTest('Field mapping: kapazitaet structure', created.kapazitaet !== undefined);
    logTest('Field mapping: kilometer', created.kilometerstand === testFahrzeug.kilometerstand);
    
    // Verify virtual fields
    if (created.kapazitaet?.volumen !== undefined) {
      const expectedVolume = (400 * 200 * 250) / 1000000; // 20 m³
      logTest('Virtual field: volumen calculated', Math.abs(created.kapazitaet.volumen - expectedVolume) < 0.01);
    }
    
    if (created.alter !== undefined) {
      const expectedAge = new Date().getFullYear() - 2020;
      logTest('Virtual field: alter calculated', created.alter === expectedAge);
    }
    
    return created._id;
  } catch (error) {
    logTest('Create endpoint test', false, error.response?.data?.message || error.message);
    return null;
  }
}

async function testGetByIdEndpoint(fahrzeugId) {
  logSection('Testing Get By ID Endpoint');
  
  if (!fahrzeugId) {
    logTest('GET /fahrzeuge/:id', false, 'No ID available from create test');
    return;
  }
  
  try {
    const response = await api.get(`/fahrzeuge/${fahrzeugId}`);
    logTest('GET /fahrzeuge/:id returns data', response.status === 200);
    
    const fahrzeug = response.data.data || response.data;
    logTest('Response has correct ID', fahrzeug._id === fahrzeugId);
    
    // Verify all fields are present
    logTest('Has kennzeichen', fahrzeug.kennzeichen !== undefined);
    logTest('Has bezeichnung', fahrzeug.bezeichnung !== undefined);
    logTest('Has typ', fahrzeug.typ !== undefined);
    logTest('Has status', fahrzeug.status !== undefined);
    logTest('Has kapazitaet data', fahrzeug.kapazitaet !== undefined);
    logTest('Has virtual vollname', fahrzeug.vollname !== undefined);
    logTest('Has TÜV status', fahrzeug.tuevStatus !== undefined);
    
  } catch (error) {
    logTest('Get by ID endpoint test', false, error.message);
  }
}

async function testUpdateEndpoint(fahrzeugId) {
  logSection('Testing Update Endpoint');
  
  if (!fahrzeugId) {
    logTest('PUT /fahrzeuge/:id', false, 'No ID available from create test');
    return;
  }
  
  try {
    // Update status
    const statusUpdate = await api.put(`/fahrzeuge/${fahrzeugId}`, { status: 'In Wartung' });
    logTest('PUT /fahrzeuge/:id updates status', statusUpdate.status === 200);
    logTest('Status updated correctly', statusUpdate.data.status === 'In Wartung');
    
    // Update kilometerstand
    const kmUpdate = await api.put(`/fahrzeuge/${fahrzeugId}`, { kilometerstand: 55000 });
    logTest('Can update kilometerstand', kmUpdate.status === 200);
    logTest('Kilometerstand updated', kmUpdate.data.kilometerstand === 55000);
    
    // Update TÜV date
    const tuevUpdate = await api.put(`/fahrzeuge/${fahrzeugId}`, {
      tuev: new Date('2026-06-30')
    });
    logTest('Can update TÜV date', tuevUpdate.status === 200);
    
  } catch (error) {
    logTest('Update endpoint test', false, error.message);
  }
}

async function testKilometerstandEndpoint(fahrzeugId) {
  logSection('Testing Kilometerstand Update Endpoint');
  
  if (!fahrzeugId) {
    logTest('Kilometerstand endpoint', false, 'No ID available');
    return;
  }
  
  try {
    // Get current kilometerstand
    const getResponse = await api.get(`/fahrzeuge/${fahrzeugId}`);
    const currentKm = getResponse.data.kilometerstand || 0;
    
    // Update kilometerstand
    const newKm = currentKm + 1000;
    const updateResponse = await api.post(`/fahrzeuge/${fahrzeugId}/kilometerstand`, {
      kilometerstand: newKm
    });
    
    logTest('POST /fahrzeuge/:id/kilometerstand', updateResponse.status === 200);
    
    // Verify update
    const verifyResponse = await api.get(`/fahrzeuge/${fahrzeugId}`);
    logTest('Kilometerstand updated correctly', verifyResponse.data.kilometerstand === newKm);
    
  } catch (error) {
    logTest('Kilometerstand endpoint test', false, error.message);
  }
}

async function testFieldValidation() {
  logSection('Testing Field Validation');
  
  try {
    // Test missing required fields
    const invalidFahrzeug = {
      typ: 'Transporter'
    };
    
    try {
      await api.post('/fahrzeuge', invalidFahrzeug);
      logTest('Validation: rejects missing kennzeichen', false);
    } catch (error) {
      logTest('Validation: rejects missing kennzeichen', error.response?.status === 400);
    }
    
    // Test invalid kennzeichen format
    const invalidKennzeichen = {
      ...testFahrzeug,
      kennzeichen: '123456' // Invalid format
    };
    
    try {
      await api.post('/fahrzeuge', invalidKennzeichen);
      logTest('Validation: validates kennzeichen format', false);
    } catch (error) {
      logTest('Validation: validates kennzeichen format', true);
    }
    
    // Test invalid typ enum
    const invalidTyp = {
      ...testFahrzeug,
      kennzeichen: 'B-TEST 456',
      typ: 'InvalidType'
    };
    
    try {
      await api.post('/fahrzeuge', invalidTyp);
      logTest('Validation: validates typ enum', false);
    } catch (error) {
      logTest('Validation: validates typ enum', true);
    }
    
    // Test invalid fuehrerscheinklasse enum
    const invalidLicense = {
      ...testFahrzeug,
      kennzeichen: 'B-TEST 789',
      fuehrerscheinklasse: 'Z' // Invalid
    };
    
    try {
      await api.post('/fahrzeuge', invalidLicense);
      logTest('Validation: validates fuehrerscheinklasse enum', false);
    } catch (error) {
      logTest('Validation: validates fuehrerscheinklasse enum', true);
    }
    
  } catch (error) {
    logTest('Field validation tests', false, error.message);
  }
}

async function testDeleteEndpoint(fahrzeugId) {
  logSection('Testing Delete Endpoint');
  
  if (!fahrzeugId) {
    logTest('DELETE /fahrzeuge/:id', false, 'No ID available from create test');
    return;
  }
  
  try {
    const response = await api.delete(`/fahrzeuge/${fahrzeugId}`);
    logTest('DELETE /fahrzeuge/:id', response.status === 200 || response.status === 204);
    
    // Verify deletion
    try {
      await api.get(`/fahrzeuge/${fahrzeugId}`);
      logTest('Fahrzeug is deleted', false);
    } catch (error) {
      logTest('Fahrzeug is deleted', error.response?.status === 404);
    }
    
  } catch (error) {
    logTest('Delete endpoint test', false, error.message);
  }
}

// Main test runner
async function runTests() {
  console.log(colors.cyan('\n🧪 Fahrzeuge Module Integration Tests\n'));
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Using token: ${TEST_TOKEN ? 'Yes' : 'No'}\n`);
  
  try {
    // Run tests in sequence
    await testListEndpoint();
    
    const createdId = await testCreateEndpoint();
    
    await testGetByIdEndpoint(createdId);
    
    await testUpdateEndpoint(createdId);
    
    await testKilometerstandEndpoint(createdId);
    
    await testFieldValidation();
    
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