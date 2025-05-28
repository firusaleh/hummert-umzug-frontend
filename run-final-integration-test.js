const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

// Configuration
const FRONTEND_PORT = 3000;
const BACKEND_PORT = 5001;
const STARTUP_TIMEOUT = 30000;
const TEST_TIMEOUT = 120000;

class IntegrationTestRunner {
  constructor() {
    this.processes = [];
    this.testResults = {
      frontend: null,
      backend: null,
      integration: null,
      timestamp: new Date().toISOString()
    };
  }

  // Check if port is in use
  async isPortInUse(port) {
    return new Promise((resolve) => {
      const net = require('net');
      const server = net.createServer();
      
      server.once('error', () => resolve(true));
      server.once('listening', () => {
        server.close();
        resolve(false);
      });
      
      server.listen(port);
    });
  }

  // Wait for server to be ready
  async waitForServer(url, timeout = STARTUP_TIMEOUT) {
    const axios = require('axios');
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        await axios.get(url, { timeout: 1000 });
        return true;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return false;
  }

  // Start backend server
  async startBackend() {
    console.log('🚀 Starting backend server...');
    
    // Check if already running
    const backendInUse = await this.isPortInUse(BACKEND_PORT);
    if (backendInUse) {
      console.log('✅ Backend server already running on port', BACKEND_PORT);
      this.testResults.backend = { status: 'already_running', port: BACKEND_PORT };
      return true;
    }
    
    // Start backend
    const backendProcess = spawn('node', ['../server.js'], {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, PORT: BACKEND_PORT, NODE_ENV: 'test' },
      detached: false
    });
    
    this.processes.push(backendProcess);
    
    backendProcess.stdout.on('data', (data) => {
      console.log(`Backend: ${data.toString().trim()}`);
    });
    
    backendProcess.stderr.on('data', (data) => {
      console.error(`Backend Error: ${data.toString().trim()}`);
    });
    
    // Wait for backend to be ready
    const backendReady = await this.waitForServer(`http://localhost:${BACKEND_PORT}/api/health`);
    
