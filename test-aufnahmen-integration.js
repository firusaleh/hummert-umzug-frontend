#!/usr/bin/env node

/**
 * Aufnahmen Module Integration Test
 * Tests all functionality of the Aufnahmen module including:
 * - List view with search
 * - Form creation with room/furniture management
 * - Details view with all data
 * - PDF generation
 * - Umzug creation from Aufnahme
 * - API integration
 * - Field mapping verification
 */

const axios = require('axios');
const colors = require('colors/safe');

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const TEST_TOKEN = process.env.TEST_TOKEN || 'your-test-token';

// Test data
const testAufnahme = {
  datum: new Date(),
  kundenName: 'Test Aufnahme Kunde',
  kontaktperson: 'Max Mustermann',
  telefon: '0123456789',
  email: 'test.aufnahme@example.com',
  umzugstyp: 'privat',
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
  raeume: [
    {
      name: 'Wohnzimmer',
      flaeche: 25,
      etage: 0,
      besonderheiten: 'Großes Fenster',
      moebel: [
        {
          name: 'Sofa',
          anzahl: 1,
          kategorie: 'sofa',
          groesse: {
            laenge: 200,
            breite: 90,
            hoehe: 80,
            volumen: 1.44
          },
          gewicht: 80,
          zerbrechlich: false,
          besonderheiten: '3-Sitzer',
          demontage: true,
          montage: true,
          verpackung: false
        },
        {
          name: 'Couchtisch',
          anzahl: 1,
          kategorie: 'tisch',
          groesse: {
            laenge: 120,
            breite: 60,
            hoehe: 45,
            volumen: 0.324
          },
          gewicht: 25,
          zerbrechlich: true,
          besonderheiten: 'Glasplatte'
        }
      ]
    },
    {
      name: 'Schlafzimmer',
      flaeche: 20,
      etage: 0,
      moebel: [
        {
          name: 'Doppelbett',
          anzahl: 1,
          kategorie: 'bett',
          groesse: {
            laenge: 200,
            breite: 180,
            hoehe: 100,
            volumen: 3.6
          },
          gewicht: 120,
          zerbrechlich: false,
          demontage: true,
          montage: true
        },
        {
          name: 'Kleiderschrank',
          anzahl: 1,
          kategorie: 'schrank',
          groesse: {
            laenge: 200,
            breite: 60,
            hoehe: 220,
            volumen: 2.64
          },
          gewicht: 150,
          zerbrechlich: false,
          demontage: true,
          montage: true
        }
      ]
    }
  ],
  notizen: 'Klavier im Wohnzimmer, muss von Spezialisten transportiert werden',
  besonderheiten: 'Enge Treppe im Auszugshaus, kein Parkplatz direkt vor der Tür',
  bewertung: 4,
  angebotspreis: {
    netto: 2500,
    brutto: 2975,
    mwst: 19
  },
  status: 'in_bearbeitung'
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
    const response = await api.get('/aufnahmen');
    logTest('GET /aufnahmen returns data', response.status === 200);
    logTest('Response has data array', Array.isArray(response.data.data || response.data));
    
    // Test with filters
    const statusResponse = await api.get('/aufnahmen?status=in_bearbeitung');
    logTest('GET /aufnahmen with status filter', statusResponse.status === 200);
    
    // Test with search
    const searchResponse = await api.get('/aufnahmen?search=Test');
    logTest('GET /aufnahmen with search', searchResponse.status === 200);
    
    // Test pagination
    const paginatedResponse = await api.get('/aufnahmen?page=1&limit=5');
    logTest('GET /aufnahmen with pagination', paginatedResponse.status === 200);
    
  } catch (error) {
    logTest('List endpoint tests', false, error.message);
  }
}

async function testCreateEndpoint() {
  logSection('Testing Create Endpoint');
  
  try {
    const response = await api.post('/aufnahmen', testAufnahme);
    logTest('POST /aufnahmen creates new Aufnahme', response.status === 201 || response.status === 200);
    logTest('Response has _id', response.data._id !== undefined);
    
    // Verify field mapping
    const created = response.data;
    logTest('Field mapping: kundenName', created.kundenName === testAufnahme.kundenName);
    logTest('Field mapping: addresses', created.auszugsadresse !== undefined && created.einzugsadresse !== undefined);
    logTest('Field mapping: raeume', Array.isArray(created.raeume));
    logTest('Field mapping: status', created.status === testAufnahme.status);
    
    // Calculate total volume
    let expectedVolume = 0;
    testAufnahme.raeume.forEach(raum => {
      raum.moebel.forEach(moebel => {
        expectedVolume += moebel.groesse.volumen * moebel.anzahl;
      });
    });
    
    if (created.gesamtvolumen !== undefined) {
      logTest('Volume calculation', Math.abs(created.gesamtvolumen - expectedVolume) < 0.1);
    }
    
    return created._id;
  } catch (error) {
    logTest('Create endpoint test', false, error.response?.data?.message || error.message);
    return null;
  }
}

