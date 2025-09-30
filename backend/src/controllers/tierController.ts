import { Request, Response } from 'express';
import { TierService } from '../services/tierService';
import { COMPANY_TIERS, type CompanyTier } from '../config/appwrite';

export class TierController {
    private static tierService = new TierService();

    /**
     * Update all company tiers automatically (admin only)
     */
    static async updateAllTiers(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'User not authenticated',
                    },
                });
                return;
            }

            // Check if user can override tiers (CEO or Manager)
            const canOverride = await TierController.tierService.canOverrideTiers(req.user.userId);
            if (!canOverride) {
                res.status(403).json({
                    success: false,
                    error: {
                        code: 'INSUFFICIENT_PERMISSIONS',
                        message: 'Only CEOs and Managers can update tiers',
                    },
                });
                return;
            }

            const result = await TierController.tierService.updateAllTiers();

            res.json({
                success: true,
                data: result,
                message: `Updated ${result.updatedCount} companies out of ${result.totalCompanies}`,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error.message || 'Failed to update tiers',
                },
            });
        }
    }

    /**
     * Manually override a company's tier (admin only)
     */
    static async overrideTier(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'User not authenticated',
                    },
                });
                return;
            }

            const { companyId, newTier, reason } = req.body;

            if (!companyId || !newTier) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Company ID and new tier are required',
                    },
                });
                return;
            }

            if (!Object.values(COMPANY_TIERS).includes(newTier)) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid tier value',
                    },
                });
                return;
            }

            await TierController.tierService.overrideTier(
                companyId,
                newTier as CompanyTier,
                req.user.userId,
                reason
            );

            res.json({
                success: true,
                message: 'Tier updated successfully',
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error.message || 'Failed to override tier',
                },
            });
        }
    }

    /**
     * Get tier change history for a company
     */
    static async getTierHistory(req: Request, res: Response): Promise<void> {
        try {
            const { companyId } = req.params;

            if (!companyId) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Company ID is required',
                    },
                });
                return;
            }

            const history = await TierController.tierService.getTierHistory(companyId);

            res.json({
                success: true,
                data: history,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error.message || 'Failed to get tier history',
                },
            });
        }
    }

    /**
     * Get tier statistics
     */
    static async getTierStatistics(req: Request, res: Response): Promise<void> {
        try {
            const statistics = await TierController.tierService.getTierStatistics();

            res.json({
                success: true,
                data: statistics,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error.message || 'Failed to get tier statistics',
                },
            });
        }
    }

    /**
     * Get companies that need tier review
     */
    static async getCompaniesNeedingReview(req: Request, res: Response): Promise<void> {
        try {
            const companies = await TierController.tierService.getCompaniesNeedingReview();

            res.json({
                success: true,
                data: companies,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error.message || 'Failed to get companies needing review',
                },
            });
        }
    }

    /**
     * Check if current user can override tiers
     */
    static async canOverrideTiers(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'User not authenticated',
                    },
                });
                return;
            }

            const canOverride = await TierController.tierService.canOverrideTiers(req.user.userId);

            res.json({
                success: true,
                data: { canOverride },
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error.message || 'Failed to check permissions',
                },
            });
        }
    }

    /**
     * Approve a suggested tier change
     */
    static async approveTierChange(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'User not authenticated',
                    },
                });
                return;
            }

            const { companyId, newTier } = req.body;

            if (!companyId || !newTier) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Company ID and new tier are required',
                    },
                });
                return;
            }

            await TierController.tierService.overrideTier(
                companyId,
                newTier as CompanyTier,
                req.user.userId,
                'Approved tier change based on updated criteria'
            );

            res.json({
                success: true,
                message: 'Tier change approved and applied',
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error.message || 'Failed to approve tier change',
                },
            });
        }
    }
}