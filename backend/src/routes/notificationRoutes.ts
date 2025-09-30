import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { SchedulerController } from '../controllers/schedulerController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get user's notifications (recent/limited)
router.get('/', NotificationController.getNotifications);

// Get all user's notifications with filtering and pagination
router.get('/all', NotificationController.getAllNotifications);

// Get notification preferences
router.get('/preferences', NotificationController.getNotificationPreferences);

// Get unread notification count
router.get('/unread-count', NotificationController.getUnreadCount);

// Get specific notification
router.get('/:id', NotificationController.getNotificationById);

// Mark notification as read
router.post('/:id/mark-read', NotificationController.markAsRead);

// Mark notification as unread
router.post('/:id/mark-unread', NotificationController.markAsUnread);

// Mark all notifications as read
router.post('/mark-all-read', NotificationController.markAllAsRead);

// Update notification preferences
router.put('/preferences', NotificationController.updateNotificationPreferences);

// Create new notification (admin/manager only)
router.post('/', NotificationController.createNotification);

// Delete notification
router.delete('/:id', NotificationController.deleteNotification);

// Scheduler management routes
router.get('/scheduler/status', SchedulerController.getStatus);
// Temporarily disabled during Appwrite migration
// router.post('/scheduler/meeting-reminder', SchedulerController.scheduleMeetingReminder);
// router.post('/scheduler/restart', SchedulerController.restartScheduler);

export default router;