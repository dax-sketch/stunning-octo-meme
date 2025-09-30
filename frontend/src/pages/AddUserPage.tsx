import React from 'react';
import { Container, Box } from '@mui/material';
import { AddUserForm } from '../components/AddUserForm';

export const AddUserPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <AddUserForm />
      </Box>
    </Container>
  );
};
