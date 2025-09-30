import { Client, Databases, Users, ID } from 'appwrite';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcryptjs';

// Load production environment variables
dotenv.config({ path: '.env.production' });

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);
const users = new Users(client);
const databaseId = process.env.APPWRITE_DATABASE_ID || 'client-management';

async function setupProductionAppwrite() {
  try {
    console.log('🗄️ Setting up production Appwrite database...');
    
    // Test database connection
    try {
      await databases.get(databaseId);
      console.log('✅ Database connection successful');
    } catch (error: any) {
      if (error.code === 404) {
        console.log('❌ Database not found. Please run the setup script first.');
        console.log('Run: npm run db:setup');
        process.exit(1);
      }
      throw error;
    }
    
    // Check if collections exist
    const collections = await databases.listCollections(databaseId);
    console.log(`✅ Found ${collections.total} collections`);
    
    const requiredCollections = ['users', 'companies', 'notes', 'audits', 'notifications', 'tier_change_logs'];
    const existingCollections = collections.collections.map(c => c.$id);
    
    for (const required of requiredCollections) {
      if (existingCollections.includes(required)) {
        console.log(`✅ Collection '${required}' exists`);
      } else {
        console.log(`❌ Collection '${required}' missing`);
      }
    }
    
    // Create initial admin user if it doesn't exist
    try {
      const adminUsers = await databases.listDocuments(
        databaseId,
        'users',
        []
      );
      
      const adminExists = adminUsers.documents.some((user: any) => user.role === 'CEO');
      
      if (!adminExists) {
        console.log('👤 Creating initial admin user...');
        const hashedPassword = await bcrypt.hash('admin123!', 12);
        
        await databases.createDocument(
          databaseId,
          'users',
          ID.unique(),
          {
            username: 'admin',
            email: 'admin@company.com',
            phoneNumber: '+1234567890',
            password: hashedPassword,
            role: 'CEO',
            emailNotifications: true,
            smsNotifications: true,
            meetingReminders: true,
            auditReminders: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        );
        console.log('✅ Admin user created');
        console.log('📧 Email: admin@company.com');
        console.log('🔑 Password: admin123!');
        console.log('⚠️ Please change the password after first login');
      } else {
        console.log('ℹ️ Admin user already exists');
      }
    } catch (error) {
      console.error('❌ Error creating admin user:', error);
    }
    
    console.log('🎉 Production Appwrite setup complete!');
    
    console.log('\n📋 Next steps:');
    console.log('1. Update your production environment variables');
    console.log('2. Deploy your application');
    console.log('3. Test the admin login');
    console.log('4. Change the default admin password');
    
  } catch (error) {
    console.error('❌ Production setup failed:', error);
    process.exit(1);
  }
}

setupProductionAppwrite();