import { databases, COLLECTIONS } from '../src/config/appwrite';

const databaseId = process.env.APPWRITE_DATABASE_ID || 'client-management';

async function testNotificationsCollection() {
  try {
    console.log('Testing notifications collection...');
    const response = await databases.listDocuments(databaseId, COLLECTIONS.NOTIFICATIONS, []);
    console.log('✅ Notifications collection exists. Document count:', response.total);
    return true;
  } catch (error: any) {
    console.error('❌ Error accessing notifications collection:', error.message);
    if (error.code === 404) {
      console.log('Collection does not exist. Need to create it.');
    }
    return false;
  }
}

testNotificationsCollection().then((exists) => {
  if (!exists) {
    console.log('Please run the setup script to create the notifications collection.');
  }
  process.exit(exists ? 0 : 1);
});