import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load production environment variables
dotenv.config({ path: '.env.production' });

const prisma = new PrismaClient();

async function setupProductionDatabase() {
  try {
    console.log('🗄️ Setting up production database...');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Run database migrations/push
    console.log('📋 Applying database schema...');
    // Note: In production, you should use proper migrations
    // This is a simplified setup for the free tier
    
    // Create initial admin user if it doesn't exist
    const adminExists = await prisma.user.findFirst({
      where: { role: 'CEO' }
    });
    
    if (!adminExists) {
      console.log('👤 Creating initial admin user...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123!', 12);
      
      await prisma.user.create({
        data: {
          username: 'admin',
          email: 'admin@company.com',
          phoneNumber: '+1234567890',
          password: hashedPassword,
          role: 'CEO',
          notificationPreferences: {
            email: true,
            sms: true,
            meetingReminders: true,
            auditReminders: true
          }
        }
      });
      console.log('✅ Admin user created');
    }
    
    console.log('🎉 Production database setup complete!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupProductionDatabase();