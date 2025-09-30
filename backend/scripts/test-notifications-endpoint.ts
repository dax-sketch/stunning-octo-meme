import { NotificationModel } from '../src/models/AppwriteNotification';

async function testGetAllNotifications() {
  try {
    console.log('Testing getAllNotifications method...');
    
    // Test with a sample user ID (you can replace this with a real user ID from your database)
    const testUserId = 'test-user-id';
    
    console.log('Calling NotificationModel.findMany...');
    const notifications = await NotificationModel.findMany(
      { userId: testUserId },
      20,
      0
    );
    
    console.log('✅ Success! Found notifications:', notifications.length);
    console.log('Sample notification:', notifications[0] || 'No notifications found');
    
  } catch (error: any) {
    console.error('❌ Error in getAllNotifications test:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Also test without userId filter to see if there are any notifications at all
async function testAllNotifications() {
  try {
    console.log('\nTesting all notifications (no filter)...');
    
    const notifications = await NotificationModel.findMany({}, 20, 0);
    
    console.log('✅ Success! Total notifications found:', notifications.length);
    if (notifications.length > 0) {
      const firstNotification = notifications[0]!;
      console.log('Sample notification:', {
        id: firstNotification.$id,
        title: firstNotification.title,
        userId: firstNotification.userId,
        type: firstNotification.type
      });
    }
    
  } catch (error: any) {
    console.error('❌ Error in test all notifications:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

async function runTests() {
  await testAllNotifications();
  await testGetAllNotifications();
  process.exit(0);
}

runTests();