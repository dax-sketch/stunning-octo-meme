#!/usr/bin/env ts-node

/**
 * Test script to debug tier change log creation
 */

import { TierChangeLogModel } from '../src/models/AppwriteTierChangeLog';
import { TIER_CHANGE_REASONS, COMPANY_TIERS } from '../src/config/appwrite';

async function testTierChangeLog() {
  console.log('🧪 Testing Tier Change Log Creation\n');
  
  console.log('Available TIER_CHANGE_REASONS:');
  console.log(TIER_CHANGE_REASONS);
  console.log('\nAvailable COMPANY_TIERS:');
  console.log(COMPANY_TIERS);
  
  try {
    console.log('\n📝 Testing AUTOMATIC tier change log...');
    const automaticLog = await TierChangeLogModel.create({
      companyId: 'test-company-id',
      oldTier: COMPANY_TIERS.TIER_2,
      newTier: COMPANY_TIERS.TIER_1,
      reason: TIER_CHANGE_REASONS.AUTOMATIC,
      notes: 'Test automatic tier change'
    });
    
    console.log('✅ AUTOMATIC log created successfully:', automaticLog.$id);
    
    console.log('\n📝 Testing MANUAL_OVERRIDE tier change log...');
    const manualLog = await TierChangeLogModel.create({
      companyId: 'test-company-id-2',
      oldTier: COMPANY_TIERS.TIER_3,
      newTier: COMPANY_TIERS.TIER_1,
      reason: TIER_CHANGE_REASONS.MANUAL_OVERRIDE,
      changedBy: 'test-user-id',
      notes: 'Test manual tier override'
    });
    
    console.log('✅ MANUAL_OVERRIDE log created successfully:', manualLog.$id);
    
    console.log('\n🎉 All tier change log tests passed!');
    
  } catch (error: any) {
    console.error('❌ Error creating tier change log:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testTierChangeLog().catch(console.error);