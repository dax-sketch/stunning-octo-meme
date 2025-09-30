import { CompanyController } from '../controllers/companyController';
import { CompanyModel } from '../models/Company';
import { Request, Response } from 'express';
import { JwtPayload } from '../utils/jwt';

// Mock the CompanyModel
jest.mock('../models/Company');
const MockedCompanyModel = CompanyModel as jest.Mocked<typeof CompanyModel>;

// Mock request and response objects
const mockRequest = (body: any = {}, params: any = {}, user?: JwtPayload) => ({
  body,
  params,
  user,
}) as Request & { user?: JwtPayload };

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Company Data Tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updatePaymentData', () => {
    const mockUser: JwtPayload = {
      userId: 'user123',
      username: 'testuser',
      email: 'test@example.com',
      role: 'TEAM_MEMBER'
    };

    const mockCompany = {
      id: 'company123',
      name: 'Test Company',
      createdBy: 'user123',
      startDate: new Date('2023-01-01'),
      adSpend: 1000
    };

    it('should update payment data successfully', async () => {
      const req = mockRequest(
        {
          lastPaymentDate: '2024-01-15',
          lastPaymentAmount: 5000
        },
        { id: 'company123' },
        mockUser
      );
      const res = mockResponse();

      MockedCompanyModel.findById.mockResolvedValue(mockCompany as any);
      MockedCompanyModel.update.mockResolvedValue({
        ...mockCompany,
        lastPaymentDate: new Date('2024-01-15'),
        lastPaymentAmount: 5000
      } as any);

      await CompanyController.updatePaymentData(req, res);

      expect(MockedCompanyModel.findById).toHaveBeenCalledWith('company123');
      expect(MockedCompanyModel.update).toHaveBeenCalledWith('company123', {
        lastPaymentDate: new Date('2024-01-15'),
        lastPaymentAmount: 5000
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          lastPaymentAmount: 5000
        }),
        message: 'Payment data updated successfully'
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      const req = mockRequest(
        { lastPaymentDate: '2024-01-15', lastPaymentAmount: 5000 },
        { id: 'company123' }
      );
      const res = mockResponse();

      await CompanyController.updatePaymentData(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    });

    it('should return 400 if company ID is missing', async () => {
      const req = mockRequest(
        { lastPaymentDate: '2024-01-15', lastPaymentAmount: 5000 },
        {},
        mockUser
      );
      const res = mockResponse();

      await CompanyController.updatePaymentData(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'MISSING_PARAMETER',
          message: 'Company ID is required'
        }
      });
    });

    it('should return 400 if payment data is missing', async () => {
      const req = mockRequest(
        { lastPaymentDate: '2024-01-15' }, // Missing amount
        { id: 'company123' },
        mockUser
      );
      const res = mockResponse();

      await CompanyController.updatePaymentData(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Payment date and amount are required'
        }
      });
    });

    it('should return 400 if payment amount is invalid', async () => {
      const req = mockRequest(
        { lastPaymentDate: '2024-01-15', lastPaymentAmount: -100 },
        { id: 'company123' },
        mockUser
      );
      const res = mockResponse();

      await CompanyController.updatePaymentData(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Payment amount must be a positive number'
        }
      });
    });

    it('should return 400 if payment date is invalid', async () => {
      const req = mockRequest(
        { lastPaymentDate: 'invalid-date', lastPaymentAmount: 5000 },
        { id: 'company123' },
        mockUser
      );
      const res = mockResponse();

      await CompanyController.updatePaymentData(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid payment date format'
        }
      });
    });

    it('should return 404 if company not found', async () => {
      const req = mockRequest(
        { lastPaymentDate: '2024-01-15', lastPaymentAmount: 5000 },
        { id: 'company123' },
        mockUser
      );
      const res = mockResponse();

      MockedCompanyModel.findById.mockResolvedValue(null);

      await CompanyController.updatePaymentData(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'COMPANY_NOT_FOUND',
          message: 'Company not found'
        }
      });
    });

    it('should return 403 if user lacks permission', async () => {
      const req = mockRequest(
        { lastPaymentDate: '2024-01-15', lastPaymentAmount: 5000 },
        { id: 'company123' },
        { ...mockUser, userId: 'different-user' }
      );
      const res = mockResponse();

      MockedCompanyModel.findById.mockResolvedValue(mockCompany as any);

      await CompanyController.updatePaymentData(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this company'
        }
      });
    });
  });

  describe('updateMeetingData', () => {
    const mockUser: JwtPayload = {
      userId: 'user123',
      username: 'testuser',
      email: 'test@example.com',
      role: 'TEAM_MEMBER'
    };

    const mockCompany = {
      id: 'company123',
      name: 'Test Company',
      createdBy: 'user123',
      startDate: new Date('2023-01-01'),
      adSpend: 1000
    };

    it('should update meeting data successfully', async () => {
      const req = mockRequest(
        {
          lastMeetingDate: '2024-01-15',
          lastMeetingAttendees: ['John Doe', 'Jane Smith'],
          lastMeetingDuration: 60
        },
        { id: 'company123' },
        mockUser
      );
      const res = mockResponse();

      MockedCompanyModel.findById.mockResolvedValue(mockCompany as any);
      MockedCompanyModel.update.mockResolvedValue({
        ...mockCompany,
        lastMeetingDate: new Date('2024-01-15'),
        lastMeetingAttendees: ['John Doe', 'Jane Smith'],
        lastMeetingDuration: 60
      } as any);

      await CompanyController.updateMeetingData(req, res);

      expect(MockedCompanyModel.findById).toHaveBeenCalledWith('company123');
      expect(MockedCompanyModel.update).toHaveBeenCalledWith('company123', {
        lastMeetingDate: new Date('2024-01-15'),
        lastMeetingAttendees: ['John Doe', 'Jane Smith'],
        lastMeetingDuration: 60
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          lastMeetingDuration: 60
        }),
        message: 'Meeting data updated successfully'
      });
    });

    it('should update meeting data with only date', async () => {
      const req = mockRequest(
        { lastMeetingDate: '2024-01-15' },
        { id: 'company123' },
        mockUser
      );
      const res = mockResponse();

      MockedCompanyModel.findById.mockResolvedValue(mockCompany as any);
      MockedCompanyModel.update.mockResolvedValue({
        ...mockCompany,
        lastMeetingDate: new Date('2024-01-15')
      } as any);

      await CompanyController.updateMeetingData(req, res);

      expect(MockedCompanyModel.update).toHaveBeenCalledWith('company123', {
        lastMeetingDate: new Date('2024-01-15')
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 if meeting date is missing', async () => {
      const req = mockRequest(
        { lastMeetingAttendees: ['John Doe'] },
        { id: 'company123' },
        mockUser
      );
      const res = mockResponse();

      await CompanyController.updateMeetingData(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Meeting date is required'
        }
      });
    });

    it('should return 400 if meeting date is invalid', async () => {
      const req = mockRequest(
        { lastMeetingDate: 'invalid-date' },
        { id: 'company123' },
        mockUser
      );
      const res = mockResponse();

      await CompanyController.updateMeetingData(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid meeting date format'
        }
      });
    });

    it('should return 400 if attendees is not an array', async () => {
      const req = mockRequest(
        {
          lastMeetingDate: '2024-01-15',
          lastMeetingAttendees: 'John Doe'
        },
        { id: 'company123' },
        mockUser
      );
      const res = mockResponse();

      await CompanyController.updateMeetingData(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Meeting attendees must be an array of strings'
        }
      });
    });

    it('should return 400 if meeting duration is invalid', async () => {
      const req = mockRequest(
        {
          lastMeetingDate: '2024-01-15',
          lastMeetingDuration: -30
        },
        { id: 'company123' },
        mockUser
      );
      const res = mockResponse();

      await CompanyController.updateMeetingData(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Meeting duration must be a positive number (in minutes)'
        }
      });
    });
  });
});