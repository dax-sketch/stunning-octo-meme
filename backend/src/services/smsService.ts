import twilio from 'twilio';

export interface SMSData {
  to: string;
  message: string;
}

export class SMSService {
  private static client: twilio.Twilio | null = null;
  private static initialized = false;

  static initialize() {
    if (this.initialized) return;
    
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      console.warn('TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not found in environment variables. SMS service will not work.');
      return;
    }

    this.client = twilio(accountSid, authToken);
    this.initialized = true;
  }

  static async sendSMS(smsData: SMSData): Promise<boolean> {
    try {
      this.initialize();
      
      if (!this.initialized || !this.client) {
        console.error('SMS service not initialized. Cannot send SMS.');
        return false;
      }

      const fromNumber = process.env.TWILIO_PHONE_NUMBER;
      if (!fromNumber) {
        console.error('TWILIO_PHONE_NUMBER not found in environment variables.');
        return false;
      }

      await this.client.messages.create({
        body: smsData.message,
        from: fromNumber,
        to: smsData.to
      });

      console.log(`SMS sent successfully to ${smsData.to}`);
      return true;
    } catch (error) {
      console.error('Error sending SMS:', error);
      return false;
    }
  }

  static async sendMeetingReminder(
    phoneNumber: string, 
    userName: string, 
    companyName: string, 
    scheduledDate: Date
  ): Promise<boolean> {
    const message = `Hi ${userName}, reminder: Meeting with ${companyName} scheduled for ${scheduledDate.toLocaleDateString()}. Please prepare and confirm with client.`;

    return await this.sendSMS({
      to: phoneNumber,
      message
    });
  }

  static async sendAuditReminder(
    phoneNumber: string, 
    userName: string, 
    companyName: string, 
    auditDate: Date
  ): Promise<boolean> {
    const message = `Hi ${userName}, audit reminder: ${companyName} audit due on ${auditDate.toLocaleDateString()}. Please complete and update system.`;

    return await this.sendSMS({
      to: phoneNumber,
      message
    });
  }

  static async sendCompanyMilestone(
    phoneNumber: string, 
    userName: string, 
    companyName: string, 
    milestone: string
  ): Promise<boolean> {
    const message = `Hi ${userName}, ${companyName} milestone: ${milestone}. Please review company status.`;

    return await this.sendSMS({
      to: phoneNumber,
      message
    });
  }

  private static formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');
    
    // Add +1 if it's a 10-digit US number
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    
    // Add + if it doesn't start with +
    if (!phoneNumber.startsWith('+')) {
      return `+${digits}`;
    }
    
    return phoneNumber;
  }
}