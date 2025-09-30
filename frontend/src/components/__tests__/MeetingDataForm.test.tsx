import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MeetingDataForm } from '../MeetingDataForm';
import { companyService } from '../../services/companyService';
import { Company } from '../../types/company';

// Mock the company service
jest.mock('../../services/companyService');
const mockedCompanyService = companyService as jest.Mocked<
  typeof companyService
>;

const mockCompany: Company = {
  id: 'company123',
  name: 'Test Company',
  startDate: '2023-01-01T00:00:00.000Z',
  phoneNumber: '+1234567890',
  email: 'test@company.com',
  website: 'https://testcompany.com',
  tier: 'TIER_2',
  adSpend: 1000,
  lastMeetingDate: '2024-01-01T00:00:00.000Z',
  lastMeetingAttendees: ['John Doe', 'Jane Smith'],
  lastMeetingDuration: 60,
  createdBy: 'user123',
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockProps = {
  open: true,
  onClose: jest.fn(),
  company: mockCompany,
  onSuccess: jest.fn(),
};

describe('MeetingDataForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders meeting data form with existing data', () => {
    render(<MeetingDataForm {...mockProps} />);

    expect(screen.getByText('Update Meeting Data')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2024-01-01')).toBeInTheDocument();
    expect(screen.getByDisplayValue('60')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('renders form with empty data for company without meeting history', () => {
    const companyWithoutMeeting = {
      ...mockCompany,
      lastMeetingDate: undefined,
      lastMeetingAttendees: undefined,
      lastMeetingDuration: undefined,
    };

    render(<MeetingDataForm {...mockProps} company={companyWithoutMeeting} />);

    expect(screen.getByLabelText(/meeting date/i)).toHaveValue('');
    expect(screen.getByLabelText(/meeting duration/i)).toHaveValue(0);
    expect(screen.getByText('No attendees added yet')).toBeInTheDocument();
  });

  it('validates required meeting date', async () => {
    const user = userEvent.setup();
    render(<MeetingDataForm {...mockProps} />);

    const dateInput = screen.getByLabelText(/meeting date/i);
    await user.clear(dateInput);

    const submitButton = screen.getByRole('button', {
      name: /update meeting data/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Please select a meeting date')
      ).toBeInTheDocument();
    });
  });

  it('validates positive meeting duration', async () => {
    const user = userEvent.setup();
    render(<MeetingDataForm {...mockProps} />);

    const durationInput = screen.getByLabelText(/meeting duration/i);
    await user.clear(durationInput);
    await user.type(durationInput, '-30');

    const submitButton = screen.getByRole('button', {
      name: /update meeting data/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Meeting duration must be greater than 0 minutes')
      ).toBeInTheDocument();
    });
  });

  it('adds and removes attendees', async () => {
    const user = userEvent.setup();
    render(<MeetingDataForm {...mockProps} />);

    // Add new attendee
    const attendeeInput = screen.getByLabelText(/add attendee/i);
    await user.type(attendeeInput, 'Bob Johnson');

    const addButton = screen.getByRole('button', { name: /add/i });
    await user.click(addButton);

    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    expect(attendeeInput).toHaveValue('');

    // Remove existing attendee
    const johnDoeChip = screen.getByText('John Doe').closest('.MuiChip-root');
    const deleteButton = johnDoeChip?.querySelector(
      '[data-testid="CancelIcon"]'
    );
    if (deleteButton) {
      await user.click(deleteButton);
    }

    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  it('adds attendee on Enter key press', async () => {
    const user = userEvent.setup();
    render(<MeetingDataForm {...mockProps} />);

    const attendeeInput = screen.getByLabelText(/add attendee/i);
    await user.type(attendeeInput, 'Alice Cooper');
    await user.keyboard('{Enter}');

    expect(screen.getByText('Alice Cooper')).toBeInTheDocument();
    expect(attendeeInput).toHaveValue('');
  });

  it('prevents duplicate attendees', async () => {
    const user = userEvent.setup();
    render(<MeetingDataForm {...mockProps} />);

    const attendeeInput = screen.getByLabelText(/add attendee/i);
    await user.type(attendeeInput, 'John Doe'); // Already exists

    const addButton = screen.getByRole('button', { name: /add/i });
    await user.click(addButton);

    // Should still only have one "John Doe"
    const johnDoeElements = screen.getAllByText('John Doe');
    expect(johnDoeElements).toHaveLength(1);
  });

  it('submits form successfully with all data', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      success: true,
      data: {
        ...mockCompany,
        lastMeetingDate: '2024-02-01T00:00:00.000Z',
        lastMeetingAttendees: ['John Doe', 'Jane Smith', 'Bob Johnson'],
        lastMeetingDuration: 90,
      },
    };

    mockedCompanyService.updateMeetingData.mockResolvedValue(mockResponse);

    render(<MeetingDataForm {...mockProps} />);

    // Update date
    const dateInput = screen.getByLabelText(/meeting date/i);
    await user.clear(dateInput);
    await user.type(dateInput, '2024-02-01');

    // Update duration
    const durationInput = screen.getByLabelText(/meeting duration/i);
    await user.clear(durationInput);
    await user.type(durationInput, '90');

    // Add attendee
    const attendeeInput = screen.getByLabelText(/add attendee/i);
    await user.type(attendeeInput, 'Bob Johnson');
    const addButton = screen.getByRole('button', { name: /add/i });
    await user.click(addButton);

    const submitButton = screen.getByRole('button', {
      name: /update meeting data/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockedCompanyService.updateMeetingData).toHaveBeenCalledWith(
        'company123',
        {
          lastMeetingDate: '2024-02-01',
          lastMeetingAttendees: ['John Doe', 'Jane Smith', 'Bob Johnson'],
          lastMeetingDuration: 90,
        }
      );
      expect(mockProps.onSuccess).toHaveBeenCalledWith(mockResponse.data);
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  it('submits form with only date (minimal data)', async () => {
    const user = userEvent.setup();
    const companyWithoutMeeting = {
      ...mockCompany,
      lastMeetingDate: undefined,
      lastMeetingAttendees: undefined,
      lastMeetingDuration: undefined,
    };

    const mockResponse = {
      success: true,
      data: {
        ...companyWithoutMeeting,
        lastMeetingDate: '2024-02-01T00:00:00.000Z',
      },
    };

    mockedCompanyService.updateMeetingData.mockResolvedValue(mockResponse);

    render(<MeetingDataForm {...mockProps} company={companyWithoutMeeting} />);

    const dateInput = screen.getByLabelText(/meeting date/i);
    await user.type(dateInput, '2024-02-01');

    const submitButton = screen.getByRole('button', {
      name: /update meeting data/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockedCompanyService.updateMeetingData).toHaveBeenCalledWith(
        'company123',
        {
          lastMeetingDate: '2024-02-01',
        }
      );
    });
  });

  it('handles API error', async () => {
    const user = userEvent.setup();
    const mockErrorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid meeting data',
      },
    };

    mockedCompanyService.updateMeetingData.mockResolvedValue(mockErrorResponse);

    render(<MeetingDataForm {...mockProps} />);

    const submitButton = screen.getByRole('button', {
      name: /update meeting data/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid meeting data')).toBeInTheDocument();
    });
  });

  it('handles network error', async () => {
    const user = userEvent.setup();
    mockedCompanyService.updateMeetingData.mockRejectedValue(
      new Error('Network error')
    );

    render(<MeetingDataForm {...mockProps} />);

    const submitButton = screen.getByRole('button', {
      name: /update meeting data/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('An unexpected error occurred')
      ).toBeInTheDocument();
    });
  });

  it('closes dialog on cancel and resets form', async () => {
    const user = userEvent.setup();
    render(<MeetingDataForm {...mockProps} />);

    // Make some changes
    const attendeeInput = screen.getByLabelText(/add attendee/i);
    await user.type(attendeeInput, 'Test User');

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('disables form during submission', async () => {
    const user = userEvent.setup();
    mockedCompanyService.updateMeetingData.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    render(<MeetingDataForm {...mockProps} />);

    const submitButton = screen.getByRole('button', {
      name: /update meeting data/i,
    });
    await user.click(submitButton);

    expect(screen.getByText('Updating...')).toBeInTheDocument();
    expect(screen.getByLabelText(/meeting date/i)).toBeDisabled();
    expect(screen.getByLabelText(/meeting duration/i)).toBeDisabled();
    expect(screen.getByLabelText(/add attendee/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });

  it('does not render when closed', () => {
    render(<MeetingDataForm {...mockProps} open={false} />);
    expect(screen.queryByText('Update Meeting Data')).not.toBeInTheDocument();
  });
});
