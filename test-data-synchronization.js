// Test script for data synchronization between components
const fs = require('fs').promises;
const path = require('path');

class DataSynchronizationTester {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      timestamp: new Date().toISOString(),
      tests: []
    };
  }

  // Run a test
  async runTest(name, testFn) {
    console.log(`\n📋 Testing: ${name}`);
    const startTime = Date.now();
    
    try {
      await testFn();
      this.testResults.passed++;
      this.testResults.tests.push({
        name,
        status: 'passed',
        duration: Date.now() - startTime
      });
      console.log(`✅ Passed: ${name}`);
    } catch (error) {
      this.testResults.failed++;
      this.testResults.tests.push({
        name,
        status: 'failed',
        error: error.message,
        duration: Date.now() - startTime
      });
      console.log(`❌ Failed: ${name}`);
      console.log(`   Error: ${error.message}`);
    }
  }

  // Test 1: Check if all required files exist
  async testFileStructure() {
    await this.runTest('Data Sync Service File Exists', async () => {
      await fs.access(path.join(__dirname, 'src/services/dataSyncService.js'));
    });

    await this.runTest('Data Sync Context Exists', async () => {
      await fs.access(path.join(__dirname, 'src/context/DataSyncContext.jsx'));
    });

    await this.runTest('Synced API Service Exists', async () => {
      await fs.access(path.join(__dirname, 'src/services/syncedApi.js'));
    });

    await this.runTest('useSyncedData Hook Exists', async () => {
      await fs.access(path.join(__dirname, 'src/hooks/useSyncedData.js'));
    });
  }

  // Test 2: Validate context provider setup
  async testContextProviders() {
    await this.runTest('Context Providers in Correct Order', async () => {
      const indexContent = await fs.readFile(
        path.join(__dirname, 'src/index.js'), 
        'utf8'
      );
      
      // Check provider order
      const authIndex = indexContent.indexOf('AuthProvider');
      const appIndex = indexContent.indexOf('AppProvider');
      const dataSyncIndex = indexContent.indexOf('DataSyncProvider');
      
      if (authIndex === -1) throw new Error('AuthProvider not found');
      if (appIndex === -1) throw new Error('AppProvider not found');
      if (dataSyncIndex === -1) throw new Error('DataSyncProvider not found');
      
      // DataSyncProvider should be inside AuthProvider
      if (dataSyncIndex < authIndex) {
        throw new Error('DataSyncProvider must be inside AuthProvider');
      }
    });
  }

  // Test 3: Check WebSocket implementation
  async testWebSocketImplementation() {
    await this.runTest('Socket.io Client Import', async () => {
      const serviceContent = await fs.readFile(
        path.join(__dirname, 'src/services/dataSyncService.js'),
        'utf8'
      );
      
      if (!serviceContent.includes("import io from 'socket.io-client'")) {
        throw new Error('Socket.io client not imported');
      }
      
      if (!serviceContent.includes('socket.on(')) {
        throw new Error('No socket event listeners found');
      }
    });

    await this.runTest('WebSocket Event Handlers', async () => {
      const serviceContent = await fs.readFile(
        path.join(__dirname, 'src/services/dataSyncService.js'),
        'utf8'
      );
      
      const requiredEvents = [
        'connect',
        'disconnect',
        'data:update',
        'data:create',
        'data:delete'
      ];
      
      for (const event of requiredEvents) {
        if (!serviceContent.includes(`'${event}'`)) {
          throw new Error(`Missing event handler for: ${event}`);
        }
      }
    });
  }

  // Test 4: Validate data synchronization features
  async testSyncFeatures() {
    await this.runTest('Optimistic Updates Implementation', async () => {
      const hookContent = await fs.readFile(
        path.join(__dirname, 'src/hooks/useSyncedData.js'),
        'utf8'
      );
      
      if (!hookContent.includes('_isOptimistic')) {
        throw new Error('Optimistic updates not implemented');
      }
      
      if (!hookContent.includes('rollback')) {
        throw new Error('Rollback mechanism not implemented');
      }
    });

    await this.runTest('Offline Queue Implementation', async () => {
      const serviceContent = await fs.readFile(
        path.join(__dirname, 'src/services/dataSyncService.js'),
        'utf8'
      );
      
      if (!serviceContent.includes('pendingUpdates')) {
        throw new Error('Pending updates queue not implemented');
      }
      
      if (!serviceContent.includes('queueUpdate')) {
        throw new Error('Queue update method not implemented');
      }
    });

    await this.runTest('Cache Management', async () => {
      const serviceContent = await fs.readFile(
        path.join(__dirname, 'src/services/dataSyncService.js'),
        'utf8'
      );
      
      if (!serviceContent.includes('dataCache')) {
        throw new Error('Data cache not implemented');
      }
      
      if (!serviceContent.includes('getCached')) {
        throw new Error('Get cached method not implemented');
      }
    });
  }

  // Test 5: Component integration
  async testComponentIntegration() {
    await this.runTest('Enhanced Dashboard Component', async () => {
      await fs.access(path.join(__dirname, 'src/pages/DashboardSynced.jsx'));
      
      const content = await fs.readFile(
        path.join(__dirname, 'src/pages/DashboardSynced.jsx'),
        'utf8'
      );
      
      if (!content.includes('useDataSync')) {
        throw new Error('Dashboard not using data sync');
      }
      
      if (!content.includes('useSyncedUmzuege')) {
        throw new Error('Dashboard not using synced data hooks');
      }
    });

    await this.runTest('Enhanced Umzuege List Component', async () => {
      await fs.access(path.join(__dirname, 'src/pages/umzuege/UmzuegeListSynced.jsx'));
      
      const content = await fs.readFile(
        path.join(__dirname, 'src/pages/umzuege/UmzuegeListSynced.jsx'),
        'utf8'
      );
      
      if (!content.includes('SyncStatus')) {
        throw new Error('Sync status indicator not implemented');
      }
      
      if (!content.includes('localChanges')) {
        throw new Error('Local changes tracking not implemented');
      }
    });
  }

  // Test 6: Error handling and recovery
  async testErrorHandling() {
    await this.runTest('Connection Error Handling', async () => {
      const contextContent = await fs.readFile(
        path.join(__dirname, 'src/context/DataSyncContext.jsx'),
        'utf8'
      );
      
      if (!contextContent.includes('syncErrors')) {
        throw new Error('Sync error tracking not implemented');
      }
      
      if (!contextContent.includes('clearSyncErrors')) {
        throw new Error('Clear sync errors method not implemented');
      }
    });

    await this.runTest('Retry Mechanism', async () => {
      const serviceContent = await fs.readFile(
        path.join(__dirname, 'src/services/dataSyncService.js'),
        'utf8'
      );
      
      if (!serviceContent.includes('reconnectAttempts')) {
        throw new Error('Reconnect attempts not tracked');
      }
      
      if (!serviceContent.includes('maxReconnectAttempts')) {
        throw new Error('Max reconnect attempts not defined');
      }
    });
  }

  // Generate report
  async generateReport() {
    const report = {
      summary: {
        total: this.testResults.passed + this.testResults.failed,
        passed: this.testResults.passed,
        failed: this.testResults.failed,
        timestamp: this.testResults.timestamp
      },
      tests: this.testResults.tests,
      features: {
        realTimeSync: this.testResults.tests.find(t => t.name.includes('WebSocket'))?.status === 'passed',
        offlineSupport: this.testResults.tests.find(t => t.name.includes('Offline Queue'))?.status === 'passed',
        optimisticUpdates: this.testResults.tests.find(t => t.name.includes('Optimistic'))?.status === 'passed',
        caching: this.testResults.tests.find(t => t.name.includes('Cache'))?.status === 'passed',
        errorRecovery: this.testResults.tests.find(t => t.name.includes('Error Handling'))?.status === 'passed'
      }
    };

    await fs.writeFile(
      path.join(__dirname, 'data-synchronization-test-report.json'),
      JSON.stringify(report, null, 2)
    );

    return report;
  }

  // Run all tests
  async run() {
    console.log('🚀 Starting Data Synchronization Tests\n');

    await this.testFileStructure();
    await this.testContextProviders();
    await this.testWebSocketImplementation();
    await this.testSyncFeatures();
    await this.testComponentIntegration();
    await this.testErrorHandling();

    const report = await this.generateReport();

    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${report.summary.total}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log('\nFeatures Implemented:');
    console.log(`- Real-time Sync: ${report.features.realTimeSync ? '✅' : '❌'}`);
    console.log(`- Offline Support: ${report.features.offlineSupport ? '✅' : '❌'}`);
    console.log(`- Optimistic Updates: ${report.features.optimisticUpdates ? '✅' : '❌'}`);
    console.log(`- Caching: ${report.features.caching ? '✅' : '❌'}`);
    console.log(`- Error Recovery: ${report.features.errorRecovery ? '✅' : '❌'}`);
    console.log('='.repeat(60));
    console.log(`\n📄 Report saved to: data-synchronization-test-report.json`);

    process.exit(this.testResults.failed > 0 ? 1 : 0);
  }
}

// Run the tests
const tester = new DataSynchronizationTester();
tester.run();