import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { UserModel } from '../src/models/AppwriteUser';

dotenv.config();

async function createTestUser() {
  try {
    console.log('🧪 Creating test user...');
    
    const testUser = {
      username: 'testuser',
      email: 'test@example.com',
      phoneNumber: '+1234567890',
      password: 'password123',
      role: 'TEAM_MEMBER' as const,
      emailNotifications: true,
      smsNotifications: true,
      meetingReminders: true,
      auditReminders: true,
    };

    // Check if user already exists
    const existingUser = await UserModel.findByUsername(testUser.username);
    if (existingUser) {
      console.log('⚠️ Test user already exists!');
      console.log('📋 Login credentials:');
      console.log(`   Username: ${testUser.username}`);
      console.log(`   Password: ${testUser.password}`);
      return;
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(testUser.password, saltRounds);

    // Create user
    const user = await UserModel.create({
      ...testUser,
      password: hashedPassword,
    });

    console.log('✅ Test user created successfully!');
    console.log('📋 Login credentials:');
    console.log(`   Username: ${testUser.username}`);
    console.log(`   Password: ${testUser.password}`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Role: ${testUser.role}`);
    console.log(`   User ID: ${user.$id}`);
    
  } catch (error: any) {
    console.error('❌ Failed to create test user:', error.message || error);
    
    if (error.code === 404) {
      console.log('\n🔧 Database/Collection not found:');
      console.log('1. Make sure your Appwrite database is set up');
      console.log('2. Ensure the "users" collection exists');
      console.log('3. Run the setup script: npm run setup:appwrite');
    } else if (error.code === 401) {
      console.log('\n🔧 Authorization error:');
      console.log('1. Check your APPWRITE_API_KEY in .env');
      console.log('2. Ensure the API key has proper permissions');
    }
  }
}

createTestUser();