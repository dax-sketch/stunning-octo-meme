import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import App from '../App';
import { authService } from '../services/authService';
import { companyService } from '../services/companyService';
import { noteService } from '../services/noteService';

// Mock services
jest.mock('../services/authService');
jest.mock('../services/companyService');
jest.mock('../services/noteService');

const mockedAuthService = authService as jest.Mocked<typeof authService>;
const mockedCompanyService = companyService as jest.Mocked<
  typeof companyService
>;
const mockedNoteService = noteService as jest.Mocked<typeof noteService>;

const theme = createTheme();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Complete User Workflows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('User Registration and Login Workflow', () => {
    it('should complete full registration and login flow', async () => {
      const user = userEvent.setup();

      // Mock successful registration
      mockedAuthService.register.mockResolvedValue({
        success: true,
        data: {
          user: {
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            phoneNumber: '+1234567890',
            role: 'TEAM_MEMBER' as const,
          },
          token: 'mock-token',
        },
      });

      // Mock successful login
      mockedAuthService.login.mockResolvedValue({
        success: true,
        data: {
          user: {
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            phoneNumber: '+1234567890',
            role: 'TEAM_MEMBER' as const,
          },
          token: 'mock-token',
        },
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Navigate to registration
      const registerLink = screen.getByText(/don't have an account/i);
      await user.click(registerLink);

      // Fill registration form
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/phone number/i), '+1234567890');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');

      // Submit registration
      const registerButton = screen.getByRole('button', { name: /register/i });
      await user.click(registerButton);

      await waitFor(() => {
        expect(mockedAuthService.register).toHaveBeenCalledWith({
          username: 'testuser',
          email: 'test@example.com',
          phoneNumber: '+1234567890',
          password: 'password123',
        });
      });

      // Should redirect to login after successful registration
      await waitFor(() => {
        expect(screen.getByText(/login/i)).toBeInTheDocument();
      });

      // Fill login form
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'password123');

      // Submit login
      const loginButton = screen.getByRole('button', { name: /login/i });
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockedAuthService.login).toHaveBeenCalledWith({
          username: 'testuser',
          password: 'password123',
        });
      });

      // Should redirect to dashboard after successful login
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });
    });
  });

  describe('Company Management Workflow', () => {
    beforeEach(() => {
      // Mock authenticated user
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          phoneNumber: '+1234567890',
          role: 'TEAM_MEMBER' as const,
        })
      );

      // Mock authService methods
      mockedAuthService.getStoredToken.mockReturnValue('mock-token');
      mockedAuthService.getStoredUser.mockReturnValue({
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        phoneNumber: '+1234567890',
        role: 'TEAM_MEMBER' as const,
      });
    });

    it('should complete full company creation and management flow', async () => {
      const user = userEvent.setup();

      // Mock company creation
      mockedCompanyService.createCompany.mockResolvedValue({
        success: true,
        data: {
          id: '1',
          name: 'Test Company',
          startDate: new Date('2024-01-01'),
          phoneNumber: '+1234567890',
          email: 'company@test.com',
          website: 'https://test.com',
          tier: 'TIER_2' as const,
          adSpend: 5000,
          createdBy: '1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Mock company list
      mockedCompanyService.getCompanies.mockResolvedValue({
        success: true,
        data: [
          {
            id: '1',
            name: 'Test Company',
            startDate: new Date('2024-01-01'),
            phoneNumber: '+1234567890',
            email: 'company@test.com',
            website: 'https://test.com',
            tier: 'TIER_2' as const,
            adSpend: 5000,
            createdBy: '1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        pagination: {
          total: 1,
          limit: 10,
          offset: 0,
          hasMore: false,
        },
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Navigate to companies page
      const companiesLink = screen.getByText(/companies/i);
      await user.click(companiesLink);

      // Click add company button
      const addCompanyButton = screen.getByText(/add company/i);
      await user.click(addCompanyButton);

      // Fill company form
      await user.type(screen.getByLabelText(/company name/i), 'Test Company');
      await user.type(screen.getByLabelText(/phone number/i), '+1234567890');
      await user.type(screen.getByLabelText(/email/i), 'company@test.com');
      await user.type(screen.getByLabelText(/website/i), 'https://test.com');

      // Set start date
      const startDateInput = screen.getByLabelText(/start date/i);
      await user.clear(startDateInput);
      await user.type(startDateInput, '2024-01-01');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockedCompanyService.createCompany).toHaveBeenCalledWith({
          name: 'Test Company',
          startDate: '2024-01-01',
          phoneNumber: '+1234567890',
          email: 'company@test.com',
          website: 'https://test.com',
        });
      });

      // Should show success message and redirect to company list
      await waitFor(() => {
        expect(
          screen.getByText(/company created successfully/i)
        ).toBeInTheDocument();
      });

      // Verify company appears in list
      await waitFor(() => {
        expect(screen.getByText('Test Company')).toBeInTheDocument();
      });
    });
  });

  describe('Notes Management Workflow', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          phoneNumber: '+1234567890',
          role: 'TEAM_MEMBER' as const,
        })
      );

      // Mock authService methods
      mockedAuthService.getStoredToken.mockReturnValue('mock-token');
      mockedAuthService.getStoredUser.mockReturnValue({
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        phoneNumber: '+1234567890',
        role: 'TEAM_MEMBER' as const,
      });

      // Mock company details
      mockedCompanyService.getCompany.mockResolvedValue({
        success: true,
        data: {
          id: '1',
          name: 'Test Company',
          startDate: new Date('2024-01-01'),
          phoneNumber: '+1234567890',
          email: 'company@test.com',
          website: 'https://test.com',
          tier: 'TIER_2' as const,
          adSpend: 5000,
          createdBy: '1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    });

    it('should complete full note creation and management flow', async () => {
      const user = userEvent.setup();

      // Mock note creation
      mockedNoteService.createNote.mockResolvedValue({
        id: '1',
        companyId: '1',
        userId: '1',
        content: 'Test note content',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: {
          id: '1',
          username: 'testuser',
        },
      });

      // Mock notes list
      mockedNoteService.getNotesByCompany.mockResolvedValue([
        {
          id: '1',
          companyId: '1',
          userId: '1',
          content: 'Test note content',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          user: {
            id: '1',
            username: 'testuser',
          },
        },
      ]);

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Navigate to company profile
      const companiesLink = screen.getByText(/companies/i);
      await user.click(companiesLink);

      // Click on company to view profile
      const companyCard = screen.getByText('Test Company');
      await user.click(companyCard);

      // Navigate to notes tab
      const notesTab = screen.getByText(/notes/i);
      await user.click(notesTab);

      // Add a new note
      const noteTextarea = screen.getByLabelText(/add note/i);
      await user.type(noteTextarea, 'Test note content');

      const addNoteButton = screen.getByRole('button', { name: /add note/i });
      await user.click(addNoteButton);

      await waitFor(() => {
        expect(mockedNoteService.createNote).toHaveBeenCalledWith('1', {
          content: 'Test note content',
        });
      });

      // Verify note appears in list
      await waitFor(() => {
        expect(screen.getByText('Test note content')).toBeInTheDocument();
      });
    });
  });
});
