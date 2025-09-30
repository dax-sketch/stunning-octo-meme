import { NotificationModel } from '../models/Notification';

// Simple test to verify notification model works
describe('Notification Basic Test', () => {
  it('should validate notification data correctly', () => {
    const validData = {
      userId: 'user-1',
      type: 'MEETING_REMINDER' as const,
      title: 'Test Notification',
      message: 'Test message',
      scheduledFor: new Date('2024-01-15T10:00:00Z')
    };

    // This should not throw an error
    expect(() => {
      NotificationModel.createNotificationSchema.validate(validData);
    }).not.toThrow();
  });

  it('should reject invalid notification data', () => {
    const invalidData = {
      userId: '', // Invalid: empty string
      type: 'INVALID_TYPE',
      title: '',
      message: '',
      scheduledFor: 'invalid-date'
    };

    const { error } = NotificationModel.createNotificationSchema.validate(invalidData);
    expect(error).toBeDefined();
  });
});