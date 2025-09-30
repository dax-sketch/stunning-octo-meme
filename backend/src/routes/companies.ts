import express from 'express';
import { CompanyController } from '../controllers/companyController';
import { authenticate } from '../middleware/auth';
import { cacheMiddleware, cacheHeaders } from '../middleware/cache';

const router = express.Router();

// All company routes require authentication
router.use(authenticate);

// GET /api/companies - Get companies with filtering and pagination
router.get('/', cacheHeaders(180), cacheMiddleware(180), CompanyController.getMany);

// POST /api/companies - Create new company
router.post('/', CompanyController.create);

// GET /api/companies/:id - Get company by ID
router.get('/:id', cacheHeaders(300), cacheMiddleware(300), CompanyController.getById);

// PUT /api/companies/:id - Update company
router.put('/:id', CompanyController.update);

// DELETE /api/companies/:id - Delete company
router.delete('/:id', CompanyController.delete);

// PUT /api/companies/:id/payment - Update payment data
router.put('/:id/payment', CompanyController.updatePaymentData);

// PUT /api/companies/:id/meeting - Update meeting data
router.put('/:id/meeting', CompanyController.updateMeetingData);

// POST /api/companies/update-tiers - Update all company tiers (admin only)
router.post('/update-tiers', CompanyController.updateTiers);

export default router;