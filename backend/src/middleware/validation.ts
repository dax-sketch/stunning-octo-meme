import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from './errorHandler';

// Validation middleware factory
export const validate = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const details = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                value: detail.context?.value,
            }));

            throw new ValidationError('Validation failed', details);
        }

        // Replace request body with validated and sanitized data
        req.body = value;
        next();
    };
};

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }
    next();
};

// Recursively sanitize object properties
function sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
        return sanitizeString(obj.trim());
    }

    if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    }

    if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
    }

    return obj;
}

// Simple string sanitization function for backend
function sanitizeString(str: string): string {
    if (typeof str !== 'string') return str;

    return str
        // Remove HTML tags
        .replace(/<[^>]*>/g, '')
        // Remove script tags and their content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Remove javascript: protocol
        .replace(/javascript:/gi, '')
        // Remove on* event handlers
        .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
        // Remove data: URLs that could contain scripts
        .replace(/data:\s*text\/html/gi, 'data:text/plain')
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        .trim();
}

// Common validation schemas
export const validationSchemas = {
    // User validation
    userRegistration: Joi.object({
        username: Joi.string()
            .alphanum()
            .min(3)
            .max(30)
            .required()
            .messages({
                'string.alphanum': 'Username must contain only alphanumeric characters',
                'string.min': 'Username must be at least 3 characters long',
                'string.max': 'Username must not exceed 30 characters',
            }),
        email: Joi.string()
            .email()
            .required()
            .messages({
                'string.email': 'Please provide a valid email address',
            }),
        password: Joi.string()
            .min(8)
            .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]*$'))
            .required()
            .messages({
                'string.min': 'Password must be at least 8 characters long',
                'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
            }),
        phoneNumber: Joi.string()
            .pattern(new RegExp('^\\+?[1-9]\\d{1,14}$'))
            .required()
            .messages({
                'string.pattern.base': 'Please provide a valid phone number',
            }),
        role: Joi.string()
            .valid('CEO', 'MANAGER', 'TEAM_MEMBER')
            .default('TEAM_MEMBER'),
    }),

    userLogin: Joi.object({
        username: Joi.string().required(),
        password: Joi.string().required(),
    }),

    // Company validation
    company: Joi.object({
        name: Joi.string()
            .min(1)
            .max(255)
            .required()
            .messages({
                'string.min': 'Company name is required',
                'string.max': 'Company name must not exceed 255 characters',
            }),
        startDate: Joi.date()
            .iso()
            .required()
            .messages({
                'date.format': 'Start date must be in ISO format (YYYY-MM-DD)',
            }),
        phoneNumber: Joi.string()
            .pattern(new RegExp('^\\+?[1-9]\\d{1,14}$'))
            .required()
            .messages({
                'string.pattern.base': 'Please provide a valid phone number',
            }),
        email: Joi.string()
            .email()
            .required()
            .messages({
                'string.email': 'Please provide a valid email address',
            }),
        website: Joi.string()
            .uri()
            .allow('')
            .messages({
                'string.uri': 'Please provide a valid website URL',
            }),
        adSpend: Joi.number()
            .min(0)
            .default(0)
            .messages({
                'number.min': 'Weekly Ad Spend cannot be negative',
            }),
        tier: Joi.string()
            .valid('TIER_1', 'TIER_2', 'TIER_3')
            .optional(),
    }),

    companyUpdate: Joi.object({
        name: Joi.string().min(1).max(255),
        startDate: Joi.date().iso(),
        phoneNumber: Joi.string().pattern(new RegExp('^\\+?[1-9]\\d{1,14}$')),
        email: Joi.string().email(),
        website: Joi.string().uri().allow(''),
        adSpend: Joi.number().min(0),
        tier: Joi.string().valid('TIER_1', 'TIER_2', 'TIER_3'),
        lastPaymentDate: Joi.date().iso().allow(null),
        lastPaymentAmount: Joi.number().min(0).allow(null),
        lastMeetingDate: Joi.date().iso().allow(null),
        lastMeetingAttendees: Joi.array().items(Joi.string()).allow(null),
    }).min(1),

    // Note validation
    note: Joi.object({
        content: Joi.string()
            .min(1)
            .max(2000)
            .required()
            .messages({
                'string.min': 'Note content is required',
                'string.max': 'Note content must not exceed 2000 characters',
            }),
    }),

    // Notification preferences validation
    notificationPreferences: Joi.object({
        email: Joi.boolean().default(true),
        sms: Joi.boolean().default(true),
        meetingReminders: Joi.boolean().default(true),
        auditReminders: Joi.boolean().default(true),
    }),

    // User profile update validation
    userProfileUpdate: Joi.object({
        email: Joi.string().email(),
        phoneNumber: Joi.string().pattern(new RegExp('^\\+?[1-9]\\d{1,14}$')),
        notificationPreferences: Joi.object({
            email: Joi.boolean(),
            sms: Joi.boolean(),
            meetingReminders: Joi.boolean(),
            auditReminders: Joi.boolean(),
        }),
    }).min(1),

    // Audit validation
    audit: Joi.object({
        companyId: Joi.string().uuid().required(),
        scheduledDate: Joi.date().iso().required(),
        assignedTo: Joi.string().uuid().required(),
        notes: Joi.string().max(1000).allow(''),
    }),

    auditUpdate: Joi.object({
        scheduledDate: Joi.date().iso(),
        assignedTo: Joi.string().uuid(),
        status: Joi.string().valid('SCHEDULED', 'COMPLETED', 'OVERDUE'),
        notes: Joi.string().max(1000).allow(''),
        completedDate: Joi.date().iso().allow(null),
    }).min(1),
};

// Rate limiting validation
export const rateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests from this IP, please try again later',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
};