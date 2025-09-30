import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing database connection...');
    console.log('📍 Database URL:', process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@'));
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query test successful:', result);
    
    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('📋 Existing tables:', tables);
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error code:', (error as any).code);
    console.error('Error message:', (error as any).message);
    
    if ((error as any).code === 'P1001') {
      console.log('\n💡 Troubleshooting tips:');
      console.log('1. Check if your Supabase project is active (not paused)');
      console.log('2. Verify the DATABASE_URL in your .env file');
      console.log('3. Make sure your internet connection is stable');
      console.log('4. Check Supabase status: https://status.supabase.com/');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();