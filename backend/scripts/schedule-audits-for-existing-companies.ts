import { AuditService } from '../src/services/auditService';

async function scheduleAuditsForExistingCompanies() {
  try {
    console.log('Starting audit scheduling for existing companies...');
    
    const auditService = new AuditService();
    const result = await auditService.updateAuditSchedulesForAllCompanies();
    
    console.log('✅ Audit scheduling completed!');
    console.log(`📊 Results:`);
    console.log(`  - Created: ${result.created} new audits`);
    console.log(`  - Updated: ${result.updated} existing audit schedules`);
    
    if (result.created > 0 || result.updated > 0) {
      console.log('\n🎯 Audit Schedule Summary:');
      console.log('  - Tier 1 (High Ad Spend): Audits every 3 months on Wednesdays');
      console.log('  - Tier 2 (New Companies): Audits every week on Wednesdays');
      console.log('  - Tier 3 (Low Ad Spend): Audits every month on Wednesdays');
      console.log('\n📅 All audits are automatically scheduled for Wednesdays');
    }
    
  } catch (error: any) {
    console.error('❌ Error scheduling audits:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

scheduleAuditsForExistingCompanies().then(() => {
  console.log('\n✨ Script completed successfully!');
  process.exit(0);
});