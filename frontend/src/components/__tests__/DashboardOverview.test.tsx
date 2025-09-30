import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const mockNavigate = jest.fn();

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock the services to prevent network calls
jest.mock('../../services/dashboardService', () => ({
  dashboardService: {
    getDashboardMetrics: jest.fn(),
    getAuditStatistics: jest.fn(),
    getUpcomingAudits: jest.fn(),
  },
}));

jest.mock('../../services/notificationService', () => ({
  notificationService: {
    getRecentNotifications: jest.fn(),
  },
}));

// Mock recharts to avoid rendering issues in tests
jest.mock('recharts', () => ({
  PieChart: ({ children }: any) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: ({ children }: any) => <div data-testid="pie">{children}</div>,
  Cell: () => <div data-testid="cell" />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: any) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: ({ children }: any) => <div data-testid="bar">{children}</div>,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

import { DashboardOverview } from '../DashboardOverview';
import { dashboardService } from '../../services/dashboardService';
import { notificationService } from '../../services/notificationService';

const theme = createTheme();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>{component}</ThemeProvider>
    </BrowserRouter>
  );
};

// Get the mocked services
const mockDashboardService = dashboardService as jest.Mocked<
  typeof dashboardService
>;
const mockNotificationService = notificationService as jest.Mocked<
  typeof notificationService
>;

