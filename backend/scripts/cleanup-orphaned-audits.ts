import { AuditModel } from '../src/models/AppwriteAudit';
import { CompanyModel } from '../src/models/AppwriteCompany';
import { AuditService } from '../src/services/auditService';

async function cleanupOrphanedAudits() {
  try {
    console.log('🧹 Cleaning up orphaned audits...\n');
    
    // Get all companies
    const companies = await CompanyModel.findMany({}, 100, 0);
    const companyIds = companies.map(c => c.$id);
    console.log(`Found ${companies.length} companies`);
    
    // Get all audits
    const allAudits = await AuditModel.findMany({});
    console.log(`Found ${allAudits.length} total audits`);
    
    // Find orphaned audits
    const orphanedAudits = allAudits.filter(audit => !companyIds.includes(audit.companyId));
    console.log(`Found ${orphanedAudits.length} orphaned audits`);
    
    if (orphanedAudits.length === 0) {
      console.log('✅ No orphaned audits found!');
      return;
    }
    
    // Delete orphaned audits
    const auditService = new AuditService();
    let deletedCount = 0;
    
    for (const audit of orphanedAudits) {
      try {
        await auditService.deleteAudit(audit.$id);
        console.log(`✅ Deleted orphaned audit: ${audit.$id} (company: ${audit.companyId})`);
        deletedCount++;
      } catch (error: any) {
        console.error(`❌ Failed to delete audit ${audit.$id}:`, error.message);
      }
    }
    
    console.log(`\n🎯 Cleanup completed! Deleted ${deletedCount} out of ${orphanedAudits.length} orphaned audits.`);
    
    // Show final statistics
    const finalAudits = await AuditModel.findMany({});
    console.log(`📊 Final audit count: ${finalAudits.length}`);
    
  } catch (error: any) {
    console.error('❌ Error cleaning up orphaned audits:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

cleanupOrphanedAudits().then(() => {
  console.log('\n✨ Cleanup completed!');
  process.exit(0);
});