import { NotificationModel } from '../src/models/AppwriteNotification';
import { UserModel } from '../src/models/AppwriteUser';

async function createTestNotifications() {
  try {
    console.log('Finding users in the database...');
    
    // Get all users to see what user IDs we have
    const users = await UserModel.findMany({ limit: 10 });
    console.log('Found users:', users.users.map(u => ({ id: u.$id, username: u.username, email: u.email })));
    
    if (users.users.length === 0) {
      console.log('No users found. Please create a user first.');
      return;
    }
    
    // Use the first user
    const testUser = users.users[0];
    console.log('Creating test notifications for user:', testUser.username, 'ID:', testUser.$id);
    
    // Create a few test notifications
    const testNotifications = [
      {
        type: 'MEETING_REMINDER' as const,
        title: 'Meeting Reminder',
        message: 'You have a meeting scheduled for tomorrow at 2 PM',
        scheduledFor: new Date(),
        userId: testUser.$id
      },
      {
        type: 'AUDIT_DUE' as const,
        title: 'Audit Due Soon',
        message: 'The quarterly audit is due in 3 days',
        scheduledFor: new Date(),
        userId: testUser.$id
      },
      {
        type: 'COMPANY_MILESTONE' as const,
        title: 'Company Milestone',
        message: 'Congratulations! Your company has reached a new milestone',
        scheduledFor: new Date(),
        userId: testUser.$id
      }
    ];
    
    for (const notificationData of testNotifications) {
      try {
        const notification = await NotificationModel.create(notificationData);
        console.log('✅ Created notification:', notification.title);
      } catch (error: any) {
        console.error('❌ Failed to create notification:', notificationData.title, error.message);
      }
    }
    
    console.log('Test notifications creation completed!');
    
  } catch (error: any) {
    console.error('❌ Error creating test notifications:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

createTestNotifications().then(() => process.exit(0));