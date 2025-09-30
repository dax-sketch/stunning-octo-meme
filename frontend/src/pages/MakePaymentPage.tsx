import React from 'react';
import { Container, Box } from '@mui/material';
import { MakePaymentForm } from '../components/MakePaymentForm';

export const MakePaymentPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <MakePaymentForm />
      </Box>
    </Container>
  );
};
