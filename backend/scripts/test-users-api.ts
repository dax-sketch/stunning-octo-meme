import * as dotenv from 'dotenv';
import { UserModel } from '../src/models/AppwriteUser';

dotenv.config();

async function testUsersAPI() {
  try {
    console.log('🧪 Testing Users API...');
    
    // Test the UserModel.findMany method directly
    const { users, total } = await UserModel.findMany();
    
    console.log(`✅ Found ${total} users in database:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.email}) - Role: ${user.role}`);
      console.log(`   ID: ${user.$id}`);
    });
    
    // Test the transformation that the controller does
    console.log('\n🔄 Transformed for frontend:');
    const transformedUsers = users.map(user => ({
      id: user.$id,
      username: user.username,
      email: user.email,
      role: user.role,
    }));
    
    console.log(JSON.stringify(transformedUsers, null, 2));
    
  } catch (error: any) {
    console.error('❌ Failed to test users API:', error.message || error);
  }
}

testUsersAPI();