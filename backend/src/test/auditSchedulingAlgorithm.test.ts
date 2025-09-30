import { AuditService } from '../services/auditService';

describe('Audit Scheduling Algorithm', () => {
  let auditService: AuditService;

  beforeEach(() => {
    auditService = new AuditService();
  });

  describe('calculateNextAuditDate', () => {
    it('should schedule weekly audits for companies less than 3 months old', () => {
      const companyStartDate = new Date('2024-01-01');
      const currentDate = new Date('2024-02-01'); // 1 month old

      const nextAuditDate = auditService.calculateNextAuditDate(companyStartDate, currentDate);
      const expectedDate = new Date('2024-02-08'); // 7 days later

      expect(nextAuditDate.toDateString()).toBe(expectedDate.toDateString());
    });

    it('should schedule monthly audits for companies 3-12 months old', () => {
      const companyStartDate = new Date('2024-01-01');
      const currentDate = new Date('2024-06-01'); // 5 months old

      const nextAuditDate = auditService.calculateNextAuditDate(companyStartDate, currentDate);
      const expectedDate = new Date('2024-07-01'); // 1 month later

      expect(nextAuditDate.getMonth()).toBe(expectedDate.getMonth());
      expect(nextAuditDate.getFullYear()).toBe(expectedDate.getFullYear());
    });

    it('should schedule quarterly audits for companies over 1 year old', () => {
      const companyStartDate = new Date('2023-01-01');
      const currentDate = new Date('2024-06-01'); // 17 months old

      const nextAuditDate = auditService.calculateNextAuditDate(companyStartDate, currentDate);
      const expectedDate = new Date('2024-09-01'); // 3 months later

      expect(nextAuditDate.getMonth()).toBe(expectedDate.getMonth());
      expect(nextAuditDate.getFullYear()).toBe(expectedDate.getFullYear());
    });

    it('should handle edge case at 3 months exactly', () => {
      const companyStartDate = new Date('2024-01-01');
      const currentDate = new Date('2024-04-01'); // Exactly 3 months old

      const nextAuditDate = auditService.calculateNextAuditDate(companyStartDate, currentDate);
      const expectedDate = new Date('2024-05-01'); // Should be monthly (1 month later)

      expect(nextAuditDate.getMonth()).toBe(expectedDate.getMonth());
    });

    it('should handle edge case at 12 months exactly', () => {
      const companyStartDate = new Date('2023-01-01');
      const currentDate = new Date('2024-01-01'); // Exactly 12 months old

      const nextAuditDate = auditService.calculateNextAuditDate(companyStartDate, currentDate);
      const expectedDate = new Date('2024-04-01'); // Should be quarterly (3 months later)

      expect(nextAuditDate.getMonth()).toBe(expectedDate.getMonth());
    });

    it('should handle year boundaries correctly', () => {
      const companyStartDate = new Date('2023-11-01');
      const currentDate = new Date('2024-01-01'); // 2 months old, crossing year boundary

      const nextAuditDate = auditService.calculateNextAuditDate(companyStartDate, currentDate);
      const expectedDate = new Date('2024-01-08'); // Should be weekly (7 days later)

      expect(nextAuditDate.toDateString()).toBe(expectedDate.toDateString());
    });
  });

  describe('getCompanyAgeInMonths', () => {
    it('should calculate company age correctly', () => {
      const startDate = new Date('2024-01-01');
      const currentDate = new Date('2024-06-01');

      // Use reflection to access private method
      const ageInMonths = (auditService as any).getCompanyAgeInMonths(startDate, currentDate);

      expect(ageInMonths).toBe(5);
    });

    it('should handle same month correctly', () => {
      const startDate = new Date('2024-01-15');
      const currentDate = new Date('2024-01-20');

      const ageInMonths = (auditService as any).getCompanyAgeInMonths(startDate, currentDate);

      expect(ageInMonths).toBe(0);
    });

    it('should handle year boundaries correctly', () => {
      const startDate = new Date('2023-10-01');
      const currentDate = new Date('2024-02-01');

      const ageInMonths = (auditService as any).getCompanyAgeInMonths(startDate, currentDate);

      expect(ageInMonths).toBe(4);
    });

    it('should handle leap year correctly', () => {
      const startDate = new Date('2024-02-01'); // 2024 is a leap year
      const currentDate = new Date('2024-03-01');

      const ageInMonths = (auditService as any).getCompanyAgeInMonths(startDate, currentDate);

      expect(ageInMonths).toBe(1);
    });
  });

  describe('shouldRescheduleAudit', () => {
    it('should return true when audit needs rescheduling for new company', () => {
      const companyStartDate = new Date('2024-01-01');
      const currentScheduledDate = new Date('2024-03-01'); // Too far for new company (should be weekly)

      const shouldReschedule = (auditService as any).shouldRescheduleAudit(
        companyStartDate,
        currentScheduledDate
      );

      expect(shouldReschedule).toBe(true);
    });

    it('should return false when audit schedule is correct', () => {
      const companyStartDate = new Date('2024-01-01');
      const currentDate = new Date('2024-02-01');
      const expectedDate = auditService.calculateNextAuditDate(companyStartDate, currentDate);

      const shouldReschedule = (auditService as any).shouldRescheduleAudit(
        companyStartDate,
        expectedDate
      );

      expect(shouldReschedule).toBe(false);
    });

    it('should return true when difference is more than 3 days', () => {
      const companyStartDate = new Date('2024-01-01');
      const currentDate = new Date('2024-02-01');
      const expectedDate = auditService.calculateNextAuditDate(companyStartDate, currentDate);
      
      // Create a date that's 5 days off from expected
      const incorrectDate = new Date(expectedDate);
      incorrectDate.setDate(incorrectDate.getDate() + 5);

      const shouldReschedule = (auditService as any).shouldRescheduleAudit(
        companyStartDate,
        incorrectDate
      );

      expect(shouldReschedule).toBe(true);
    });

    it('should return false when difference is within 3 days', () => {
      const companyStartDate = new Date('2024-01-01');
      const currentDate = new Date('2024-02-01');
      const expectedDate = auditService.calculateNextAuditDate(companyStartDate, currentDate);
      
      // Create a date that's 2 days off from expected
      const closeDate = new Date(expectedDate);
      closeDate.setDate(closeDate.getDate() + 2);

      const shouldReschedule = (auditService as any).shouldRescheduleAudit(
        companyStartDate,
        closeDate
      );

      expect(shouldReschedule).toBe(false);
    });
  });
});