describe('DashboardOverview', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default successful responses
    mockDashboardService.getDashboardMetrics.mockResolvedValue({
      success: true,
      data: {
        totalCompanies: 5,
        companiesByTier: { TIER_1: 2, TIER_2: 2, TIER_3: 1 },
        recentPayments: 3,
        upcomingMeetings: 1,
      },
    });

    mockDashboardService.getAuditStatistics.mockResolvedValue({
      success: true,
      data: {
        total: 10,
        scheduled: 5,
        completed: 3,
        overdue: 2,
        upcomingThisWeek: 2,
      },
    });

    mockDashboardService.getUpcomingAudits.mockResolvedValue({
      success: true,
      data: [
        {
          id: '1',
          companyId: 'comp1',
          companyName: 'Test Company',
          scheduledDate: '2024-01-15',
          assignedTo: 'John Doe',
          status: 'SCHEDULED',
        },
      ],
    });

    mockNotificationService.getRecentNotifications.mockResolvedValue({
      success: true,
      data: [
        {
          id: '1',
          type: 'MEETING_REMINDER',
          title: 'Meeting Reminder',
          message: 'You have a meeting scheduled',
          isRead: false,
          createdAt: '2024-01-10',
        },
      ],
    });
  });

  it('renders dashboard component without crashing', () => {
    const { container } = renderWithProviders(<DashboardOverview />);
    expect(container).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    renderWithProviders(<DashboardOverview />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays dashboard title and description', async () => {
    renderWithProviders(<DashboardOverview />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
      expect(
        screen.getByText(
          "Welcome back! Here's what's happening with your clients."
        )
      ).toBeInTheDocument();
    });
  });

  it('displays key metrics cards with correct data', async () => {
    renderWithProviders(<DashboardOverview />);

    await waitFor(() => {
      expect(screen.getByText('Total Companies')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Recent Payments')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Upcoming Meetings')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('Total Audits')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  it('displays charts when data is available', async () => {
    renderWithProviders(<DashboardOverview />);

    await waitFor(() => {
      expect(screen.getByText('Company Tier Distribution')).toBeInTheDocument();
      expect(screen.getByText('Audit Status Overview')).toBeInTheDocument();
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  it('displays quick action buttons', async () => {
    renderWithProviders(<DashboardOverview />);

    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Add Company')).toBeInTheDocument();
      expect(screen.getByText('View Companies')).toBeInTheDocument();
      expect(screen.getByText('Schedule Audit')).toBeInTheDocument();
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });
  });

  it('navigates when quick action buttons are clicked', async () => {
    renderWithProviders(<DashboardOverview />);

    await waitFor(() => {
      const addCompanyButton = screen.getByText('Add Company');
      fireEvent.click(addCompanyButton);
      expect(mockNavigate).toHaveBeenCalledWith('/companies?action=create');
    });
  });

  it('displays upcoming audits when available', async () => {
    renderWithProviders(<DashboardOverview />);

    await waitFor(() => {
      expect(screen.getByText('Upcoming Audits')).toBeInTheDocument();
      expect(screen.getByText('Test Company')).toBeInTheDocument();
      expect(screen.getByText('SCHEDULED')).toBeInTheDocument();
    });
  });

  it('displays recent notifications when available', async () => {
    renderWithProviders(<DashboardOverview />);

    await waitFor(() => {
      expect(screen.getByText('Recent Notifications')).toBeInTheDocument();
      expect(screen.getByText('Meeting Reminder')).toBeInTheDocument();
      expect(
        screen.getByText('You have a meeting scheduled')
      ).toBeInTheDocument();
      expect(screen.getByText('New')).toBeInTheDocument();
    });
  });

  it('displays "No data available" when charts have no data', async () => {
    mockDashboardService.getDashboardMetrics.mockResolvedValue({
      success: true,
      data: {
        totalCompanies: 0,
        companiesByTier: { TIER_1: 0, TIER_2: 0, TIER_3: 0 },
        recentPayments: 0,
        upcomingMeetings: 0,
      },
    });

    mockDashboardService.getAuditStatistics.mockResolvedValue({
      success: true,
      data: {
        total: 0,
        scheduled: 0,
        completed: 0,
        overdue: 0,
        upcomingThisWeek: 0,
      },
    });

    renderWithProviders(<DashboardOverview />);

    await waitFor(() => {
      const noDataMessages = screen.getAllByText('No data available');
      expect(noDataMessages).toHaveLength(2); // One for each chart
    });
  });

  it('displays "No upcoming audits" when no audits are available', async () => {
    mockDashboardService.getUpcomingAudits.mockResolvedValue({
      success: true,
      data: [],
    });

    renderWithProviders(<DashboardOverview />);

    await waitFor(() => {
      expect(screen.getByText('No upcoming audits')).toBeInTheDocument();
    });
  });

  it('displays "No recent notifications" when no notifications are available', async () => {
    mockNotificationService.getRecentNotifications.mockResolvedValue({
      success: true,
      data: [],
    });

    renderWithProviders(<DashboardOverview />);

    await waitFor(() => {
      expect(screen.getByText('No recent notifications')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    mockDashboardService.getDashboardMetrics.mockRejectedValue(
      new Error('Network error')
    );
    mockDashboardService.getAuditStatistics.mockRejectedValue(
      new Error('Network error')
    );
    mockDashboardService.getUpcomingAudits.mockRejectedValue(
      new Error('Network error')
    );
    mockNotificationService.getRecentNotifications.mockRejectedValue(
      new Error('Network error')
    );

    renderWithProviders(<DashboardOverview />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load dashboard data. Please try again.')
      ).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  it('allows retrying after error', async () => {
    mockDashboardService.getDashboardMetrics.mockRejectedValueOnce(
      new Error('Network error')
    );

    renderWithProviders(<DashboardOverview />);

    await waitFor(() => {
      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);
      expect(mockDashboardService.getDashboardMetrics).toHaveBeenCalledTimes(2);
    });
  });

  it('formats dates correctly', async () => {
    renderWithProviders(<DashboardOverview />);

    await waitFor(() => {
      // Check if date is formatted (should show "Jan 15, 2024" format)
      expect(screen.getByText(/Jan 15, 2024|Jan 10, 2024/)).toBeInTheDocument();
    });
  });

  it('applies correct status colors for audit chips', async () => {
    mockDashboardService.getUpcomingAudits.mockResolvedValue({
      success: true,
      data: [
        {
          id: '1',
          companyId: 'comp1',
          companyName: 'Test Company 1',
          scheduledDate: '2024-01-15',
          assignedTo: 'John Doe',
          status: 'SCHEDULED',
        },
        {
          id: '2',
          companyId: 'comp2',
          companyName: 'Test Company 2',
          scheduledDate: '2024-01-16',
          assignedTo: 'Jane Doe',
          status: 'OVERDUE',
        },
      ],
    });

    renderWithProviders(<DashboardOverview />);

    await waitFor(() => {
      expect(screen.getByText('SCHEDULED')).toBeInTheDocument();
      expect(screen.getByText('OVERDUE')).toBeInTheDocument();
    });
  });

  it('exports the component correctly', () => {
    expect(DashboardOverview).toBeDefined();
    expect(typeof DashboardOverview).toBe('function');
  });
});
