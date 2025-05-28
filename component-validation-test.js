const fs = require('fs').promises;
const path = require('path');

// Component validation test suite
class ComponentValidator {
  constructor() {
    this.results = {
      components: [],
      services: [],
      utils: [],
      routes: [],
      errors: [],
      timestamp: new Date().toISOString()
    };
  }

  // Validate file structure
  async validateFileStructure() {
    console.log('📁 Validating file structure...\n');
    
    const requiredDirs = [
      'src/components',
      'src/services',
      'src/utils',
      'src/styles',
      'public'
    ];
    
    for (const dir of requiredDirs) {
      try {
        await fs.access(path.join(__dirname, dir));
        console.log(`✅ ${dir} exists`);
      } catch (error) {
        console.log(`❌ ${dir} missing`);
        this.results.errors.push({
          type: 'missing_directory',
          path: dir,
          error: 'Directory not found'
        });
      }
    }
  }

  // Validate components
  async validateComponents() {
    console.log('\n🧩 Validating components...\n');
    
    const componentsDir = path.join(__dirname, 'src/components');
    
    try {
      const files = await fs.readdir(componentsDir, { recursive: true });
      
      for (const file of files) {
        if (file.endsWith('.jsx') || file.endsWith('.js')) {
          const filePath = path.join(componentsDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          
          const validation = this.validateComponentContent(file, content);
          this.results.components.push({
            name: file,
            path: filePath,
            ...validation
          });
          
          if (validation.valid) {
            console.log(`✅ ${file}`);
          } else {
            console.log(`❌ ${file}: ${validation.issues.join(', ')}`);
          }
        }
      }
    } catch (error) {
      console.error('Error reading components:', error.message);
      this.results.errors.push({
        type: 'component_scan_error',
        error: error.message
      });
    }
  }

  // Validate component content
  validateComponentContent(filename, content) {
    const issues = [];
    
    // Check for React import
    if (!content.includes('import React') && !content.includes('from \'react\'')) {
      issues.push('Missing React import');
    }
    
    // Check for export
    if (!content.includes('export default') && !content.includes('export {')) {
      issues.push('Missing export');
    }
    
    // Check for proper hooks usage
    if (content.includes('useState(') && !content.includes('import { useState')) {
      issues.push('useState used without import');
    }
    
    if (content.includes('useEffect(') && !content.includes('import { useEffect')) {
      issues.push('useEffect used without import');
    }
    
    // Check for API service imports
    if (content.includes('fetch(') || content.includes('axios')) {
      if (!content.includes('services/') && !content.includes('api/')) {
        issues.push('Direct API calls without service layer');
      }
    }
    
    // Check for proper error handling
    if (content.includes('try {') && !content.includes('catch')) {
      issues.push('Try block without catch');
    }
    
    return {
      valid: issues.length === 0,
      issues: issues,
      hasTests: filename.includes('.test.') || filename.includes('.spec.')
    };
  }

  // Validate services
  async validateServices() {
    console.log('\n🔧 Validating services...\n');
    
    const servicesDir = path.join(__dirname, 'src/services');
    
    try {
      const files = await fs.readdir(servicesDir);
      
      for (const file of files) {
        if (file.endsWith('.js')) {
          const filePath = path.join(servicesDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          
          const validation = this.validateServiceContent(file, content);
          this.results.services.push({
            name: file,
            path: filePath,
            ...validation
          });
          
          if (validation.valid) {
            console.log(`✅ ${file}`);
          } else {
            console.log(`❌ ${file}: ${validation.issues.join(', ')}`);
          }
        }
      }
    } catch (error) {
      console.error('Error reading services:', error.message);
      this.results.errors.push({
        type: 'service_scan_error',
        error: error.message
      });
    }
  }

  // Validate service content
  validateServiceContent(filename, content) {
    const issues = [];
    
    // Check for axios import
    if (!content.includes('import axios') && !content.includes('require(\'axios')) {
      if (content.includes('axios.')) {
        issues.push('Axios used without import');
      }
    }
    
    // Check for base URL configuration
    if (!content.includes('baseURL') && !content.includes('BASE_URL') && !content.includes('API_URL')) {
      issues.push('No base URL configuration found');
    }
    
    // Check for error handling
    if (!content.includes('catch') && !content.includes('.catch')) {
      issues.push('No error handling found');
    }
    
    // Check for auth headers
    if (!content.includes('Authorization') && !content.includes('auth')) {
      if (!filename.includes('auth')) {
        issues.push('No authorization headers found');
      }
    }
    
    // Check for proper exports
    if (!content.includes('export')) {
      issues.push('No exports found');
    }
    
    return {
      valid: issues.length === 0,
      issues: issues,
      endpoints: this.extractEndpoints(content)
    };
  }

  // Extract API endpoints from service
  extractEndpoints(content) {
    const endpoints = [];
    const patterns = [
      /\.get\(['"`]([^'"`]+)['"`]/g,
      /\.post\(['"`]([^'"`]+)['"`]/g,
      /\.put\(['"`]([^'"`]+)['"`]/g,
      /\.delete\(['"`]([^'"`]+)['"`]/g,
      /\.patch\(['"`]([^'"`]+)['"`]/g
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        endpoints.push({
          method: pattern.source.match(/\.(get|post|put|delete|patch)/)[1].toUpperCase(),
          path: match[1]
        });
      }
    }
    
    return endpoints;
  }

  // Validate routes
  async validateRoutes() {
    console.log('\n🛣️  Validating routes...\n');
    
    const appFile = path.join(__dirname, 'src/App.jsx');
    
    try {
      const content = await fs.readFile(appFile, 'utf8');
      
      // Extract routes
      const routePattern = /<Route[^>]+path=['"]([^'"]+)['"]/g;
      let match;
      const routes = [];
      
      while ((match = routePattern.exec(content)) !== null) {
        routes.push(match[1]);
      }
      
      this.results.routes = routes;
      
      console.log('Found routes:');
      routes.forEach(route => console.log(`  - ${route}`));
      
      // Check for protected routes
      if (content.includes('ProtectedRoute') || content.includes('PrivateRoute')) {
        console.log('\n✅ Protected routes implemented');
      } else {
        console.log('\n⚠️  No protected routes found');
      }
      
    } catch (error) {
      console.error('Error reading routes:', error.message);
      this.results.errors.push({
        type: 'route_validation_error',
        error: error.message
      });
    }
  }

  // Validate environment variables
  async validateEnvironment() {
    console.log('\n🔐 Validating environment configuration...\n');
    
    const envExample = path.join(__dirname, '.env.example');
    const envLocal = path.join(__dirname, '.env.local');
    
    try {
      // Check for .env.example
      await fs.access(envExample);
      console.log('✅ .env.example found');
      
      const envContent = await fs.readFile(envExample, 'utf8');
      const requiredVars = [
        'REACT_APP_API_URL',
        'REACT_APP_WEBSOCKET_URL'
      ];
      
      for (const varName of requiredVars) {
        if (envContent.includes(varName)) {
          console.log(`✅ ${varName} defined`);
        } else {
          console.log(`⚠️  ${varName} missing`);
        }
      }
      
    } catch (error) {
      console.log('⚠️  No .env.example file found');
    }
  }

  // Generate validation report
  async generateReport() {
    const reportPath = path.join(__dirname, 'component-validation-report.json');
    
    const summary = {
      totalComponents: this.results.components.length,
      validComponents: this.results.components.filter(c => c.valid).length,
      totalServices: this.results.services.length,
      validServices: this.results.services.filter(s => s.valid).length,
      totalRoutes: this.results.routes.length,
      totalErrors: this.results.errors.length
    };
    
    const report = {
      summary,
      ...this.results,
      recommendations: this.generateRecommendations()
    };
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Validation Summary:');
    console.log('='.repeat(60));
    console.log(`Components: ${summary.validComponents}/${summary.totalComponents} valid`);
    console.log(`Services: ${summary.validServices}/${summary.totalServices} valid`);
    console.log(`Routes: ${summary.totalRoutes} found`);
    console.log(`Errors: ${summary.totalErrors}`);
    console.log('='.repeat(60));
    console.log(`\n📄 Report saved to: ${reportPath}`);
    
    return report;
  }

  // Generate recommendations
  generateRecommendations() {
    const recommendations = [];
    
    // Component recommendations
    const invalidComponents = this.results.components.filter(c => !c.valid);
    if (invalidComponents.length > 0) {
      recommendations.push({
        category: 'Components',
        priority: 'high',
        message: `Fix ${invalidComponents.length} components with validation issues`,
        details: invalidComponents.map(c => `${c.name}: ${c.issues.join(', ')}`)
      });
    }
    
    // Service recommendations
    const invalidServices = this.results.services.filter(s => !s.valid);
    if (invalidServices.length > 0) {
      recommendations.push({
        category: 'Services',
        priority: 'high',
        message: `Fix ${invalidServices.length} services with validation issues`,
        details: invalidServices.map(s => `${s.name}: ${s.issues.join(', ')}`)
      });
    }
    
    // Test recommendations
    const componentsWithoutTests = this.results.components.filter(c => !c.hasTests);
    if (componentsWithoutTests.length > 0) {
      recommendations.push({
        category: 'Testing',
        priority: 'medium',
        message: `Add tests for ${componentsWithoutTests.length} components`,
        details: componentsWithoutTests.map(c => c.name)
      });
    }
    
    // Error handling recommendations
    if (this.results.errors.length > 0) {
      recommendations.push({
        category: 'Infrastructure',
        priority: 'high',
        message: 'Fix infrastructure errors',
        details: this.results.errors.map(e => `${e.type}: ${e.error}`)
      });
    }
    
    return recommendations;
  }

  // Run validation
  async run() {
    console.log('🔍 Starting Component Validation Test\n');
    
    try {
      await this.validateFileStructure();
      await this.validateComponents();
      await this.validateServices();
      await this.validateRoutes();
      await this.validateEnvironment();
      
      const report = await this.generateReport();
      
      // Exit with appropriate code
      const hasErrors = this.results.errors.length > 0 || 
                       this.results.components.some(c => !c.valid) ||
                       this.results.services.some(s => !s.valid);
      
      process.exit(hasErrors ? 1 : 0);
      
    } catch (error) {
      console.error('\n💥 Fatal error:', error);
      process.exit(1);
    }
  }
}

// Run the validator
const validator = new ComponentValidator();
validator.run();