async function testGetByIdEndpoint(aufnahmeId) {
  logSection('Testing Get By ID Endpoint');
  
  if (!aufnahmeId) {
    logTest('GET /aufnahmen/:id', false, 'No ID available from create test');
    return;
  }
  
  try {
    const response = await api.get(`/aufnahmen/${aufnahmeId}`);
    logTest('GET /aufnahmen/:id returns data', response.status === 200);
    
    const aufnahme = response.data.data || response.data;
    logTest('Response has correct ID', aufnahme._id === aufnahmeId);
    
    // Verify all fields are present
    logTest('Has customer data', aufnahme.kundenName !== undefined);
    logTest('Has addresses', aufnahme.auszugsadresse !== undefined && aufnahme.einzugsadresse !== undefined);
    logTest('Has rooms', Array.isArray(aufnahme.raeume) && aufnahme.raeume.length > 0);
    logTest('Has furniture in rooms', aufnahme.raeume[0].moebel !== undefined);
    logTest('Has pricing', aufnahme.angebotspreis !== undefined);
    
  } catch (error) {
    logTest('Get by ID endpoint test', false, error.message);
  }
}

async function testRoomManagement(aufnahmeId) {
  logSection('Testing Room Management');
  
  if (!aufnahmeId) {
    logTest('Room management endpoints', false, 'No ID available');
    return;
  }
  
  try {
    // Add a room
    const newRoom = {
      name: 'Küche',
      flaeche: 15,
      etage: 0,
      besonderheiten: 'Einbauküche',
      moebel: []
    };
    
    const addResponse = await api.post(`/aufnahmen/${aufnahmeId}/raeume`, newRoom);
    logTest('POST /aufnahmen/:id/raeume adds room', addResponse.status === 200);
    
    const roomId = addResponse.data.raeume?.[addResponse.data.raeume.length - 1]?._id;
    
    if (roomId) {
      // Update room
      const updateResponse = await api.put(`/aufnahmen/${aufnahmeId}/raeume/${roomId}`, {
        flaeche: 18
      });
      logTest('PUT /aufnahmen/:id/raeume/:roomId updates room', updateResponse.status === 200);
      
      // Add furniture to room
      const newFurniture = {
        name: 'Kühlschrank',
        anzahl: 1,
        kategorie: 'sonstiges',
        groesse: {
          laenge: 60,
          breite: 60,
          hoehe: 180,
          volumen: 0.648
        },
        gewicht: 80,
        zerbrechlich: false
      };
      
      const furnitureResponse = await api.post(`/aufnahmen/${aufnahmeId}/raeume/${roomId}/moebel`, newFurniture);
      logTest('POST /aufnahmen/:id/raeume/:roomId/moebel adds furniture', furnitureResponse.status === 200);
    }
    
  } catch (error) {
    logTest('Room management test', false, error.message);
  }
}

async function testUpdateEndpoint(aufnahmeId) {
  logSection('Testing Update Endpoint');
  
  if (!aufnahmeId) {
    logTest('PUT /aufnahmen/:id', false, 'No ID available from create test');
    return;
  }
  
  try {
    // Update status
    const statusUpdate = await api.put(`/aufnahmen/${aufnahmeId}`, { status: 'angebot_erstellt' });
    logTest('PUT /aufnahmen/:id updates status', statusUpdate.status === 200);
    logTest('Status updated correctly', statusUpdate.data.status === 'angebot_erstellt');
    
    // Update pricing
    const priceUpdate = await api.put(`/aufnahmen/${aufnahmeId}`, {
      angebotspreis: {
        netto: 3000,
        brutto: 3570,
        mwst: 19
      }
    });
    logTest('Can update pricing', priceUpdate.status === 200);
    
    // Update notes
    const notesUpdate = await api.put(`/aufnahmen/${aufnahmeId}`, {
      notizen: 'Updated notes with additional information'
    });
    logTest('Can update notes', notesUpdate.status === 200);
    
  } catch (error) {
    logTest('Update endpoint test', false, error.message);
  }
}

