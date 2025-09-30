import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationsPage } from '../NotificationsPage';
import { notificationService } from '../../services/notificationService';

// Mock the notification service
jest.mock('../../services/notificationService');
const mockNotificationService = notificationService as jest.Mocked<
  typeof notificationService
>;

// Mock data
const mockNotifications = [
  {
    id: '1',
    title: 'Test Notification',
    message: 'This is a test notification',
    type: 'MEETING_REMINDER' as const,
    isRead: false,
    createdAt: '2024-01-14T10:00:00Z',
    category: 'audit' as const,
    relatedCompanyId: 'company1',
  },
  {
    id: '2',
    title: 'Read Notification',
    message: 'This notification is already read',
    type: 'AUDIT_DUE' as const,
    isRead: true,
    createdAt: '2024-01-13T15:30:00Z',
    category: 'audit' as const,
    relatedCompanyId: 'company2',
  },
];

describe('NotificationsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock responses
    mockNotificationService.getAllNotifications.mockResolvedValue({
      success: true,
      data: mockNotifications,
    });

    mockNotificationService.getUnreadCount.mockResolvedValue({
      success: true,
      data: { unreadCount: 1 },
    });
  });

  it('renders notifications page with title and notifications', async () => {
    render(<NotificationsPage />);

    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(
      screen.getByText('Stay updated with important information')
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Test Notification')).toBeInTheDocument();
      expect(screen.getByText('Read Notification')).toBeInTheDocument();
    });
  });

  it('displays unread count badge', async () => {
    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument(); // Badge count
    });
  });

  it('allows filtering notifications', async () => {
    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Notification')).toBeInTheDocument();
    });

    // Click on filter dropdown
    const filterSelect = screen.getByLabelText('Filter');
    fireEvent.mouseDown(filterSelect);

    // Select unread filter
    const unreadOption = screen.getByText('Unread (1)');
    fireEvent.click(unreadOption);

    // Should call service with isRead: false filter
    await waitFor(() => {
      expect(mockNotificationService.getAllNotifications).toHaveBeenCalledWith(
        expect.objectContaining({ isRead: false }),
        20,
        0
      );
    });
  });

  it('allows searching notifications', async () => {
    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Notification')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      'Search by title or message...'
    );
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(mockNotificationService.getAllNotifications).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'test' }),
        20,
        0
      );
    });
  });

  it('marks notification as read when clicked', async () => {
    mockNotificationService.markAsRead.mockResolvedValue({ success: true });

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Notification')).toBeInTheDocument();
    });

    // Find and click the mark as read button for the unread notification
    const markReadButtons = screen.getAllByTitle('Mark as read');
    fireEvent.click(markReadButtons[0]);

    await waitFor(() => {
      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('1');
    });
  });

  it('marks all notifications as read', async () => {
    mockNotificationService.markAllAsRead.mockResolvedValue({ success: true });

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Mark All Read')).toBeInTheDocument();
    });

    const markAllReadButton = screen.getByText('Mark All Read');
    fireEvent.click(markAllReadButton);

    await waitFor(() => {
      expect(mockNotificationService.markAllAsRead).toHaveBeenCalled();
    });
  });

  it('deletes notification when delete button is clicked', async () => {
    mockNotificationService.deleteNotification.mockResolvedValue({
      success: true,
    });

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Notification')).toBeInTheDocument();
    });

    // Find and click the delete button
    const deleteButtons = screen.getAllByTitle('Delete notification');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockNotificationService.deleteNotification).toHaveBeenCalledWith(
        '1'
      );
    });
  });

  it('opens notification preferences when settings button is clicked', async () => {
    render(<NotificationsPage />);

    const settingsButton = screen.getByText('Settings');
    fireEvent.click(settingsButton);

    await waitFor(() => {
      expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
    });
  });

  it('handles loading state', () => {
    // Mock service to never resolve to test loading state
    mockNotificationService.getAllNotifications.mockImplementation(
      () => new Promise(() => {})
    );
    mockNotificationService.getUnreadCount.mockImplementation(
      () => new Promise(() => {})
    );

    render(<NotificationsPage />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    mockNotificationService.getAllNotifications.mockResolvedValue({
      success: false,
      error: { message: 'Failed to load notifications' },
    });

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load notifications')
      ).toBeInTheDocument();
    });
  });

  it('displays empty state when no notifications', async () => {
    mockNotificationService.getAllNotifications.mockResolvedValue({
      success: true,
      data: [],
    });

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('No notifications found')).toBeInTheDocument();
      expect(screen.getByText("You're all caught up!")).toBeInTheDocument();
    });
  });
});
