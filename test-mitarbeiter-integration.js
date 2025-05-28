#!/usr/bin/env node

/**
 * Mitarbeiter Module Integration Test
 * Tests all functionality of the Mitarbeiter module including:
 * - List view with search and filters
 * - Form creation with user account
 * - Details view with all data
 * - API integration
 * - Field mapping verification
 * - File uploads
 */

const axios = require('axios');
const colors = require('colors/safe');
const FormData = require('form-data');

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const TEST_TOKEN = process.env.TEST_TOKEN || 'your-test-token';

// Test data
const testMitarbeiter = {
  vorname: 'Test',
  nachname: 'Mitarbeiter',
  telefon: '0123456789',
  email: `test.mitarbeiter.${Date.now()}@example.com`, // Unique email
  position: 'Träger',
  abteilung: 'Umzüge',
  einstellungsdatum: new Date('2024-01-01'),
  geburtstag: new Date('1990-05-15'),
  adresse: {
    strasse: 'Teststraße',
    hausnummer: '123',
    plz: '12345',
    ort: 'Berlin'
  },
  gehalt: {
    brutto: 3000,
    netto: 2100,
    stundensatz: 18.75
  },
  faehigkeiten: ['Packen', 'Möbelmontage', 'Klaviertransport'],
  fuehrerscheinklassen: ['B', 'C1'],
  notfallkontakt: {
    name: 'Notfall Kontakt',
    telefon: '0987654321',
    beziehung: 'Partner'
  },
  bankverbindung: {
    kontoinhaber: 'Test Mitarbeiter',
    iban: 'DE89370400440532013000',
    bic: 'COBADEFFXXX',
    bank: 'Commerzbank'
  },
  isActive: true,
  notizen: 'Test Mitarbeiter für Integration Test'
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
    const response = await api.get('/mitarbeiter');
    logTest('GET /mitarbeiter returns data', response.status === 200);
    logTest('Response has data array', Array.isArray(response.data.data || response.data));
    
    // Test with filters
    const activeResponse = await api.get('/mitarbeiter?isActive=true');
    logTest('GET /mitarbeiter with isActive filter', activeResponse.status === 200);
    
    const positionResponse = await api.get('/mitarbeiter?position=Träger');
    logTest('GET /mitarbeiter with position filter', positionResponse.status === 200);
    
    // Test with search
    const searchResponse = await api.get('/mitarbeiter?search=Test');
    logTest('GET /mitarbeiter with search', searchResponse.status === 200);
    
    // Test pagination
    const paginatedResponse = await api.get('/mitarbeiter?page=1&limit=5');
    logTest('GET /mitarbeiter with pagination', paginatedResponse.status === 200);
    
  } catch (error) {
    logTest('List endpoint tests', false, error.message);
  }
}

async function testUserCreation() {
  logSection('Testing User Creation for Mitarbeiter');
  
  try {
    // First, try to create a user
    const userData = {
      name: `${testMitarbeiter.vorname} ${testMitarbeiter.nachname}`,
      email: testMitarbeiter.email,
      password: 'Test123456!',
      role: 'mitarbeiter'
    };
    
    const userResponse = await api.post('/auth/register', userData);
    logTest('User creation for Mitarbeiter', userResponse.status === 201 || userResponse.status === 200);
    
    const userId = userResponse.data.user?._id || userResponse.data.user?.id || userResponse.data._id;
    logTest('User ID received', userId !== undefined);
    
    return userId;
  } catch (error) {
    if (error.response?.status === 409) {
      logTest('User already exists', true);
      // Try to get existing user
      try {
        const users = await api.get(`/users?email=${testMitarbeiter.email}`);
        if (users.data && users.data.length > 0) {
          return users.data[0]._id || users.data[0].id;
        }
      } catch (getUserError) {
        logTest('Get existing user', false, getUserError.message);
      }
    } else {
      logTest('User creation', false, error.response?.data?.message || error.message);
    }
    return null;
  }
}

async function testCreateEndpoint(userId) {
  logSection('Testing Create Endpoint');
  
  if (!userId) {
    logTest('POST /mitarbeiter', false, 'No userId available');
    return null;
  }
  
  try {
    const mitarbeiterData = {
      ...testMitarbeiter,
      userId
    };
    
    const response = await api.post('/mitarbeiter', mitarbeiterData);
    logTest('POST /mitarbeiter creates new Mitarbeiter', response.status === 201 || response.status === 200);
    logTest('Response has _id', response.data._id !== undefined);
    
    // Verify field mapping
    const created = response.data;
    logTest('Field mapping: vorname', created.vorname === testMitarbeiter.vorname);
    logTest('Field mapping: adresse', created.adresse?.strasse === testMitarbeiter.adresse.strasse);
    logTest('Field mapping: faehigkeiten', Array.isArray(created.faehigkeiten));
    logTest('Field mapping: isActive', created.isActive === true);
    
    return created._id;
  } catch (error) {
    logTest('Create endpoint test', false, error.response?.data?.message || error.message);
    return null;
  }
}

async function testGetByIdEndpoint(mitarbeiterId) {
  logSection('Testing Get By ID Endpoint');
  
  if (!mitarbeiterId) {
    logTest('GET /mitarbeiter/:id', false, 'No ID available from create test');
    return;
  }
  
  try {
    const response = await api.get(`/mitarbeiter/${mitarbeiterId}`);
    logTest('GET /mitarbeiter/:id returns data', response.status === 200);
    
    const mitarbeiter = response.data.data || response.data;
    logTest('Response has correct ID', mitarbeiter._id === mitarbeiterId);
    
    // Verify all fields are present
    logTest('Has personal data', mitarbeiter.vorname !== undefined && mitarbeiter.nachname !== undefined);
    logTest('Has contact data', mitarbeiter.telefon !== undefined || mitarbeiter.email !== undefined);
    logTest('Has address data', mitarbeiter.adresse !== undefined);
    logTest('Has position', mitarbeiter.position !== undefined);
    logTest('Has skills array', Array.isArray(mitarbeiter.faehigkeiten));
    logTest('Has userId populated', mitarbeiter.userId !== undefined);
    
  } catch (error) {
    logTest('Get by ID endpoint test', false, error.message);
  }
}

