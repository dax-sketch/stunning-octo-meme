import React from 'react';
import { Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ScheduleMeetingForm } from '../components/ScheduleMeetingForm';

export const ScheduleMeetingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleSuccess = () => {
    // Navigate back to dashboard after successful meeting creation
    navigate('/dashboard');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <ScheduleMeetingForm onBack={handleBack} onSuccess={handleSuccess} />
    </Container>
  );
};
