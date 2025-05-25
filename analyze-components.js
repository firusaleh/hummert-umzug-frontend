#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const issues = {
  unusedVars: [],
  missingDependencies: [],
  sensitiveLogging: [],
  hardcodedValues: [],
  noErrorHandling: [],
  unusedImports: []
};

// Patterns to check
const patterns = {
  console_log_sensitive: /console\.(log|error|warn).*\b(token|password|secret|key)\b/gi,
  unused_vars: /Line \d+:\d+:\s*'(\w+)' is defined but never used/g,
  missing_deps: /React Hook \w+ has a missing dependency: '(.+?)'/g,
  hardcoded_urls: /(http|https):\/\/(localhost|127\.0\.0\.1|192\.168\.)[\w\.\:\/]+/g,
  no_catch: /\.then\([^)]*\)(?![\s\S]*\.catch)/g,
  useless_escape: /Unnecessary escape character:/g
};

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(process.cwd(), filePath);
  
  // Check for sensitive logging
  const sensitiveMatches = content.match(patterns.console_log_sensitive);
  if (sensitiveMatches) {
    issues.sensitiveLogging.push({
      file: relativePath,
      matches: sensitiveMatches
    });
  }
  
  // Check for hardcoded URLs
  const urlMatches = content.match(patterns.hardcoded_urls);
  if (urlMatches) {
    issues.hardcodedValues.push({
      file: relativePath,
      matches: urlMatches
    });
  }
  
  // Check for unhandled promises
  const promiseMatches = content.match(patterns.no_catch);
  if (promiseMatches && promiseMatches.length > 0) {
    issues.noErrorHandling.push({
      file: relativePath,
      count: promiseMatches.length
    });
  }
}

function scanDirectory(dir) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (!item.includes('node_modules') && !item.startsWith('.')) {
        scanDirectory(fullPath);
      }
    } else if (item.endsWith('.js') || item.endsWith('.jsx')) {
      analyzeFile(fullPath);
    }
  }
}

// Start scan
console.log('🔍 Analyzing Frontend Components...\n');
scanDirectory('./src');

// Report results
console.log('📊 Analysis Results:\n');

console.log(`🔐 Sensitive Logging Issues: ${issues.sensitiveLogging.length}`);
issues.sensitiveLogging.forEach(issue => {
  console.log(`  - ${issue.file}`);
  issue.matches.forEach(match => console.log(`    ${match}`));
});

console.log(`\n🌐 Hardcoded URLs: ${issues.hardcodedValues.length}`);
issues.hardcodedValues.forEach(issue => {
  console.log(`  - ${issue.file}`);
  issue.matches.forEach(match => console.log(`    ${match}`));
});

console.log(`\n⚠️ Unhandled Promises: ${issues.noErrorHandling.length}`);
issues.noErrorHandling.slice(0, 10).forEach(issue => {
  console.log(`  - ${issue.file}: ${issue.count} instances`);
});

// Save detailed report
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    sensitiveLogging: issues.sensitiveLogging.length,
    hardcodedUrls: issues.hardcodedValues.length,
    unhandledPromises: issues.noErrorHandling.length
  },
  details: issues
};

fs.writeFileSync('frontend-analysis-report.json', JSON.stringify(report, null, 2));
console.log('\n📄 Detailed report saved to frontend-analysis-report.json');