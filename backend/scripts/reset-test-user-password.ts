import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { UserModel } from '../src/models/AppwriteUser';
import { databases } from '../src/config/appwrite';

dotenv.config();

async function resetTestUserPassword() {
  try {
    console.log('🔄 Resetting test user password...');
    
    const username = 'testuser';
    const newPassword = 'password123';
    
    // Find the user
    const user = await UserModel.findByUsername(username);
    if (!user) {
      console.log('❌ Test user not found!');
      console.log('Run the create-test-user script first.');
      return;
    }

    console.log(`✅ Found user: ${user.username} (${user.email})`);
    console.log(`📋 User ID: ${user.$id}`);
    
    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    console.log('🔐 Hashed password created, updating in Appwrite...');
    
    // Update directly using databases API
    const databaseId = process.env.APPWRITE_DATABASE_ID || 'client-management';
    const collectionId = 'users';
    
    const updatedUser = await databases.updateDocument(
      databaseId,
      collectionId,
      user.$id,
      {
        password: hashedPassword
      }
    );

    console.log('✅ Password reset successfully!');
    console.log('📋 Updated login credentials:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${newPassword}`);
    console.log('');
    console.log('🧪 You can now test login with these credentials.');
    
  } catch (error: any) {
    console.error('❌ Failed to reset password:', error.message || error);
    console.error('Error details:', error);
  }
}

resetTestUserPassword();