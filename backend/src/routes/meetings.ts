import { Router } from 'express';
import { MeetingController } from '../controllers/meetingController';
import { authenticate } from '../middleware/auth';

const router = Router();
const meetingController = new MeetingController();

// Apply authentication middleware to all routes
router.use(authenticate);

// Meeting CRUD operations
router.post('/', meetingController.createMeeting);
router.get('/', meetingController.getMeetings);
router.get('/upcoming', meetingController.getUpcomingMeetings);
router.get('/completed/:companyId', meetingController.getCompletedMeetings);
router.get('/:id', meetingController.getMeetingById);
router.put('/:id', meetingController.updateMeeting);
router.put('/:id/rsvp', meetingController.updateRSVP);
router.put('/:id/notes', meetingController.addMeetingNotes);
router.delete('/:id', meetingController.deleteMeeting);

export default router;