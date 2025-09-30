import React, { useState } from 'react';
import {
  Box,
  Container,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { Company } from '../types/company';
import { CompanyList, CompanyForm, CompanyProfile } from '../components';
import { TierReviewPanel } from '../components/TierReviewPanel';
import { useAuth } from '../hooks/useAuth';

type ViewMode = 'list' | 'form' | 'profile';
type TabValue = 'companies' | 'tiers';

export const CompaniesPage: React.FC = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<TabValue>('companies');

  // Check if user can manage tiers (CEO or Manager)
  const canManageTiers = user?.role === 'CEO' || user?.role === 'MANAGER';

  const handleAddCompany = () => {
    setSelectedCompany(null);
    setViewMode('form');
  };

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setViewMode('form');
  };

  const handleViewCompany = (company: Company) => {
    setSelectedCompany(company);
    setViewMode('profile');
  };

  const handleFormSuccess = (company?: Company) => {
    setViewMode('list');
    setSelectedCompany(null);
    // Always refresh the list after successful form submission
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleFormCancel = () => {
    setViewMode('list');
    setSelectedCompany(null);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedCompany(null);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: TabValue) => {
    setActiveTab(newValue);
    // Reset to list view when switching tabs
    setViewMode('list');
    setSelectedCompany(null);

    // Refresh companies list when switching back to companies tab
    if (newValue === 'companies') {
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  const handleTierChanged = () => {
    console.log('🔄 Tier changed, refreshing company list...');
    // Refresh company list when tiers change
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box>
        {/* Show tabs only if user can manage tiers and we're in list view */}
        {canManageTiers && viewMode === 'list' && (
          <Paper sx={{ mb: 3 }}>
            <Box display="flex" alignItems="center">
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                indicatorColor="primary"
                textColor="primary"
                sx={{ flex: 1 }}
              >
                <Tab label="Companies" value="companies" />
                <Tab label="Tier Review" value="tiers" />
              </Tabs>
              <Tooltip title="Refresh data">
                <IconButton
                  onClick={() => setRefreshTrigger((prev) => prev + 1)}
                  sx={{ mr: 2 }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>
        )}

        {/* Companies Tab Content */}
        {(activeTab === 'companies' || !canManageTiers) && (
          <>
            {viewMode === 'list' && (
              <CompanyList
                onAddCompany={handleAddCompany}
                onEditCompany={handleEditCompany}
                onViewCompany={handleViewCompany}
                refreshTrigger={refreshTrigger}
              />
            )}

            {viewMode === 'form' && (
              <CompanyForm
                company={selectedCompany || undefined}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            )}

            {viewMode === 'profile' && selectedCompany && (
              <CompanyProfile
                companyId={selectedCompany.id}
                onBack={handleBackToList}
                onEdit={handleEditCompany}
              />
            )}
          </>
        )}

        {/* Tier Review Tab Content */}
        {canManageTiers && activeTab === 'tiers' && viewMode === 'list' && (
          <TierReviewPanel onTierChanged={handleTierChanged} />
        )}
      </Box>
    </Container>
  );
};
