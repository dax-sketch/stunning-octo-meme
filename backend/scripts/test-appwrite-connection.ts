import { Client, Databases, Account, ID } from 'appwrite';
import * as dotenv from 'dotenv';

dotenv.config();

async function testAppwriteConnection() {
  try {
    console.log('🧪 Testing Appwrite connection...');
    console.log('📋 Configuration:');
    console.log('   Endpoint:', process.env.APPWRITE_ENDPOINT);
    console.log('   Project ID:', process.env.APPWRITE_PROJECT_ID);
    console.log('   Database ID:', process.env.APPWRITE_DATABASE_ID);
    console.log('   API Key:', process.env.APPWRITE_API_KEY ? '✅ Set' : '❌ Missing');
    console.log('');

    // Initialize client for server-side usage
    const client = new Client();
    client
      .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
      .setProject(process.env.APPWRITE_PROJECT_ID || '');

    // For server-side operations, we need to set the API key
    if (process.env.APPWRITE_API_KEY) {
      // In Appwrite v13, server-side authentication uses headers
      client.headers['X-Appwrite-Key'] = process.env.APPWRITE_API_KEY;
    }

    const databases = new Databases(client);
    const databaseId = process.env.APPWRITE_DATABASE_ID || 'client-management';

    console.log('🔍 Testing database access...');

    // Test collections by trying to list documents
    const requiredCollections = ['users', 'companies', 'notes', 'audits', 'notifications', 'tier_change_logs'];
    
    let successCount = 0;
    for (const collectionId of requiredCollections) {
      try {
        const response = await databases.listDocuments(databaseId, collectionId);
        console.log(`✅ Collection '${collectionId}': ${response.total} documents`);
        successCount++;
      } catch (error: any) {
        if (error.code === 404) {
          console.log(`❌ Collection '${collectionId}' not found`);
        } else if (error.code === 401) {
          console.log(`🔐 Collection '${collectionId}': Authorization error`);
        } else {
          console.log(`⚠️ Collection '${collectionId}': ${error.message}`);
        }
      }
    }
    
    if (successCount === requiredCollections.length) {
      console.log('\n🎉 All collections are accessible! Appwrite setup is complete.');
    } else if (successCount > 0) {
      console.log(`\n⚠️ ${successCount}/${requiredCollections.length} collections are accessible.`);
      console.log('Some collections may be missing or have permission issues.');
    } else {
      console.log('\n❌ No collections are accessible.');
      console.log('Please check your database setup and API key permissions.');
    }

  } catch (error: any) {
    console.error('❌ Connection test failed:', error.message || error);
    
    if (error.code === 401) {
      console.log('\n🔧 Authorization Error Solutions:');
      console.log('1. Go to https://cloud.appwrite.io');
      console.log('2. Navigate to your project → Settings → API Keys');
      console.log('3. Create a new API key with these scopes:');
      console.log('   - databases.read, databases.write');
      console.log('   - collections.read, collections.write');
      console.log('   - documents.read, documents.write');
      console.log('4. Update your .env file with the new API key');
    } else if (error.code === 404) {
      console.log('\n🔧 Not Found Error:');
      console.log('1. Verify your Project ID is correct');
      console.log('2. Ensure the database exists in your Appwrite project');
      console.log('3. Check that collections are created properly');
    } else {
      console.log('\n🔧 General troubleshooting:');
      console.log('1. Check your internet connection');
      console.log('2. Verify all environment variables are set correctly');
      console.log('3. Ensure Appwrite endpoint is accessible');
    }
  }
}

testAppwriteConnection();