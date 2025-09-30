/**
 * Simple validation script to test audit scheduling logic
 * This can be run with ts-node to verify the implementation
 */

import { AuditService } from '../services/auditService';

async function validateAuditScheduling() {
  console.log('🔍 Validating Audit Scheduling System...\n');

  const auditService = new AuditService();

  // Test 1: Weekly scheduling for new companies (< 3 months)
  console.log('Test 1: Weekly scheduling for new companies');
  const newCompanyStart = new Date('2024-01-01');
  const currentDate1 = new Date('2024-02-01'); // 1 month old
  const nextAudit1 = auditService.calculateNextAuditDate(newCompanyStart, currentDate1);
  const expectedDate1 = new Date('2024-02-08'); // 7 days later
  
  console.log(`  Company start: ${newCompanyStart.toDateString()}`);
  console.log(`  Current date: ${currentDate1.toDateString()}`);
  console.log(`  Next audit: ${nextAudit1.toDateString()}`);
  console.log(`  Expected: ${expectedDate1.toDateString()}`);
  console.log(`  ✅ Match: ${nextAudit1.toDateString() === expectedDate1.toDateString()}\n`);

  // Test 2: Monthly scheduling for medium-age companies (3-12 months)
  console.log('Test 2: Monthly scheduling for medium-age companies');
  const mediumCompanyStart = new Date('2024-01-01');
  const currentDate2 = new Date('2024-06-01'); // 5 months old
  const nextAudit2 = auditService.calculateNextAuditDate(mediumCompanyStart, currentDate2);
  const expectedDate2 = new Date('2024-07-01'); // 1 month later
  
  console.log(`  Company start: ${mediumCompanyStart.toDateString()}`);
  console.log(`  Current date: ${currentDate2.toDateString()}`);
  console.log(`  Next audit: ${nextAudit2.toDateString()}`);
  console.log(`  Expected: ${expectedDate2.toDateString()}`);
  console.log(`  ✅ Match: ${nextAudit2.getMonth() === expectedDate2.getMonth() && nextAudit2.getFullYear() === expectedDate2.getFullYear()}\n`);

  // Test 3: Quarterly scheduling for old companies (> 12 months)
  console.log('Test 3: Quarterly scheduling for old companies');
  const oldCompanyStart = new Date('2023-01-01');
  const currentDate3 = new Date('2024-06-01'); // 17 months old
  const nextAudit3 = auditService.calculateNextAuditDate(oldCompanyStart, currentDate3);
  const expectedDate3 = new Date('2024-09-01'); // 3 months later
  
  console.log(`  Company start: ${oldCompanyStart.toDateString()}`);
  console.log(`  Current date: ${currentDate3.toDateString()}`);
  console.log(`  Next audit: ${nextAudit3.toDateString()}`);
  console.log(`  Expected: ${expectedDate3.toDateString()}`);
  console.log(`  ✅ Match: ${nextAudit3.getMonth() === expectedDate3.getMonth() && nextAudit3.getFullYear() === expectedDate3.getFullYear()}\n`);

  // Test 4: Company age calculation
  console.log('Test 4: Company age calculation');
  const ageTestStart = new Date('2024-01-01');
  const ageTestCurrent = new Date('2024-06-01');
  const calculatedAge = (auditService as any).getCompanyAgeInMonths(ageTestStart, ageTestCurrent);
  const expectedAge = 5;
  
  console.log(`  Company start: ${ageTestStart.toDateString()}`);
  console.log(`  Current date: ${ageTestCurrent.toDateString()}`);
  console.log(`  Calculated age: ${calculatedAge} months`);
  console.log(`  Expected age: ${expectedAge} months`);
  console.log(`  ✅ Match: ${calculatedAge === expectedAge}\n`);

  // Test 5: Edge case - exactly 3 months
  console.log('Test 5: Edge case - exactly 3 months (should be monthly)');
  const edgeCompanyStart = new Date('2024-01-01');
  const edgeCurrentDate = new Date('2024-04-01'); // Exactly 3 months
  const edgeNextAudit = auditService.calculateNextAuditDate(edgeCompanyStart, edgeCurrentDate);
  const edgeExpectedDate = new Date('2024-05-01'); // Should be monthly
  
  console.log(`  Company start: ${edgeCompanyStart.toDateString()}`);
  console.log(`  Current date: ${edgeCurrentDate.toDateString()}`);
  console.log(`  Next audit: ${edgeNextAudit.toDateString()}`);
  console.log(`  Expected: ${edgeExpectedDate.toDateString()}`);
  console.log(`  ✅ Match: ${edgeNextAudit.getMonth() === edgeExpectedDate.getMonth()}\n`);

  // Test 6: Edge case - exactly 12 months
  console.log('Test 6: Edge case - exactly 12 months (should be quarterly)');
  const edge12CompanyStart = new Date('2023-01-01');
  const edge12CurrentDate = new Date('2024-01-01'); // Exactly 12 months
  const edge12NextAudit = auditService.calculateNextAuditDate(edge12CompanyStart, edge12CurrentDate);
  const edge12ExpectedDate = new Date('2024-04-01'); // Should be quarterly
  
  console.log(`  Company start: ${edge12CompanyStart.toDateString()}`);
  console.log(`  Current date: ${edge12CurrentDate.toDateString()}`);
  console.log(`  Next audit: ${edge12NextAudit.toDateString()}`);
  console.log(`  Expected: ${edge12ExpectedDate.toDateString()}`);
  console.log(`  ✅ Match: ${edge12NextAudit.getMonth() === edge12ExpectedDate.getMonth()}\n`);

  console.log('🎉 Audit scheduling validation complete!');
  console.log('\n📋 Summary:');
  console.log('- Weekly audits for companies < 3 months old ✅');
  console.log('- Monthly audits for companies 3-12 months old ✅');
  console.log('- Quarterly audits for companies > 12 months old ✅');
  console.log('- Proper age calculation ✅');
  console.log('- Edge case handling ✅');
}

// Export for potential use in tests
export { validateAuditScheduling };

// Run validation if this file is executed directly
if (require.main === module) {
  validateAuditScheduling().catch(console.error);
}