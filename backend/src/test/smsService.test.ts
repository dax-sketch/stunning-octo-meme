import { SMSService } from '../services/smsService';
import twilio from 'twilio';

// Mock Twilio
jest.mock('twilio');

const mockTwilio = twilio as jest.MockedFunction<typeof twilio>;
const mockClient = {
  messages: {
    create: jest.fn()
  }
};

describe('SMSService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the initialized state
    (SMSService as any).initialized = false;
    (SMSService as any).client = null;
    
    // Mock environment variables
    process.env.TWILIO_ACCOUNT_SID = 'test-account-sid';
    process.env.TWILIO_AUTH_TOKEN = 'test-auth-token';
    process.env.TWILIO_PHONE_NUMBER = '+1234567890';

    mockTwilio.mockReturnValue(mockClient as any);
  });

  afterEach(() => {
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_PHONE_NUMBER;
  });

  describe('initialize', () => {
    it('should initialize Twilio client with credentials', () => {
      SMSService.initialize();

      expect(mockTwilio).toHaveBeenCalledWith('test-account-sid', 'test-auth-token');
    });

    it('should not initialize if credentials are missing', () => {
      delete process.env.TWILIO_ACCOUNT_SID;
      
      // Mock console.warn to avoid output during tests
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      SMSService.initialize();

      expect(mockTwilio).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not found in environment variables. SMS service will not work.');

      consoleSpy.mockRestore();
    });

    it('should only initialize once', () => {
      SMSService.initialize();
      SMSService.initialize();

      expect(mockTwilio).toHaveBeenCalledTimes(1);
    });
  });

  describe('sendSMS', () => {
    it('should send SMS successfully', async () => {
      mockClient.messages.create.mockResolvedValue({ sid: 'test-message-sid' });
      
      // Mock console.log to avoid output during tests
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const smsData = {
        to: '+1987654321',
        message: 'Test SMS message'
      };

      const result = await SMSService.sendSMS(smsData);

      expect(mockTwilio).toHaveBeenCalledWith('test-account-sid', 'test-auth-token');
      expect(mockClient.messages.create).toHaveBeenCalledWith({
        body: 'Test SMS message',
        from: '+1234567890',
        to: '+1987654321'
      });
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('SMS sent successfully to +1987654321');

      consoleSpy.mockRestore();
    });

    it('should return false if service not initialized', async () => {
      delete process.env.TWILIO_ACCOUNT_SID;
      
      // Mock console methods to avoid output during tests
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const smsData = {
        to: '+1987654321',
        message: 'Test SMS message'
      };

      const result = await SMSService.sendSMS(smsData);

      expect(mockClient.messages.create).not.toHaveBeenCalled();
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('SMS service not initialized. Cannot send SMS.');

      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should return false if phone number not configured', async () => {
      delete process.env.TWILIO_PHONE_NUMBER;
      
      // Mock console.error to avoid output during tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const smsData = {
        to: '+1987654321',
        message: 'Test SMS message'
      };

      const result = await SMSService.sendSMS(smsData);

      expect(mockClient.messages.create).not.toHaveBeenCalled();
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('TWILIO_PHONE_NUMBER not found in environment variables.');

      consoleSpy.mockRestore();
    });

    it('should handle Twilio errors', async () => {
      const error = new Error('Twilio error');
      mockClient.messages.create.mockRejectedValue(error);
      
      // Mock console.error to avoid output during tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const smsData = {
        to: '+1987654321',
        message: 'Test SMS message'
      };

      const result = await SMSService.sendSMS(smsData);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Error sending SMS:', error);

      consoleSpy.mockRestore();
    });
  });

  describe('sendMeetingReminder', () => {
    it('should send meeting reminder SMS', async () => {
      mockClient.messages.create.mockResolvedValue({ sid: 'test-message-sid' });
      
      // Mock console.log to avoid output during tests
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await SMSService.sendMeetingReminder(
        '+1987654321',
        'John Doe',
        'Test Company',
        new Date('2024-01-15T10:00:00Z')
      );

      expect(mockClient.messages.create).toHaveBeenCalledWith({
        body: expect.stringContaining('Hi John Doe, reminder: Meeting with Test Company'),
        from: '+1234567890',
        to: '+1987654321'
      });
      expect(result).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  describe('sendAuditReminder', () => {
    it('should send audit reminder SMS', async () => {
      mockClient.messages.create.mockResolvedValue({ sid: 'test-message-sid' });
      
      // Mock console.log to avoid output during tests
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await SMSService.sendAuditReminder(
        '+1987654321',
        'John Doe',
        'Test Company',
        new Date('2024-01-15T10:00:00Z')
      );

      expect(mockClient.messages.create).toHaveBeenCalledWith({
        body: expect.stringContaining('Hi John Doe, audit reminder: Test Company audit due'),
        from: '+1234567890',
        to: '+1987654321'
      });
      expect(result).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  describe('sendCompanyMilestone', () => {
    it('should send company milestone SMS', async () => {
      mockClient.messages.create.mockResolvedValue({ sid: 'test-message-sid' });
      
      // Mock console.log to avoid output during tests
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await SMSService.sendCompanyMilestone(
        '+1987654321',
        'John Doe',
        'Test Company',
        'Reached 1 year milestone'
      );

      expect(mockClient.messages.create).toHaveBeenCalledWith({
        body: expect.stringContaining('Hi John Doe, Test Company milestone: Reached 1 year milestone'),
        from: '+1234567890',
        to: '+1987654321'
      });
      expect(result).toBe(true);

      consoleSpy.mockRestore();
    });
  });
});