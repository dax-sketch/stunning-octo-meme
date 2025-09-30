#!/usr/bin/env ts-node

/**
 * Test script to check notifications functionality
 */

import { NotificationModel } from '../src/models/AppwriteNotification';
import { NOTIFICATION_TYPES } from '../src/config/appwrite';

async function testNotifications() {
  console.log('🔔 Testing Notifications Functionality\n');

  try {
    console.log('📋 Fetching all notifications...');
    const allNotifications = await NotificationModel.findMany({}, 10);
    console.log(`Found ${allNotifications.length} notifications`);
    
    if (allNotifications.length > 0) {
      console.log('\nFirst few notifications:');
      allNotifications.slice(0, 3).forEach((notification, index) => {
        console.log(`${index + 1}. ${notification.title} (${notification.type}) - Read: ${notification.isRead}`);
      });
    } else {
      console.log('No notifications found. Creating a test notification...');
      
      // Create a test notification
      const testNotification = await NotificationModel.create({
        type: NOTIFICATION_TYPES.COMPANY_MILESTONE,
        title: 'Test Notification',
        message: 'This is a test notification to verify the system is working',
        scheduledFor: new Date(),
        userId: 'test-user-id',
      });
      
      console.log('✅ Test notification created:', testNotification.$id);
    }

    console.log('\n📊 Testing notification queries...');
    
    // Test unread notifications
    const unreadNotifications = await NotificationModel.findMany({ isRead: false }, 5);
    console.log(`Found ${unreadNotifications.length} unread notifications`);
    
    // Test read notifications
    const readNotifications = await NotificationModel.findMany({ isRead: true }, 5);
    console.log(`Found ${readNotifications.length} read notifications`);
    
    console.log('\n🎉 Notification tests completed successfully!');
    
  } catch (error: any) {
    console.error('❌ Error testing notifications:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testNotifications().catch(console.error);