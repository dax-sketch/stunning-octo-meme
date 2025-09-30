import { NotificationModel } from '../src/models/AppwriteNotification';

async function testWithRealUserId() {
  try {
    console.log('Testing with real user ID from database...');
    
    // Use the actual user ID we found in the previous test
    const realUserId = '68d6ba9bc448a01b063c';
    
    console.log('Calling NotificationModel.findMany with real user ID:', realUserId);
    const notifications = await NotificationModel.findMany(
      { userId: realUserId },
      20,
      0
    );
    
    console.log('✅ Success! Found notifications for real user:', notifications.length);
    if (notifications.length > 0) {
      const firstNotification = notifications[0]!;
      console.log('Sample notification:', {
        id: firstNotification.$id,
        title: firstNotification.title,
        userId: firstNotification.userId,
        type: firstNotification.type,
        isRead: firstNotification.isRead
      });
    }
    
  } catch (error: any) {
    console.error('❌ Error in test with real user ID:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testWithRealUserId().then(() => process.exit(0));