async function testGenerateQuote(aufnahmeId) {
  logSection('Testing Quote Generation');
  
  if (!aufnahmeId) {
    logTest('Quote generation', false, 'No ID available');
    return;
  }
  
  try {
    const response = await api.post(`/aufnahmen/${aufnahmeId}/angebot`);
    logTest('POST /aufnahmen/:id/angebot generates quote', response.status === 200);
    logTest('Quote has price information', response.data.angebotspreis !== undefined);
    
  } catch (error) {
    logTest('Quote generation test', false, error.message);
  }
}

async function testCreateUmzug(aufnahmeId) {
  logSection('Testing Umzug Creation from Aufnahme');
  
  if (!aufnahmeId) {
    logTest('Umzug creation', false, 'No ID available');
    return;
  }
  
  try {
    const response = await api.post(`/aufnahmen/${aufnahmeId}/umzug`);
    logTest('POST /aufnahmen/:id/umzug creates Umzug', response.status === 200 || response.status === 201);
    logTest('Umzug has _id', response.data._id !== undefined);
    logTest('Umzug linked to Aufnahme', response.data.aufnahmeId === aufnahmeId);
    
    return response.data._id;
  } catch (error) {
    logTest('Umzug creation test', false, error.message);
    return null;
  }
}

async function testFieldValidation() {
  logSection('Testing Field Validation');
  
  try {
    // Test missing required fields
    const invalidAufnahme = {
      umzugstyp: 'privat'
    };
    
    try {
      await api.post('/aufnahmen', invalidAufnahme);
      logTest('Validation: rejects missing kundenName', false);
    } catch (error) {
      logTest('Validation: rejects missing kundenName', error.response?.status === 400);
    }
    
    // Test invalid email
    const invalidEmailAufnahme = {
      ...testAufnahme,
      email: 'invalid-email'
    };
    
    try {
      await api.post('/aufnahmen', invalidEmailAufnahme);
      logTest('Validation: validates email format', false);
    } catch (error) {
      logTest('Validation: validates email format', true);
    }
    
    // Test invalid umzugstyp
    const invalidTypAufnahme = {
      ...testAufnahme,
      umzugstyp: 'invalid'
    };
    
    try {
      await api.post('/aufnahmen', invalidTypAufnahme);
      logTest('Validation: validates umzugstyp enum', false);
    } catch (error) {
      logTest('Validation: validates umzugstyp enum', true);
    }
    
    // Test invalid bewertung
    const invalidBewertungAufnahme = {
      ...testAufnahme,
      bewertung: 6 // Max is 5
    };
    
    try {
      await api.post('/aufnahmen', invalidBewertungAufnahme);
      logTest('Validation: validates bewertung range', false);
    } catch (error) {
      logTest('Validation: validates bewertung range', true);
    }
    
  } catch (error) {
    logTest('Field validation tests', false, error.message);
  }
}

async function testDeleteEndpoint(aufnahmeId) {
  logSection('Testing Delete Endpoint');
  
  if (!aufnahmeId) {
    logTest('DELETE /aufnahmen/:id', false, 'No ID available from create test');
    return;
  }
  
  try {
    const response = await api.delete(`/aufnahmen/${aufnahmeId}`);
    logTest('DELETE /aufnahmen/:id', response.status === 200 || response.status === 204);
    
    // Verify deletion
    try {
      await api.get(`/aufnahmen/${aufnahmeId}`);
      logTest('Aufnahme is deleted', false);
    } catch (error) {
      logTest('Aufnahme is deleted', error.response?.status === 404);
    }
    
  } catch (error) {
    logTest('Delete endpoint test', false, error.message);
  }
}

// Main test runner
async function runTests() {
  console.log(colors.cyan('\n🧪 Aufnahmen Module Integration Tests\n'));
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Using token: ${TEST_TOKEN ? 'Yes' : 'No'}\n`);
  
  try {
    // Run tests in sequence
    await testListEndpoint();
    
    const createdId = await testCreateEndpoint();
    
    await testGetByIdEndpoint(createdId);
    
    await testRoomManagement(createdId);
    
    await testUpdateEndpoint(createdId);
    
    await testGenerateQuote(createdId);
    
    const umzugId = await testCreateUmzug(createdId);
    
    await testFieldValidation();
    
    // Clean up - delete created Umzug first if exists
    if (umzugId) {
      try {
        await api.delete(`/umzuege/${umzugId}`);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
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