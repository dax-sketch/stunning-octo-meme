import { AuditService } from '../src/services/auditService';
import { AuditModel } from '../src/models/AppwriteAudit';
import { CompanyModel } from '../src/models/AppwriteCompany';
import { UserModel } from '../src/models/AppwriteUser';

async function debugAudits() {
  try {
    console.log('🔍 Debugging audit system...\n');
    
    // 1. Check existing companies
    console.log('1. Checking companies...');
    const companies = await CompanyModel.findMany({}, 10, 0);
    console.log(`Found ${companies.length} companies:`);
    companies.forEach((company, index) => {
      console.log(`  ${index + 1}. ${company.name} (${company.tier}) - ID: ${company.$id}`);
    });
    
    // 2. Check all audits in database
    console.log('\n2. Checking all audits...');
    const allAudits = await AuditModel.findMany({});
    console.log(`Found ${allAudits.length} total audits:`);
    allAudits.forEach((audit, index) => {
      const scheduledDate = new Date(audit.scheduledDate);
      const isUpcoming = scheduledDate > new Date();
      console.log(`  ${index + 1}. Company: ${audit.companyId}, Scheduled: ${audit.scheduledDate} (${isUpcoming ? 'UPCOMING' : 'PAST'}), Status: ${audit.status}`);
    });
    
    // 3. Test audit service methods
    console.log('\n3. Testing AuditService methods...');
    const auditService = new AuditService();
    
    // Test upcoming audits
    console.log('\n3a. Testing getUpcomingAudits...');
    const upcomingAudits = await auditService.getUpcomingAudits(30);
    console.log(`Found ${upcomingAudits.length} upcoming audits (next 30 days):`);
    upcomingAudits.forEach((audit, index) => {
      console.log(`  ${index + 1}. ${audit.companyName} - ${audit.scheduledDate} (${audit.assignedToUsername || 'Unknown User'})`);
    });
    
    // Test audit statistics
    console.log('\n3b. Testing getAuditStatistics...');
    const stats = await auditService.getAuditStatistics();
    console.log('Audit statistics:', stats);
    
    // 4. Check for orphaned audits (audits for deleted companies)
    console.log('\n4. Checking for orphaned audits...');
    const companyIds = companies.map(c => c.$id);
    const orphanedAudits = allAudits.filter(audit => !companyIds.includes(audit.companyId));
    console.log(`Found ${orphanedAudits.length} orphaned audits:`);
    orphanedAudits.forEach((audit, index) => {
      console.log(`  ${index + 1}. Audit ID: ${audit.$id}, Company ID: ${audit.companyId} (COMPANY NOT FOUND)`);
    });
    
    // 5. Clean up orphaned audits
    if (orphanedAudits.length > 0) {
      console.log('\n5. Cleaning up orphaned audits...');
      for (const audit of orphanedAudits) {
        try {
          await auditService.deleteAudit(audit.$id);
          console.log(`✅ Deleted orphaned audit: ${audit.$id}`);
        } catch (error: any) {
          console.error(`❌ Failed to delete audit ${audit.$id}:`, error.message);
        }
      }
    }
    
    // 6. Create audits for companies that don't have any
    console.log('\n6. Creating missing audits...');
    const users = await UserModel.findMany({ limit: 1 });
    if (users.users.length === 0) {
      console.log('❌ No users found to assign audits to');
      return;
    }
    
    const assigneeId = users.users[0].$id;
    
    for (const company of companies) {
      const companyAudits = await AuditModel.findMany({ companyId: company.$id });
      if (companyAudits.length === 0) {
        console.log(`📅 Creating audit for ${company.name}...`);
        try {
          const audit = await auditService.scheduleAuditForNewCompany(company.$id, assigneeId);
          console.log(`✅ Created audit for ${company.name} on ${audit.scheduledDate}`);
        } catch (error: any) {
          console.error(`❌ Failed to create audit for ${company.name}:`, error.message);
        }
      } else {
        console.log(`⏭️  ${company.name} already has ${companyAudits.length} audit(s)`);
      }
    }
    
    // 7. Final check of upcoming audits
    console.log('\n7. Final check of upcoming audits...');
    const finalUpcomingAudits = await auditService.getUpcomingAudits(30);
    console.log(`Final count: ${finalUpcomingAudits.length} upcoming audits`);
    finalUpcomingAudits.forEach((audit, index) => {
      console.log(`  ${index + 1}. ${audit.companyName} - ${audit.scheduledDate} (${audit.assignedToUsername || 'Unknown User'})`);
    });
    
  } catch (error: any) {
    console.error('❌ Error in audit debugging:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

debugAudits().then(() => {
  console.log('\n✨ Audit debugging completed!');
  process.exit(0);
});