import { CompanyModel } from '../models/Company';

describe('Company Model - Data Tracking Validation', () => {
  describe('createCompanySchema validation', () => {
    it('should validate payment tracking fields', () => {
      const validData = {
        name: 'Test Company',
        startDate: new Date('2023-01-01'),
        phoneNumber: '+1234567890',
        email: 'test@company.com',
        website: 'https://example.com',
        adSpend: 1000,
        lastPaymentDate: new Date('2024-01-15'),
        lastPaymentAmount: 5000,
        createdBy: 'user123'
      };

      const { error } = CompanyModel.createCompanySchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should validate meeting tracking fields', () => {
      const validData = {
        name: 'Test Company',
        startDate: new Date('2023-01-01'),
        phoneNumber: '+1234567890',
        email: 'test@company.com',
        website: 'https://example.com',
        adSpend: 1000,
        lastMeetingDate: new Date('2024-01-15'),
        lastMeetingAttendees: ['John Doe', 'Jane Smith'],
        lastMeetingDuration: 60,
        createdBy: 'user123'
      };

      const { error } = CompanyModel.createCompanySchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject negative payment amount', () => {
      const invalidData = {
        name: 'Test Company',
        startDate: new Date('2023-01-01'),
        phoneNumber: '+1234567890',
        email: 'test@company.com',
        website: 'https://example.com',
        adSpend: 1000,
        lastPaymentAmount: -100,
        createdBy: 'user123'
      };

      const { error } = CompanyModel.createCompanySchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0]?.message).toContain('must be greater than or equal to 0');
    });

    it('should reject negative meeting duration', () => {
      const invalidData = {
        name: 'Test Company',
        startDate: new Date('2023-01-01'),
        phoneNumber: '+1234567890',
        email: 'test@company.com',
        website: 'https://example.com',
        adSpend: 1000,
        lastMeetingDuration: -30,
        createdBy: 'user123'
      };

      const { error } = CompanyModel.createCompanySchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0]?.message).toContain('must be greater than or equal to 0');
    });

    it('should validate meeting attendees as array', () => {
      const validData = {
        name: 'Test Company',
        startDate: new Date('2023-01-01'),
        phoneNumber: '+1234567890',
        email: 'test@company.com',
        website: 'https://example.com',
        adSpend: 1000,
        lastMeetingAttendees: ['John Doe', 'Jane Smith', 'Bob Johnson'],
        createdBy: 'user123'
      };

      const { error } = CompanyModel.createCompanySchema.validate(validData);
      expect(error).toBeUndefined();
    });
  });

  describe('updateCompanySchema validation', () => {
    it('should validate payment data updates', () => {
      const validUpdateData = {
        lastPaymentDate: new Date('2024-01-15'),
        lastPaymentAmount: 7500
      };

      const { error } = CompanyModel.updateCompanySchema.validate(validUpdateData);
      expect(error).toBeUndefined();
    });

    it('should validate meeting data updates', () => {
      const validUpdateData = {
        lastMeetingDate: new Date('2024-01-15'),
        lastMeetingAttendees: ['Alice Johnson', 'Bob Smith'],
        lastMeetingDuration: 90
      };

      const { error } = CompanyModel.updateCompanySchema.validate(validUpdateData);
      expect(error).toBeUndefined();
    });

    it('should reject negative values in updates', () => {
      const invalidUpdateData = {
        lastPaymentAmount: -500,
        lastMeetingDuration: -45
      };

      const { error } = CompanyModel.updateCompanySchema.validate(invalidUpdateData);
      expect(error).toBeDefined();
    });

    it('should allow partial updates', () => {
      const partialUpdateData = {
        lastPaymentDate: new Date('2024-01-15')
        // Only updating payment date, not amount
      };

      const { error } = CompanyModel.updateCompanySchema.validate(partialUpdateData);
      expect(error).toBeUndefined();
    });

    it('should allow empty attendees array', () => {
      const updateData = {
        lastMeetingAttendees: []
      };

      const { error } = CompanyModel.updateCompanySchema.validate(updateData);
      expect(error).toBeUndefined();
    });
  });
});