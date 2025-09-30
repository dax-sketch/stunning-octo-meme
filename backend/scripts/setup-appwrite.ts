import * as dotenv from 'dotenv';

dotenv.config();

async function setupAppwriteDatabase() {
  console.log('🚀 Appwrite Database Setup Guide');
  console.log('=====================================\n');

  // Check environment variables
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const projectId = process.env.APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const databaseId = process.env.APPWRITE_DATABASE_ID || 'client-management';

  console.log('📋 Environment Configuration:');
  console.log(`   Endpoint: ${endpoint || '❌ Not set'}`);
  console.log(`   Project ID: ${projectId || '❌ Not set'}`);
  console.log(`   API Key: ${apiKey ? '✅ Set' : '❌ Not set'}`);
  console.log(`   Database ID: ${databaseId}\n`);

  if (!endpoint || !projectId) {
    console.log('❌ Missing required environment variables!');
    console.log('\n🔧 Setup Steps:');
    console.log('1. Go to https://cloud.appwrite.io');
    console.log('2. Create a new project or select existing one');
    console.log('3. Copy Project ID from project settings');
    console.log('4. Create an API Key with database permissions');
    console.log('5. Update your .env file with these values:');
    console.log('');
    console.log('   APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1');
    console.log('   APPWRITE_PROJECT_ID=your_project_id_here');
    console.log('   APPWRITE_API_KEY=your_api_key_here');
    console.log('   APPWRITE_DATABASE_ID=client-management');
    console.log('');
    console.log('6. Run this script again after updating .env');
    return;
  }

  console.log('✅ Environment variables configured');
  console.log('\n📋 Manual Database Setup Required:');
  console.log('Since Appwrite collections must be created through the Console or CLI,');
  console.log('please follow these steps to set up your database:\n');
  
  console.log('🔗 Go to: https://cloud.appwrite.io');
  console.log('📂 Navigate to: Databases');
  console.log('➕ Create database with ID: client-management');
  console.log('📝 Create the following collections:\n');
  
  showCollectionInstructions();
  
  console.log('\n📖 For detailed setup instructions with screenshots,');
  console.log('   see: instructions/04-APPWRITE-SETUP.md');
  
  console.log('\n🎉 After creating the collections, your Appwrite database will be ready!');
}

function showCollectionInstructions() {
  console.log('📋 Required Collections and Attributes:');
  
  console.log('\n1. Collection ID: users');
  console.log('   Attributes:');
  console.log('   - username (String, 255, Required)');
  console.log('   - email (String, 255, Required)');
  console.log('   - phoneNumber (String, 20, Required)');
  console.log('   - password (String, 255, Required)');
  console.log('   - role (Enum: CEO,MANAGER,TEAM_MEMBER, Required, Default: TEAM_MEMBER)');
  console.log('   - emailNotifications (Boolean, Required, Default: true)');
  console.log('   - smsNotifications (Boolean, Required, Default: true)');
  console.log('   - meetingReminders (Boolean, Required, Default: true)');
  console.log('   - auditReminders (Boolean, Required, Default: true)');
  console.log('   - createdAt (DateTime, Required)');
  console.log('   - updatedAt (DateTime, Required)');
  
  console.log('\n2. Collection ID: companies');
  console.log('   Attributes:');
  console.log('   - name (String, 255, Required)');
  console.log('   - startDate (DateTime, Required)');
  console.log('   - phoneNumber (String, 20, Required)');
  console.log('   - email (String, 255, Required)');
  console.log('   - website (String, 255, Optional)');
  console.log('   - tier (Enum: TIER_1,TIER_2,TIER_3, Required, Default: TIER_2)');
  console.log('   - adSpend (Float, Required, Default: 0)');
  console.log('   - lastPaymentDate (DateTime, Optional)');
  console.log('   - lastPaymentAmount (Float, Optional)');
  console.log('   - lastMeetingDate (DateTime, Optional)');
  console.log('   - lastMeetingAttendees (String, 1000, Optional, Default: "[]")');
  console.log('   - lastMeetingDuration (Integer, Optional)');
  console.log('   - createdBy (String, 36, Required)');
  console.log('   - createdAt (DateTime, Required)');
  console.log('   - updatedAt (DateTime, Required)');
  
  console.log('\n3. Collection ID: notes');
  console.log('   Attributes:');
  console.log('   - content (String, 5000, Required)');
  console.log('   - companyId (String, 36, Required)');
  console.log('   - userId (String, 36, Required)');
  console.log('   - createdAt (DateTime, Required)');
  console.log('   - updatedAt (DateTime, Required)');
  
  console.log('\n4. Collection ID: audits');
  console.log('   Attributes:');
  console.log('   - scheduledDate (DateTime, Required)');
  console.log('   - completedDate (DateTime, Optional)');
  console.log('   - status (Enum: SCHEDULED,COMPLETED,OVERDUE, Required, Default: SCHEDULED)');
  console.log('   - notes (String, 2000, Optional)');
  console.log('   - companyId (String, 36, Required)');
  console.log('   - assignedTo (String, 36, Required)');
  console.log('   - createdAt (DateTime, Required)');
  console.log('   - updatedAt (DateTime, Required)');
  
  console.log('\n5. Collection ID: notifications');
  console.log('   Attributes:');
  console.log('   - type (Enum: MEETING_REMINDER,AUDIT_DUE,COMPANY_MILESTONE, Required)');
  console.log('   - title (String, 255, Required)');
  console.log('   - message (String, 1000, Required)');
  console.log('   - isRead (Boolean, Required, Default: false)');
  console.log('   - scheduledFor (DateTime, Required)');
  console.log('   - sentAt (DateTime, Optional)');
  console.log('   - userId (String, 36, Required)');
  console.log('   - relatedCompanyId (String, 36, Optional)');
  console.log('   - createdAt (DateTime, Required)');
  
  console.log('\n6. Collection ID: tier_change_logs');
  console.log('   Attributes:');
  console.log('   - oldTier (Enum: TIER_1,TIER_2,TIER_3, Required)');
  console.log('   - newTier (Enum: TIER_1,TIER_2,TIER_3, Required)');
  console.log('   - reason (Enum: AUTOMATIC,MANUAL_OVERRIDE, Required)');
  console.log('   - notes (String, 1000, Optional)');
  console.log('   - companyId (String, 36, Required)');
  console.log('   - changedBy (String, 36, Optional)');
  console.log('   - createdAt (DateTime, Required)');
  
  console.log('\n📖 For detailed setup instructions, see: instructions/04-APPWRITE-SETUP.md');
}

// Run the setup
setupAppwriteDatabase();