    if (backendReady) {
      console.log('✅ Backend server started successfully');
      this.testResults.backend = { status: 'started', port: BACKEND_PORT };
      return true;
    } else {
      console.error('❌ Backend server failed to start');
      this.testResults.backend = { status: 'failed', error: 'Timeout waiting for server' };
      return false;
    }
  }

  // Start frontend server
  async startFrontend() {
    console.log('🚀 Starting frontend server...');
    
    // Check if already running
    const frontendInUse = await this.isPortInUse(FRONTEND_PORT);
    if (frontendInUse) {
      console.log('✅ Frontend server already running on port', FRONTEND_PORT);
      this.testResults.frontend = { status: 'already_running', port: FRONTEND_PORT };
      return true;
    }
    
    // Start frontend
    const frontendProcess = spawn('npm', ['start'], {
      cwd: __dirname,
      env: { 
        ...process.env, 
        PORT: FRONTEND_PORT,
        BROWSER: 'none',
        REACT_APP_API_URL: `http://localhost:${BACKEND_PORT}/api`
      },
      shell: true,
      detached: false
    });
    
    this.processes.push(frontendProcess);
    
    frontendProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output && !output.includes('webpack')) {
        console.log(`Frontend: ${output}`);
      }
    });
    
    frontendProcess.stderr.on('data', (data) => {
      const error = data.toString().trim();
      if (error && !error.includes('Warning')) {
        console.error(`Frontend Error: ${error}`);
      }
    });
    
    // Wait for frontend to be ready
    const frontendReady = await this.waitForServer(`http://localhost:${FRONTEND_PORT}`);
    
    if (frontendReady) {
      console.log('✅ Frontend server started successfully');
      this.testResults.frontend = { status: 'started', port: FRONTEND_PORT };
      return true;
    } else {
      console.error('❌ Frontend server failed to start');
      this.testResults.frontend = { status: 'failed', error: 'Timeout waiting for server' };
      return false;
    }
  }

  // Run integration tests
  async runIntegrationTests() {
    console.log('\n🧪 Running integration tests...\n');
    
    return new Promise((resolve) => {
      const testProcess = spawn('node', ['final-system-integration-test.js'], {
        cwd: __dirname,
        env: {
          ...process.env,
          REACT_APP_API_URL: `http://localhost:${BACKEND_PORT}/api`
        }
      });
      
      let output = '';
      let errorOutput = '';
      
      testProcess.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        process.stdout.write(data);
      });
      
      testProcess.stderr.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        process.stderr.write(data);
      });
      
      testProcess.on('close', (code) => {
        this.testResults.integration = {
          exitCode: code,
          success: code === 0,
          output: output,
          errors: errorOutput
        };
        resolve(code === 0);
      });
      
      // Set timeout for tests
      setTimeout(() => {
        console.error('\n⏱️  Test timeout reached, terminating...');
        testProcess.kill();
        resolve(false);
      }, TEST_TIMEOUT);
    });
  }

  // Cleanup processes
  async cleanup() {
    console.log('\n🧹 Cleaning up...');
    
    for (const proc of this.processes) {
      if (proc && !proc.killed) {
        proc.kill('SIGTERM');
        console.log('Terminated process:', proc.pid);
      }
    }
    
    // Give processes time to clean up
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Generate final report
  async generateReport() {
    const reportPath = path.join(__dirname, 'final-integration-test-report.json');
    
    // Try to read the test results
    let testReport = null;
    try {
      const testReportPath = path.join(__dirname, 'final-system-integration-report.json');
      const reportContent = await fs.readFile(testReportPath, 'utf8');
      testReport = JSON.parse(reportContent);
    } catch (error) {
      console.error('Could not read test report:', error.message);
    }
    
    const finalReport = {
      ...this.testResults,
      testReport: testReport,
      summary: {
        success: this.testResults.integration?.success || false,
        serversStarted: {
          backend: ['started', 'already_running'].includes(this.testResults.backend?.status),
          frontend: ['started', 'already_running'].includes(this.testResults.frontend?.status)
        },
        duration: new Date() - new Date(this.testResults.timestamp)
      }
    };
    
    await fs.writeFile(reportPath, JSON.stringify(finalReport, null, 2));
    console.log(`\n📄 Final report saved to: ${reportPath}`);
    
    return finalReport;
  }

  // Main run method
  async run() {
    console.log('🚀 Starting Final System Integration Test\n');
    console.log(`   Backend Port: ${BACKEND_PORT}`);
    console.log(`   Frontend Port: ${FRONTEND_PORT}`);
    console.log(`   Test Timeout: ${TEST_TIMEOUT / 1000}s\n`);
    
    try {
      // Start servers
      const backendStarted = await this.startBackend();
      if (!backendStarted) {
        throw new Error('Failed to start backend server');
      }
      
      const frontendStarted = await this.startFrontend();
      if (!frontendStarted) {
        throw new Error('Failed to start frontend server');
      }
      
      // Give servers a moment to stabilize
      console.log('\n⏳ Waiting for servers to stabilize...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Run tests
      const testsPassed = await this.runIntegrationTests();
      
      // Generate report
      const report = await this.generateReport();
      
      console.log('\n' + '='.repeat(60));
      console.log('📊 Final Integration Test Summary:');
      console.log('='.repeat(60));
      console.log(`Backend Server: ${report.summary.serversStarted.backend ? '✅' : '❌'}`);
      console.log(`Frontend Server: ${report.summary.serversStarted.frontend ? '✅' : '❌'}`);
      console.log(`Integration Tests: ${report.summary.success ? '✅' : '❌'}`);
      
      if (report.testReport?.summary) {
        console.log(`\nTest Results:`);
        console.log(`  Total: ${report.testReport.summary.total}`);
        console.log(`  Passed: ${report.testReport.summary.passed}`);
        console.log(`  Failed: ${report.testReport.summary.failed}`);
        console.log(`  Duration: ${report.testReport.summary.duration}`);
      }
      
      console.log('='.repeat(60));
      
      process.exit(testsPassed ? 0 : 1);
      
    } catch (error) {
      console.error('\n💥 Fatal error:', error.message);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the test runner
const runner = new IntegrationTestRunner();
runner.run();