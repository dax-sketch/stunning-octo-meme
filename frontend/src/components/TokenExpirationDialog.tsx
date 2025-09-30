import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

interface TokenExpirationDialogProps {
  open: boolean;
  onRelogin: () => void;
  onCancel: () => void;
}

export const TokenExpirationDialog: React.FC<TokenExpirationDialogProps> = ({
  open,
  onRelogin,
  onCancel,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <WarningIcon color="warning" />
          <Typography variant="h6">Session Expired</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Your session has expired for security reasons.
        </Alert>
        <Typography variant="body1" sx={{ mb: 2 }}>
          To continue using the application, please sign in again. Your work has
          been saved automatically.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This helps keep your account secure by requiring periodic
          re-authentication.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="inherit">
          Cancel
        </Button>
        <Button onClick={onRelogin} variant="contained" color="primary">
          Sign In Again
        </Button>
      </DialogActions>
    </Dialog>
  );
};
