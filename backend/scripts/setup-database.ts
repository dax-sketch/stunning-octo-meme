import { testDatabaseConnection, initializeDatabase } from '../src/utils/database';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function setupDatabase() {
  console.log('🚀 Setting up database...');
  
  // Test connection first
  const isConnected = await testDatabaseConnection();
  
  if (!isConnected) {
    console.error('❌ Cannot connect to database. Please check your DATABASE_URL environment variable.');
    console.log('💡 Make sure you have:');
    console.log('   1. Created a Supabase project');
    console.log('   2. Set the DATABASE_URL in your .env file');
    console.log('   3. The database is accessible from your network');
    process.exit(1);
  }
  
  // Initialize database
  try {
    await initializeDatabase();
    console.log('✅ Database setup completed successfully!');
    console.log('💡 Next steps:');
    console.log('   1. Run "npx prisma db push" to apply the schema');
    console.log('   2. Run "npm run dev" to start the development server');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

export { setupDatabase };