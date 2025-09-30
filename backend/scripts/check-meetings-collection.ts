import { databases, COLLECTIONS } from '../src/config/appwrite';

const databaseId = process.env.APPWRITE_DATABASE_ID || 'client-management';

async function checkMeetingsCollection() {
  try {
    console.log('🔍 Checking meetings collection...');
    
    // Try to list documents in the meetings collection
    const response = await databases.listDocuments(databaseId, COLLECTIONS.MEETINGS, []);
    console.log('✅ Meetings collection exists!');
    console.log(`Found ${response.total} meetings in the collection`);
    
    if (response.documents.length > 0) {
      console.log('\nMeetings found:');
      response.documents.forEach((meeting, index) => {
        console.log(`${index + 1}. Company: ${meeting.companyId}, Scheduled: ${meeting.scheduledDate}`);
      });
    } else {
      console.log('No meetings found in the collection');
    }
    
  } catch (error: any) {
    if (error.code === 404) {
      console.log('❌ Meetings collection does not exist!');
      console.log('Please create the meetings collection in Appwrite Console following the setup guide.');
    } else {
      console.error('❌ Error checking meetings collection:', error.message);
    }
  }
}

checkMeetingsCollection().then(() => process.exit(0));