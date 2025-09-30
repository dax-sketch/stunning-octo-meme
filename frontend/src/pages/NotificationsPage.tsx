import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Divider,
  Badge,
  Alert,
  CircularProgress,
  Pagination,
} from '@mui/material';

import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  MarkEmailRead as MarkEmailReadIcon,
  MarkEmailUnread as MarkEmailUnreadIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  notificationService,
  Notification,
  NotificationFilters,
} from '../services/notificationService';
import { NotificationPreferences } from '../components/NotificationPreferences';

const ITEMS_PER_PAGE = 20;

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, [currentPage, filter, searchTerm]);

  const loadNotifications = async () => {
    setLoading(true);
    setError(null);

    try {
      const filters: NotificationFilters = {};

      if (filter === 'unread') {
        filters.isRead = false;
      } else if (filter === 'read') {
        filters.isRead = true;
      } else if (filter !== 'all') {
        filters.category = filter as any;
      }

      if (searchTerm.trim()) {
        filters.search = searchTerm.trim();
      }

      const response = await notificationService.getAllNotifications(
        filters,
        ITEMS_PER_PAGE,
        (currentPage - 1) * ITEMS_PER_PAGE
      );

      if (response.success) {
        // Handle both array data and empty results
        const notificationData = response.data || [];
        setNotifications(notificationData);
        // Calculate total pages (this would ideally come from the API)
        setTotalPages(
          Math.ceil(Math.max(1, notificationData.length / ITEMS_PER_PAGE))
        );
      } else {
        console.error('Notification API error:', response.error);
        setError(response.error?.message || 'Failed to load notifications');
      }
    } catch (err) {
      console.error('Notification loading error:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await notificationService.getUnreadCount();
      if (response.success && response.data) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to load unread count:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadNotifications(), loadUnreadCount()]);
    setRefreshing(false);
  };

  const handleFilterChange = (event: SelectChangeEvent) => {
    setFilter(event.target.value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    page: number
  ) => {
    setCurrentPage(page);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await notificationService.markAsRead(notificationId);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? { ...notification, isRead: true }
              : notification
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } else {
        setError(response.error?.message || 'Failed to mark as read');
      }
    } catch (err) {
      setError('Failed to mark notification as read');
    }
  };

  const handleMarkAsUnread = async (notificationId: string) => {
    try {
      const response = await notificationService.markAsUnread(notificationId);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? { ...notification, isRead: false }
              : notification
          )
        );
        setUnreadCount((prev) => prev + 1);
      } else {
        setError(response.error?.message || 'Failed to mark as unread');
      }
    } catch (err) {
      setError('Failed to mark notification as unread');
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      const response =
        await notificationService.deleteNotification(notificationId);
      if (response.success) {
        const deletedNotification = notifications.find(
          (n) => n.id === notificationId
        );
        setNotifications((prev) =>
          prev.filter((notification) => notification.id !== notificationId)
        );
        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } else {
        setError(response.error?.message || 'Failed to delete notification');
      }
    } catch (err) {
      setError('Failed to delete notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await notificationService.markAllAsRead();
      if (response.success) {
        setNotifications((prev) =>
          prev.map((notification) => ({ ...notification, isRead: true }))
        );
        setUnreadCount(0);
      } else {
        setError(response.error?.message || 'Failed to mark all as read');
      }
    } catch (err) {
      setError('Failed to mark all notifications as read');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'MEETING_REMINDER':
        return <InfoIcon color="info" />;
      case 'AUDIT_DUE':
        return <WarningIcon color="warning" />;
      case 'COMPANY_MILESTONE':
        return <CheckCircleIcon color="success" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'MEETING_REMINDER':
        return 'info';
      case 'AUDIT_DUE':
        return 'warning';
      case 'COMPANY_MILESTONE':
        return 'success';
      default:
        return 'info';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'MEETING_REMINDER':
        return 'Meeting';
      case 'AUDIT_DUE':
        return 'Audit';
      case 'COMPANY_MILESTONE':
        return 'Milestone';
      default:
        return type;
    }
  };

  // Notifications are already filtered by the API, so we just use them directly
  const filteredNotifications = notifications;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsActiveIcon fontSize="large" />
            </Badge>
            <Box>
              <Typography variant="h4" component="h1">
                Notifications
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Stay updated with important information
              </Typography>
            </Box>
          </Box>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={
                refreshing ? <CircularProgress size={16} /> : <RefreshIcon />
              }
              onClick={handleRefresh}
              disabled={refreshing}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<MarkEmailReadIcon />}
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              Mark All Read
            </Button>
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => setPreferencesOpen(true)}
            >
              Settings
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            mb: 3,
          }}
        >
          <Box sx={{ flex: '2 1 300px', minWidth: '250px' }}>
            <TextField
              fullWidth
              label="Search notifications"
              variant="outlined"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by title or message..."
              disabled={loading}
            />
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: '150px' }}>
            <FormControl fullWidth>
              <InputLabel>Filter</InputLabel>
              <Select
                value={filter}
                label="Filter"
                onChange={handleFilterChange}
                disabled={loading}
              >
                <MenuItem value="all">All Notifications</MenuItem>
                <MenuItem value="unread">Unread ({unreadCount})</MenuItem>
                <MenuItem value="read">Read</MenuItem>
                <Divider />
                <MenuItem value="audit">Audit</MenuItem>
                <MenuItem value="company">Company</MenuItem>
                <MenuItem value="role">Role</MenuItem>
                <MenuItem value="system">System</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Notifications List */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : filteredNotifications.length > 0 ? (
          <>
            <List>
              {filteredNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    sx={{
                      backgroundColor: notification.isRead
                        ? 'transparent'
                        : 'action.hover',
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <ListItemIcon>
                      {getNotificationIcon(notification.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography
                            variant="subtitle1"
                            fontWeight={notification.isRead ? 'normal' : 'bold'}
                          >
                            {notification.title}
                          </Typography>
                          <Chip
                            label={getTypeLabel(notification.type)}
                            color={getTypeColor(notification.type) as any}
                            size="small"
                          />
                          <Chip
                            label={notification.category}
                            variant="outlined"
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 0.5 }}
                          >
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(notification.createdAt).toLocaleString()}
                          </Typography>
                        </Box>
                      }
                    />
                    <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                      <IconButton
                        edge="end"
                        onClick={() =>
                          notification.isRead
                            ? handleMarkAsUnread(notification.id)
                            : handleMarkAsRead(notification.id)
                        }
                        title={
                          notification.isRead
                            ? 'Mark as unread'
                            : 'Mark as read'
                        }
                      >
                        {notification.isRead ? (
                          <MarkEmailUnreadIcon />
                        ) : (
                          <MarkEmailReadIcon />
                        )}
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => handleDelete(notification.id)}
                        title="Delete notification"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </ListItem>
                  {index < filteredNotifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={3}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            )}
          </>
        ) : (
          <Box textAlign="center" py={4}>
            <NotificationsIcon
              sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No notifications found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {filter !== 'all' || searchTerm
                ? 'Try adjusting your filters'
                : "You're all caught up!"}
            </Typography>
          </Box>
        )}
      </Paper>

      <NotificationPreferences
        open={preferencesOpen}
        onClose={() => setPreferencesOpen(false)}
      />
    </Container>
  );
};
