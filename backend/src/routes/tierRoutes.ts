import { Router } from 'express';
import { TierController } from '../controllers/tierController';
import { authenticate } from '../middleware/auth';
import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

const router = Router();

// Validation schemas
const overrideTierSchema = Joi.object({
  tier: Joi.string().valid('TIER_1', 'TIER_2', 'TIER_3').required(),
  reason: Joi.string().max(500).optional()
});

// Validation middleware
const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details?.[0]?.message || 'Validation failed'
        }
      });
      return;
    }
    next();
  };
};

// All tier routes require authentication
router.use(authenticate);

/**
 * POST /api/tiers/update-all
 * Update all company tiers automatically
 * Requires: CEO or Manager role
 */
router.post('/update-all', TierController.updateAllTiers);

/**
 * POST /api/tiers/companies/:companyId/override
 * Manually override a company's tier
 * Requires: CEO or Manager role
 */
router.post(
  '/companies/:companyId/override',
  validateRequest(overrideTierSchema),
  TierController.overrideTier
);

/**
 * GET /api/tiers/companies/:companyId/history
 * Get tier change history for a company
 */
router.get('/companies/:companyId/history', TierController.getTierHistory);

/**
 * GET /api/tiers/statistics
 * Get tier distribution and statistics
 */
router.get('/statistics', TierController.getTierStatistics);

/**
 * GET /api/tiers/review
 * Get companies that need tier review
 * Requires: CEO or Manager role
 */
router.get('/review', TierController.getCompaniesNeedingReview);

/**
 * GET /api/tiers/can-override
 * Check if current user can override tiers
 */
router.get('/can-override', TierController.canOverrideTiers);

/**
 * POST /api/tiers/approve
 * Approve a suggested tier change
 * Requires: CEO or Manager role
 */
router.post('/approve', TierController.approveTierChange);

export { router as tierRoutes };