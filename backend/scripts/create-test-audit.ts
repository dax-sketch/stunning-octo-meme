import { AuditService } from '../src/services/auditService';
import { CompanyModel } from '../src/models/AppwriteCompany';
import { UserModel } from '../src/models/AppwriteUser';

async function createTestAudit() {
  try {
    console.log('Creating test audit...');
    
    // Get the first company
    const companies = await CompanyModel.findMany({}, 1, 0);
    if (companies.length === 0) {
      console.log('❌ No companies found. Please create a company first.');
      return;
    }
    
    const company = companies[0];
    console.log('✅ Found company:', company.name, 'Tier:', company.tier);
    
    // Get the first user
    const users = await UserModel.findMany({ limit: 1 });
    if (users.users.length === 0) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }
    
    const user = users.users[0];
    console.log('✅ Found user:', user.username);
    
    // Create audit service and schedule audit
    const auditService = new AuditService();
    
    console.log('📅 Scheduling audit for company...');
    const audit = await auditService.scheduleAuditForNewCompany(company.$id, user.$id);
    
    console.log('✅ Audit created successfully!');
    console.log('Audit details:', {
      id: audit.$id,
      companyId: audit.companyId,
      scheduledDate: audit.scheduledDate,
      assignedTo: audit.assignedTo,
      notes: audit.notes
    });
    
    // Test getting upcoming audits
    console.log('\n📋 Testing upcoming audits...');
    const upcomingAudits = await auditService.getUpcomingAudits(30); // Next 30 days
    console.log('Upcoming audits found:', upcomingAudits.length);
    
    upcomingAudits.forEach((audit, index) => {
      console.log(`${index + 1}. ${audit.companyName} - ${audit.scheduledDate} (${audit.assignedToUsername})`);
    });
    
    // Test audit statistics
    console.log('\n📊 Testing audit statistics...');
    const stats = await auditService.getAuditStatistics();
    console.log('Audit statistics:', stats);
    
  } catch (error: any) {
    console.error('❌ Error creating test audit:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

createTestAudit().then(() => {
  console.log('\n✨ Test completed!');
  process.exit(0);
});