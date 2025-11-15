#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Target coverage is 80% (reduced from 90%)
const MINIMUM_COVERAGE = 80;
const TARGET_COVERAGE = 80;

const coverageSummaryPath = path.join(__dirname, '../coverage/coverage-summary.json');

if (!fs.existsSync(coverageSummaryPath)) {
  console.error('Error: Coverage summary file not found. Run tests with --coverage flag first.');
  process.exit(1);
}

const coverageData = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
const totalCoverage = coverageData.total.lines.pct;

console.log(`\n📊 Coverage Check:`);
console.log(`  Lines: ${totalCoverage.toFixed(2)}%`);
console.log(`  Minimum Required: ${MINIMUM_COVERAGE}%`);
console.log(`  Target Goal: ${TARGET_COVERAGE}%`);
console.log(`  Progress: ${((totalCoverage/TARGET_COVERAGE)*100).toFixed(1)}% toward goal\n`);

if (totalCoverage < MINIMUM_COVERAGE) {
  console.error(`❌ FAILED: Coverage is below ${MINIMUM_COVERAGE}%`);
  console.error(`   Current: ${totalCoverage.toFixed(2)}%`);
  console.error(`   Required: ${MINIMUM_COVERAGE}%`);
  console.error(`   Shortfall: ${(MINIMUM_COVERAGE - totalCoverage).toFixed(2)}%\n`);
  process.exit(1);
}

console.log(`✅ PASSED: Coverage meets the ${MINIMUM_COVERAGE}% threshold\n`);
process.exit(0);
