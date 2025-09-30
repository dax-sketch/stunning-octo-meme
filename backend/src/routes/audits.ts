import { Router } from 'express';
import { AuditController } from '../controllers/auditController';
import { authenticate } from '../middleware/auth';

const router = Router();
const auditController = new AuditController();

// Apply authentication middleware to all routes
router.use(authenticate);

// Audit CRUD operations
router.post('/', auditController.createAudit);
router.get('/', auditController.getAudits);
router.get('/statistics', auditController.getAuditStatistics);
router.get('/upcoming', auditController.getUpcomingAudits);
router.get('/:id', auditController.getAuditById);
router.put('/:id', auditController.updateAudit);
router.delete('/:id', auditController.deleteAudit);

// Company-specific audit operations
router.get('/company/:companyId', auditController.getCompanyAudits);

// Audit completion
router.post('/:id/complete', auditController.completeAudit);

// Audit scheduling operations
router.post('/schedule/initial', auditController.scheduleInitialAudits);
router.post('/schedule/update-all', auditController.updateAllAuditSchedules);

// Overdue audit processing
router.post('/process-overdue', auditController.processOverdueAudits);

export default router;