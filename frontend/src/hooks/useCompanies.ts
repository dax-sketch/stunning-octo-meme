import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '../services/companyService';
import { queryKeys } from '../lib/queryClient';
import {
  CompanyFilters,
  CreateCompanyData,
  UpdateCompanyData,
} from '../types/company';

// Hook for fetching companies with filters
export const useCompanies = (filters?: CompanyFilters) => {
  return useQuery({
    queryKey: queryKeys.companies.list(filters),
    queryFn: () => companyService.getCompanies(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes for company lists
    gcTime: 5 * 60 * 1000, // 5 minutes cache time
  });
};

// Hook for fetching a single company
export const useCompany = (id: string) => {
  return useQuery({
    queryKey: queryKeys.companies.detail(id),
    queryFn: () => companyService.getCompany(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes for individual companies
  });
};

// Hook for creating a company
export const useCreateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCompanyData) => companyService.createCompany(data),
    onSuccess: () => {
      // Invalidate and refetch company lists
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.lists() });
      // Invalidate dashboard data
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
};

// Hook for updating a company
export const useUpdateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCompanyData }) =>
      companyService.updateCompany(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate specific company
      queryClient.invalidateQueries({
        queryKey: queryKeys.companies.detail(id),
      });
      // Invalidate company lists
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.lists() });
      // Invalidate dashboard data
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
};

// Hook for deleting a company
export const useDeleteCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => companyService.deleteCompany(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.companies.detail(id) });
      // Invalidate company lists
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.lists() });
      // Invalidate dashboard data
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
};

// Hook for updating payment data
export const useUpdatePaymentData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { lastPaymentDate: string; lastPaymentAmount: number };
    }) => companyService.updatePaymentData(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate specific company
      queryClient.invalidateQueries({
        queryKey: queryKeys.companies.detail(id),
      });
      // Invalidate company lists to update any displayed payment info
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.lists() });
    },
  });
};

// Hook for updating meeting data
export const useUpdateMeetingData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        lastMeetingDate: string;
        lastMeetingAttendees?: string[];
        lastMeetingDuration?: number;
      };
    }) => companyService.updateMeetingData(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate specific company
      queryClient.invalidateQueries({
        queryKey: queryKeys.companies.detail(id),
      });
      // Invalidate company lists to update any displayed meeting info
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.lists() });
    },
  });
};
