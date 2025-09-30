import sgMail from '@sendgrid/mail';

export interface EmailData {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export class EmailService {
  private static initialized = false;

  static initialize() {
    if (this.initialized) return;
    
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.warn('SENDGRID_API_KEY not found in environment variables. Email service will not work.');
      return;
    }

    sgMail.setApiKey(apiKey);
    this.initialized = true;
  }

  static async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      this.initialize();
      
      if (!this.initialized) {
        console.error('Email service not initialized. Cannot send email.');
        return false;
      }

      const msg = {
        to: emailData.to,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@clientmanagement.com',
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html || emailData.text
      };

      await sgMail.send(msg);
      console.log(`Email sent successfully to ${emailData.to}`);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  static async sendMeetingReminder(
    userEmail: string, 
    userName: string, 
    companyName: string, 
    scheduledDate: Date
  ): Promise<boolean> {
    const subject = `Meeting Reminder: ${companyName}`;
    const text = `Hi ${userName},\n\nThis is a reminder that you have a meeting scheduled with ${companyName} on ${scheduledDate.toLocaleDateString()}.\n\nPlease make sure to prepare for the meeting and reach out to the client to confirm.\n\nBest regards,\nClient Management Team`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Meeting Reminder</h2>
        <p>Hi ${userName},</p>
        <p>This is a reminder that you have a meeting scheduled with <strong>${companyName}</strong> on <strong>${scheduledDate.toLocaleDateString()}</strong>.</p>
        <p>Please make sure to prepare for the meeting and reach out to the client to confirm.</p>
        <p>Best regards,<br>Client Management Team</p>
      </div>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject,
      text,
      html
    });
  }

  static async sendAuditReminder(
    userEmail: string, 
    userName: string, 
    companyName: string, 
    auditDate: Date
  ): Promise<boolean> {
    const subject = `Audit Due: ${companyName}`;
    const text = `Hi ${userName},\n\nThis is a reminder that an audit is due for ${companyName} on ${auditDate.toLocaleDateString()}.\n\nPlease complete the audit and update the system accordingly.\n\nBest regards,\nClient Management Team`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Audit Reminder</h2>
        <p>Hi ${userName},</p>
        <p>This is a reminder that an audit is due for <strong>${companyName}</strong> on <strong>${auditDate.toLocaleDateString()}</strong>.</p>
        <p>Please complete the audit and update the system accordingly.</p>
        <p>Best regards,<br>Client Management Team</p>
      </div>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject,
      text,
      html
    });
  }

  static async sendCompanyMilestone(
    userEmail: string, 
    userName: string, 
    companyName: string, 
    milestone: string
  ): Promise<boolean> {
    const subject = `Company Milestone: ${companyName}`;
    const text = `Hi ${userName},\n\n${companyName} has reached a milestone: ${milestone}\n\nPlease review the company status and take any necessary actions.\n\nBest regards,\nClient Management Team`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Company Milestone</h2>
        <p>Hi ${userName},</p>
        <p><strong>${companyName}</strong> has reached a milestone: <strong>${milestone}</strong></p>
        <p>Please review the company status and take any necessary actions.</p>
        <p>Best regards,<br>Client Management Team</p>
      </div>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject,
      text,
      html
    });
  }
}