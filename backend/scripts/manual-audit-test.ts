import { AuditService } from '../src/services/auditService';
import { CompanyModel } from '../src/models/AppwriteCompany';
import { UserModel } from '../src/models/AppwriteUser';
import { AuditModel } from '../src/models/AppwriteAudit';

async function manualAuditTest() {
  try {
    console.log('🔍 Manual audit test starting...');
    
    // First, let's see what companies exist
    console.log('\n1. Checking existing companies...');
    const companies = await CompanyModel.findMany({}, 10, 0);
    console.log(`Found ${companies.length} companies:`);
    companies.forEach((company, index) => {
      console.log(`  ${index + 1}. ${company.name} (${company.tier}) - ID: ${company.$id}`);
    });
    
    if (companies.length === 0) {
      console.log('❌ No companies found. Please create a company first.');
      return;
    }
    
    // Check existing audits
    console.log('\n2. Checking existing audits...');
    const existingAudits = await AuditModel.findMany({});
    console.log(`Found ${existingAudits.length} existing audits:`);
    existingAudits.forEach((audit, index) => {
      console.log(`  ${index + 1}. Company: ${audit.companyId}, Scheduled: ${audit.scheduledDate}, Status: ${audit.status}`);
    });
    
    // Get users
    console.log('\n3. Checking users...');
    const users = await UserModel.findMany({ limit: 5 });
    console.log(`Found ${users.users.length} users:`);
    users.users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.username} (${user.role}) - ID: ${user.$id}`);
    });
    
    if (users.users.length === 0) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }
    
    // Create audit service
    const auditService = new AuditService();
    
    // Try to create audits for all companies that don't have them
    console.log('\n4. Creating audits for companies without them...');
    for (const company of companies) {
      const companyAudits = await AuditModel.findMany({ companyId: company.$id });
      if (companyAudits.length === 0) {
        console.log(`📅 Creating audit for ${company.name}...`);
        try {
          const audit = await auditService.scheduleAuditForNewCompany(company.$id, users.users[0].$id);
          console.log(`✅ Created audit for ${company.name} on ${audit.scheduledDate}`);
        } catch (error: any) {
          console.error(`❌ Failed to create audit for ${company.name}:`, error.message);
        }
      } else {
        console.log(`⏭️  ${company.name} already has ${companyAudits.length} audit(s)`);
      }
    }
    
    // Test upcoming audits
    console.log('\n5. Testing upcoming audits...');
    const upcomingAudits = await auditService.getUpcomingAudits(30);
    console.log(`Found ${upcomingAudits.length} upcoming audits:`);
    upcomingAudits.forEach((audit, index) => {
      console.log(`  ${index + 1}. ${audit.companyName} - ${audit.scheduledDate} (${audit.assignedToUsername || 'Unknown User'})`);
    });
    
    // Test audit statistics
    console.log('\n6. Testing audit statistics...');
    const stats = await auditService.getAuditStatistics();
    console.log('Audit statistics:', stats);
    
  } catch (error: any) {
    console.error('❌ Error in manual audit test:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

manualAuditTest().then(() => {
  console.log('\n✨ Manual audit test completed!');
  process.exit(0);
});