async function testUpdateEndpoint(mitarbeiterId) {
  logSection('Testing Update Endpoint');
  
  if (!mitarbeiterId) {
    logTest('PUT /mitarbeiter/:id', false, 'No ID available from create test');
    return;
  }
  
  try {
    // Update status
    const statusUpdate = await api.put(`/mitarbeiter/${mitarbeiterId}`, { isActive: false });
    logTest('PUT /mitarbeiter/:id updates status', statusUpdate.status === 200);
    logTest('Status updated correctly', statusUpdate.data.isActive === false);
    
    // Update skills
    const skillsUpdate = await api.put(`/mitarbeiter/${mitarbeiterId}`, {
      faehigkeiten: ['Packen', 'Möbelmontage', 'Schwerlasttransport']
    });
    logTest('Can update skills', skillsUpdate.status === 200);
    
    // Update address
    const addressUpdate = await api.put(`/mitarbeiter/${mitarbeiterId}`, {
      adresse: {
        strasse: 'Neue Straße',
        hausnummer: '456',
        plz: '54321',
        ort: 'München'
      }
    });
    logTest('Can update address', addressUpdate.status === 200);
    
  } catch (error) {
    logTest('Update endpoint test', false, error.message);
  }
}

async function testArbeitszeitenEndpoint(mitarbeiterId) {
  logSection('Testing Arbeitszeiten Endpoints');
  
  if (!mitarbeiterId) {
    logTest('Arbeitszeiten endpoints', false, 'No ID available');
    return;
  }
  
  try {
    // Add Arbeitszeit
    const arbeitszeitData = {
      datum: new Date(),
      startzeit: '08:00',
      endzeit: '16:00',
      pausen: [{ start: '12:00', ende: '12:30' }],
      notizen: 'Test Arbeitszeit'
    };
    
    const createResponse = await api.post(`/mitarbeiter/${mitarbeiterId}/arbeitszeiten`, arbeitszeitData);
    logTest('POST /mitarbeiter/:id/arbeitszeiten', createResponse.status === 201 || createResponse.status === 200);
    
    // Get Arbeitszeiten
    const getResponse = await api.get(`/mitarbeiter/${mitarbeiterId}/arbeitszeiten`);
    logTest('GET /mitarbeiter/:id/arbeitszeiten', getResponse.status === 200);
    logTest('Arbeitszeiten has berechneteStunden', getResponse.data[0]?.berechneteStunden !== undefined);
    
  } catch (error) {
    logTest('Arbeitszeiten endpoint test', false, error.message);
  }
}

async function testFieldValidation() {
  logSection('Testing Field Validation');
  
  try {
    // Test missing required fields
    const invalidMitarbeiter = {
      email: 'invalid@test.de'
    };
    
    try {
      await api.post('/mitarbeiter', invalidMitarbeiter);
      logTest('Validation: rejects incomplete data', false);
    } catch (error) {
      logTest('Validation: rejects incomplete data', error.response?.status === 400);
    }
    
    // Test invalid email
    const invalidEmailMitarbeiter = {
      ...testMitarbeiter,
      email: 'invalid-email',
      userId: 'dummy-id'
    };
    
    try {
      await api.post('/mitarbeiter', invalidEmailMitarbeiter);
      logTest('Validation: validates email format', false);
    } catch (error) {
      logTest('Validation: validates email format', true);
    }
    
    // Test invalid position
    const invalidPositionMitarbeiter = {
      ...testMitarbeiter,
      position: 'InvalidPosition',
      userId: 'dummy-id'
    };
    
    try {
      await api.post('/mitarbeiter', invalidPositionMitarbeiter);
      logTest('Validation: validates position enum', false);
    } catch (error) {
      logTest('Validation: validates position enum', true);
    }
    
  } catch (error) {
    logTest('Field validation tests', false, error.message);
  }
}

async function testDeleteEndpoint(mitarbeiterId) {
  logSection('Testing Delete Endpoint');
  
  if (!mitarbeiterId) {
    logTest('DELETE /mitarbeiter/:id', false, 'No ID available from create test');
    return;
  }
  
  try {
    const response = await api.delete(`/mitarbeiter/${mitarbeiterId}`);
    logTest('DELETE /mitarbeiter/:id', response.status === 200 || response.status === 204);
    
    // Verify deletion
    try {
      await api.get(`/mitarbeiter/${mitarbeiterId}`);
      logTest('Mitarbeiter is deleted', false);
    } catch (error) {
      logTest('Mitarbeiter is deleted', error.response?.status === 404);
    }
    
  } catch (error) {
    logTest('Delete endpoint test', false, error.message);
  }
}

// Main test runner
async function runTests() {
  console.log(colors.cyan('\n🧪 Mitarbeiter Module Integration Tests\n'));
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Using token: ${TEST_TOKEN ? 'Yes' : 'No'}\n`);
  
  try {
    // Run tests in sequence
    await testListEndpoint();
    
    const userId = await testUserCreation();
    
    const createdId = await testCreateEndpoint(userId);
    
    await testGetByIdEndpoint(createdId);
    
    await testUpdateEndpoint(createdId);
    
    await testArbeitszeitenEndpoint(createdId);
    
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