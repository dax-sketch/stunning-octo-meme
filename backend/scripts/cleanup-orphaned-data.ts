#!/usr/bin/env tsx

/**
 * Cleanup script to remove orphaned meetings and audits
 * Run this script to clean up meetings and audits that reference deleted companies
 */

import { MeetingService } from '../src/services/meetingService';
import { AuditService } from '../src/services/auditService';

async function cleanupOrphanedData() {
  console.log('🧹 Starting cleanup of orphaned data...');
  
  try {
    const meetingService = new MeetingService();
    const auditService = new AuditService();

    // Clean up orphaned meetings
    console.log('\n📅 Cleaning up orphaned meetings...');
    const meetingCleanup = await meetingService.cleanupOrphanedMeetings();
    console.log(`✅ Deleted ${meetingCleanup.deletedCount} orphaned meetings`);
    if (meetingCleanup.deletedMeetingIds.length > 0) {
      console.log('   Deleted meeting IDs:', meetingCleanup.deletedMeetingIds);
    }

    // Clean up orphaned audits
    console.log('\n📋 Cleaning up orphaned audits...');
    const auditCleanup = await auditService.cleanupOrphanedAudits();
    console.log(`✅ Deleted ${auditCleanup.deletedCount} orphaned audits`);
    if (auditCleanup.deletedAuditIds.length > 0) {
      console.log('   Deleted audit IDs:', auditCleanup.deletedAuditIds);
    }

    // Clean up orphaned notifications
    console.log('\n🔔 Cleaning up orphaned notifications...');
    const notificationCleanup = await auditService.cleanupOrphanedNotifications();
    console.log(`✅ Deleted ${notificationCleanup.deletedCount} orphaned notifications`);
    if (notificationCleanup.deletedNotificationIds.length > 0) {
      console.log('   Deleted notification IDs:', notificationCleanup.deletedNotificationIds);
    }

    console.log('\n🎉 Cleanup completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Meetings cleaned: ${meetingCleanup.deletedCount}`);
    console.log(`   - Audits cleaned: ${auditCleanup.deletedCount}`);
    console.log(`   - Notifications cleaned: ${notificationCleanup.deletedCount}`);
    console.log(`   - Total items cleaned: ${meetingCleanup.deletedCount + auditCleanup.deletedCount + notificationCleanup.deletedCount}`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
  cleanupOrphanedData()
    .then(() => {
      console.log('\n✅ Cleanup script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Cleanup script failed:', error);
      process.exit(1);
    });
}

export { cleanupOrphanedData };