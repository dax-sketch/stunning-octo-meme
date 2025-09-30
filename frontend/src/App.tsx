import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './hooks/useAuth';
import { TokenExpirationProvider } from './hooks/useTokenExpiration';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import {
  CompaniesPage,
  AuditsPage,
  NotificationsPage,
  MakePaymentPage,
  AddUserPage,
} from './pages';
import { UserSettingsPageLazy } from './components/LazyComponents';
import { ScheduleMeetingPage } from './pages/ScheduleMeetingPage';
import './utils/tokenDebug'; // Import token debug utility

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TokenExpirationProvider>
            <Router>
              <ErrorBoundary>
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<LoginPage />} />

                  {/* Protected routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/companies"
                    element={
                      <ProtectedRoute>
                        <CompaniesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/audits"
                    element={
                      <ProtectedRoute>
                        <AuditsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/notifications"
                    element={
                      <ProtectedRoute>
                        <NotificationsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <UserSettingsPageLazy />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/schedule-meeting"
                    element={
                      <ProtectedRoute>
                        <ScheduleMeetingPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/make-payment"
                    element={
                      <ProtectedRoute>
                        <MakePaymentPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/add-user"
                    element={
                      <ProtectedRoute>
                        <AddUserPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Default redirect */}
                  <Route
                    path="/"
                    element={<Navigate to="/dashboard" replace />}
                  />

                  {/* Catch all - redirect to dashboard */}
                  <Route
                    path="*"
                    element={<Navigate to="/dashboard" replace />}
                  />
                </Routes>
              </ErrorBoundary>
            </Router>
          </TokenExpirationProvider>
        </AuthProvider>
        {/* React Query DevTools - only in development */}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
