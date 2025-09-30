#!/usr/bin/env ts-node

/**
 * Test script for the new tier calculation logic
 */

import { CompanyModel } from '../src/models/AppwriteCompany';
import { COMPANY_TIERS } from '../src/config/appwrite';

// Test cases for the new tier logic
const testCases = [
  // Tier 2: New companies (< 3 months) regardless of ad spend
  {
    name: 'New company with high ad spend',
    startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 2 months ago
    adSpend: 5000,
    expectedTier: COMPANY_TIERS.TIER_2,
    description: 'Should be Tier 2 because company is < 3 months old'
  },
  {
    name: 'New company with low ad spend',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
    adSpend: 1000,
    expectedTier: COMPANY_TIERS.TIER_2,
    description: 'Should be Tier 2 because company is < 3 months old'
  },
  
  // Tier 1: Ad spend > $2500 AND older than 3 months
  {
    name: 'Established company with high ad spend',
    startDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 4 months ago
    adSpend: 3000,
    expectedTier: COMPANY_TIERS.TIER_1,
    description: 'Should be Tier 1 because company is > 3 months old and ad spend > $2500'
  },
  {
    name: 'Old company with very high ad spend',
    startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
    adSpend: 10000,
    expectedTier: COMPANY_TIERS.TIER_1,
    description: 'Should be Tier 1 because company is > 3 months old and ad spend > $2500'
  },
  
  // Tier 3: Older than 3 months AND ad spend ≤ $2500
  {
    name: 'Established company with low ad spend',
    startDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 4 months ago
    adSpend: 2000,
    expectedTier: COMPANY_TIERS.TIER_3,
    description: 'Should be Tier 3 because company is > 3 months old and ad spend ≤ $2500'
  },
  {
    name: 'Old company with exactly $2500 ad spend',
    startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
    adSpend: 2500,
    expectedTier: COMPANY_TIERS.TIER_3,
    description: 'Should be Tier 3 because company is > 3 months old and ad spend = $2500 (not > $2500)'
  },
  {
    name: 'Old company with zero ad spend',
    startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months ago
    adSpend: 0,
    expectedTier: COMPANY_TIERS.TIER_3,
    description: 'Should be Tier 3 because company is > 3 months old and ad spend ≤ $2500'
  },
  
  // Edge cases
  {
    name: 'Company exactly 3 months old with high ad spend',
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Exactly 3 months ago
    adSpend: 3000,
    expectedTier: COMPANY_TIERS.TIER_1,
    description: 'Should be Tier 1 because company is ≥ 3 months old and ad spend > $2500'
  },
  {
    name: 'Company exactly 3 months old with low ad spend',
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Exactly 3 months ago
    adSpend: 2000,
    expectedTier: COMPANY_TIERS.TIER_3,
    description: 'Should be Tier 3 because company is ≥ 3 months old and ad spend ≤ $2500'
  }
];

function runTests() {
  console.log('🧪 Testing New Tier Calculation Logic\n');
  console.log('New Rules:');
  console.log('- Tier 1: Ad spend > $2500 AND older than 3 months');
  console.log('- Tier 2: Younger than 3 months (regardless of ad spend)');
  console.log('- Tier 3: Older than 3 months AND ad spend ≤ $2500\n');
  
  let passed = 0;
  let failed = 0;
  
  testCases.forEach((testCase, index) => {
    const actualTier = CompanyModel.calculateTier(testCase.startDate, testCase.adSpend);
    const isCorrect = actualTier === testCase.expectedTier;
    
    const ageInMonths = (Date.now() - testCase.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    console.log(`Test ${index + 1}: ${testCase.name}`);
    console.log(`  Age: ${ageInMonths.toFixed(1)} months`);
    console.log(`  Ad Spend: $${testCase.adSpend.toLocaleString()}`);
    console.log(`  Expected: ${testCase.expectedTier}`);
    console.log(`  Actual: ${actualTier}`);
    console.log(`  Result: ${isCorrect ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Description: ${testCase.description}\n`);
    
    if (isCorrect) {
      passed++;
    } else {
      failed++;
    }
  });
  
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! The tier calculation logic is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Please review the tier calculation logic.');
  }
}

// Run the tests
runTests();