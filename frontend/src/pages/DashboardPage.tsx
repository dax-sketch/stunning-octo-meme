import React from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import { PersonAdd as PersonAddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { DashboardOverview } from '../components/DashboardOverview';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const canAddUsers = user?.role === 'CEO' || user?.role === 'MANAGER';

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
        sx={{ mb: 4, borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 400, mb: 0.5 }}
          >
            Welcome, {user?.username}!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Role: {user?.role} | Email: {user?.email}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {canAddUsers && (
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => navigate('/add-user')}
              sx={{
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                px: 2,
                py: 0.5,
              }}
            >
              Add User
            </Button>
          )}
          <Button
            variant="outlined"
            onClick={logout}
            sx={{
              textTransform: 'uppercase',
              fontSize: '0.75rem',
              px: 2,
              py: 0.5,
            }}
          >
            Logout
          </Button>
        </Box>
      </Box>

      <DashboardOverview />
    </Container>
  );
};
