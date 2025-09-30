import React from 'react';
import {
  Box,
  Button,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
} from '@mui/material';
import {
  FirstPage,
  LastPage,
  NavigateBefore,
  NavigateNext,
} from '@mui/icons-material';

interface PaginationProps {
  total: number;
  limit: number;
  offset: number;
  onPageChange: (newOffset: number) => void;
  onLimitChange: (newLimit: number) => void;
  loading?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  total,
  limit,
  offset,
  onPageChange,
  onLimitChange,
  loading = false,
}) => {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  const startItem = offset + 1;
  const endItem = Math.min(offset + limit, total);

  const handleFirstPage = () => {
    onPageChange(0);
  };

  const handlePreviousPage = () => {
    onPageChange(Math.max(0, offset - limit));
  };

  const handleNextPage = () => {
    onPageChange(Math.min(total - limit, offset + limit));
  };

  const handleLastPage = () => {
    const lastPageOffset = Math.max(0, Math.floor((total - 1) / limit) * limit);
    onPageChange(lastPageOffset);
  };

  const handleLimitChange = (event: any) => {
    const newLimit = parseInt(event.target.value);
    onLimitChange(newLimit);
    // Reset to first page when changing limit
    onPageChange(0);
  };

  if (total === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mt: 2,
        p: 2,
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Items per page</InputLabel>
          <Select
            value={limit}
            label="Items per page"
            onChange={handleLimitChange}
            disabled={loading}
          >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={25}>25</MenuItem>
            <MenuItem value={50}>50</MenuItem>
            <MenuItem value={100}>100</MenuItem>
          </Select>
        </FormControl>

        <Typography variant="body2" color="text.secondary">
          {startItem}-{endItem} of {total} items
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="body2" color="text.secondary">
          Page {currentPage} of {totalPages}
        </Typography>

        <Button
          size="small"
          onClick={handleFirstPage}
          disabled={currentPage === 1 || loading}
          startIcon={<FirstPage />}
        >
          First
        </Button>

        <Button
          size="small"
          onClick={handlePreviousPage}
          disabled={currentPage === 1 || loading}
          startIcon={<NavigateBefore />}
        >
          Previous
        </Button>

        <Button
          size="small"
          onClick={handleNextPage}
          disabled={currentPage === totalPages || loading}
          endIcon={<NavigateNext />}
        >
          Next
        </Button>

        <Button
          size="small"
          onClick={handleLastPage}
          disabled={currentPage === totalPages || loading}
          endIcon={<LastPage />}
        >
          Last
        </Button>
      </Stack>
    </Box>
  );
};
