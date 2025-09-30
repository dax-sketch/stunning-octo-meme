import { AuditModel } from '../src/models/AppwriteAudit';
import { CompanyModel } from '../src/models/AppwriteCompany';

async function quickCleanupAudits() {
  try {
    console.log('🧹 Quick cleanup of orphaned audits...');
    
    // Get all companies
    const companies = await CompanyModel.findMany({}, 100, 0);
    const companyIds = companies.map(c => c.$id);
    console.log(`Found ${companies.length} companies`);
    
    // Get all audits
    const allAudits = await AuditModel.findMany({});
    console.log(`Found ${allAudits.length} total audits`);
    
    // Find and delete orphaned audits
    const orphanedAudits = allAudits.filter(audit => !companyIds.includes(audit.companyId));
    console.log(`Found ${orphanedAudits.length} orphaned audits to delete`);
    
    for (const audit of orphanedAudits) {
      try {
        await AuditModel.delete(audit.$id);
        console.log(`✅ Deleted orphaned audit: ${audit.$id}`);
      } catch (error: any) {
        console.error(`❌ Failed to delete audit ${audit.$id}:`, error.message);
      }
    }
    
    const finalAudits = await AuditModel.findMany({});
    console.log(`✅ Cleanup complete! Final audit count: ${finalAudits.length}`);
    
  } catch (error: any) {
    console.error('❌ Error in cleanup:', error.message);
  }
}

quickCleanupAudits().then(() => process.exit(0));