import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

console.log('🔍 Validating Prisma and Database Setup...\n');

// Check if Prisma client is generated
try {
  const { PrismaClient } = require('@prisma/client');
  console.log('✅ Prisma Client is available');
  
  // Check if we can create a client instance
  const prisma = new PrismaClient();
  console.log('✅ Prisma Client instance created successfully');
  
  // Check environment variables
  const requiredEnvVars = ['DATABASE_URL'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('⚠️  Missing environment variables:');
    missingVars.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    console.log('\n💡 Please set these in your .env file');
  } else {
    console.log('✅ All required environment variables are set');
  }
  
  // Check schema file
  const fs = require('fs');
  const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
  
  if (fs.existsSync(schemaPath)) {
    console.log('✅ Prisma schema file exists');
    
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const models = ['User', 'Company', 'Note', 'Audit', 'Notification'];
    const foundModels = models.filter(model => schemaContent.includes(`model ${model}`));
    
    console.log(`✅ Found ${foundModels.length}/${models.length} required models:`);
    foundModels.forEach(model => console.log(`   - ${model}`));
    
    if (foundModels.length !== models.length) {
      const missingModels = models.filter(model => !foundModels.includes(model));
      console.log('⚠️  Missing models:');
      missingModels.forEach(model => console.log(`   - ${model}`));
    }
  } else {
    console.log('❌ Prisma schema file not found');
  }
  
  console.log('\n🎉 Prisma setup validation completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Set up your Supabase database and update DATABASE_URL in .env');
  console.log('2. Run "npm run db:push" to apply the schema to your database');
  console.log('3. Run "npm run db:setup" to test the connection');
  
} catch (error) {
  console.error('❌ Prisma Client validation failed:', error instanceof Error ? error.message : String(error));
  console.log('\n💡 Try running: npm run db:generate');
}