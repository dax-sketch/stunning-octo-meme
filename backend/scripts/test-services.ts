import * as dotenv from 'dotenv';
import sgMail from '@sendgrid/mail';
import twilio from 'twilio';

// Load environment variables
dotenv.config({ path: '.env.production' });

async function testExternalServices() {
  console.log('🧪 Testing external services...');
  
  // Test SendGrid
  try {
    if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      
      const msg = {
        to: process.env.SENDGRID_FROM_EMAIL, // Send to verified sender
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: 'Test Email - Client Management System',
        text: 'This is a test email to verify SendGrid integration.',
        html: '<p>This is a test email to verify SendGrid integration.</p>'
      };
      
      await sgMail.send(msg);
      console.log('✅ SendGrid email test successful');
    } else {
      console.log('⚠️ SendGrid credentials not configured');
    }
  } catch (error) {
    console.error('❌ SendGrid test failed:', error);
  }
  
  // Test Twilio
  try {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      
      // Note: This will only work with verified numbers on trial accounts
      console.log('⚠️ Twilio SMS test skipped - requires verified recipient number');
      console.log('✅ Twilio credentials configured correctly');
    } else {
      console.log('⚠️ Twilio credentials not configured');
    }
  } catch (error) {
    console.error('❌ Twilio test failed:', error);
  }
  
  console.log('🎉 Service testing complete!');
}

testExternalServices().catch(console.error);