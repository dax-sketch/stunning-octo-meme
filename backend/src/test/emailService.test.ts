import { EmailService } from '../services/emailService';
import sgMail from '@sendgrid/mail';

// Mock SendGrid
jest.mock('@sendgrid/mail');

const mockSgMail = sgMail as jest.Mocked<typeof sgMail>;

describe('EmailService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the initialized state
    (EmailService as any).initialized = false;
    
    // Mock environment variables
    process.env.SENDGRID_API_KEY = 'test-api-key';
    process.env.SENDGRID_FROM_EMAIL = 'test@example.com';
  });

  afterEach(() => {
    delete process.env.SENDGRID_API_KEY;
    delete process.env.SENDGRID_FROM_EMAIL;
  });

  describe('initialize', () => {
    it('should initialize SendGrid with API key', () => {
      EmailService.initialize();

      expect(mockSgMail.setApiKey).toHaveBeenCalledWith('test-api-key');
    });

    it('should not initialize if API key is missing', () => {
      delete process.env.SENDGRID_API_KEY;
      
      // Mock console.warn to avoid output during tests
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      EmailService.initialize();

      expect(mockSgMail.setApiKey).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('SENDGRID_API_KEY not found in environment variables. Email service will not work.');

      consoleSpy.mockRestore();
    });

    it('should only initialize once', () => {
      EmailService.initialize();
      EmailService.initialize();

      expect(mockSgMail.setApiKey).toHaveBeenCalledTimes(1);
    });
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      mockSgMail.send.mockResolvedValue([{} as any, {}]);
      
      // Mock console.log to avoid output during tests
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const emailData = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Test message',
        html: '<p>Test message</p>'
      };

      const result = await EmailService.sendEmail(emailData);

      expect(mockSgMail.setApiKey).toHaveBeenCalledWith('test-api-key');
      expect(mockSgMail.send).toHaveBeenCalledWith({
        to: 'recipient@example.com',
        from: 'test@example.com',
        subject: 'Test Subject',
        text: 'Test message',
        html: '<p>Test message</p>'
      });
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('Email sent successfully to recipient@example.com');

      consoleSpy.mockRestore();
    });

    it('should use text as html if html not provided', async () => {
      mockSgMail.send.mockResolvedValue([{} as any, {}]);

      const emailData = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Test message'
      };

      await EmailService.sendEmail(emailData);

      expect(mockSgMail.send).toHaveBeenCalledWith({
        to: 'recipient@example.com',
        from: 'test@example.com',
        subject: 'Test Subject',
        text: 'Test message',
        html: 'Test message'
      });
    });

    it('should return false if service not initialized', async () => {
      delete process.env.SENDGRID_API_KEY;
      
      // Mock console methods to avoid output during tests
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const emailData = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Test message'
      };

      const result = await EmailService.sendEmail(emailData);

      expect(mockSgMail.send).not.toHaveBeenCalled();
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Email service not initialized. Cannot send email.');

      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle SendGrid errors', async () => {
      const error = new Error('SendGrid error');
      mockSgMail.send.mockRejectedValue(error);
      
      // Mock console.error to avoid output during tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const emailData = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Test message'
      };

      const result = await EmailService.sendEmail(emailData);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Error sending email:', error);

      consoleSpy.mockRestore();
    });
  });

  describe('sendMeetingReminder', () => {
    it('should send meeting reminder email', async () => {
      mockSgMail.send.mockResolvedValue([{} as any, {}]);
      
      // Mock console.log to avoid output during tests
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await EmailService.sendMeetingReminder(
        'user@example.com',
        'John Doe',
        'Test Company',
        new Date('2024-01-15T10:00:00Z')
      );

      expect(mockSgMail.send).toHaveBeenCalledWith({
        to: 'user@example.com',
        from: 'test@example.com',
        subject: 'Meeting Reminder: Test Company',
        text: expect.stringContaining('Hi John Doe'),
        html: expect.stringContaining('Hi John Doe')
      });
      expect(result).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  describe('sendAuditReminder', () => {
    it('should send audit reminder email', async () => {
      mockSgMail.send.mockResolvedValue([{} as any, {}]);
      
      // Mock console.log to avoid output during tests
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await EmailService.sendAuditReminder(
        'user@example.com',
        'John Doe',
        'Test Company',
        new Date('2024-01-15T10:00:00Z')
      );

      expect(mockSgMail.send).toHaveBeenCalledWith({
        to: 'user@example.com',
        from: 'test@example.com',
        subject: 'Audit Due: Test Company',
        text: expect.stringContaining('Hi John Doe'),
        html: expect.stringContaining('Hi John Doe')
      });
      expect(result).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  describe('sendCompanyMilestone', () => {
    it('should send company milestone email', async () => {
      mockSgMail.send.mockResolvedValue([{} as any, {}]);
      
      // Mock console.log to avoid output during tests
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await EmailService.sendCompanyMilestone(
        'user@example.com',
        'John Doe',
        'Test Company',
        'Reached 1 year milestone'
      );

      expect(mockSgMail.send).toHaveBeenCalledWith({
        to: 'user@example.com',
        from: 'test@example.com',
        subject: 'Company Milestone: Test Company',
        text: expect.stringContaining('Hi John Doe'),
        html: expect.stringContaining('Hi John Doe')
      });
      expect(result).toBe(true);

      consoleSpy.mockRestore();
    });
  });
});