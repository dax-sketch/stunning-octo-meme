import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TokenExpirationDialog } from '../components/TokenExpirationDialog';
import { useAuth } from './useAuth';

interface TokenExpirationContextType {
  showExpirationDialog: () => void;
}

const TokenExpirationContext = createContext<
  TokenExpirationContextType | undefined
>(undefined);

interface TokenExpirationProviderProps {
  children: ReactNode;
}

export const TokenExpirationProvider: React.FC<
  TokenExpirationProviderProps
> = ({ children }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { logout } = useAuth();

  const showExpirationDialog = () => {
    setDialogOpen(true);
  };

  // Set up global handler when provider mounts
  React.useEffect(() => {
    setGlobalTokenExpirationHandler(showExpirationDialog);
    return () => {
      setGlobalTokenExpirationHandler(() => {});
    };
  }, []);

  const handleRelogin = () => {
    setDialogOpen(false);
    logout();
    // The logout will trigger a redirect to login page
  };

  const handleCancel = () => {
    setDialogOpen(false);
    // User chose to cancel, but they'll still be logged out
    logout();
  };

  const value: TokenExpirationContextType = {
    showExpirationDialog,
  };

  return (
    <TokenExpirationContext.Provider value={value}>
      {children}
      <TokenExpirationDialog
        open={dialogOpen}
        onRelogin={handleRelogin}
        onCancel={handleCancel}
      />
    </TokenExpirationContext.Provider>
  );
};

export const useTokenExpiration = (): TokenExpirationContextType => {
  const context = useContext(TokenExpirationContext);
  if (context === undefined) {
    throw new Error(
      'useTokenExpiration must be used within a TokenExpirationProvider'
    );
  }
  return context;
};

// Global function to show expiration dialog
let globalShowExpirationDialog: (() => void) | null = null;

export const setGlobalTokenExpirationHandler = (handler: () => void) => {
  globalShowExpirationDialog = handler;
};

export const showGlobalTokenExpirationDialog = () => {
  if (globalShowExpirationDialog) {
    globalShowExpirationDialog();
  }
};
