import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export class ValidationError extends Error {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  details: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  code = 'NOT_FOUND';

  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  statusCode = 401;
  code = 'UNAUTHORIZED';

  constructor(message: string = 'Unauthorized access') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  statusCode = 403;
  code = 'FORBIDDEN';

  constructor(message: string = 'Access forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends Error {
  statusCode = 409;
  code = 'CONFLICT';

  constructor(message: string = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}

// Global error handler middleware
export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error for debugging
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString(),
  });

  // Handle Appwrite errors
  if (err.name === 'AppwriteException') {
    handleAppwriteError(err, res);
    return;
  }

  // Handle custom API errors
  if (err.statusCode) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code || 'API_ERROR',
        message: err.message,
        details: err.details,
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired',
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : err.message,
      details: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    },
    timestamp: new Date().toISOString(),
  });
};

// Handle Appwrite-specific errors
function handleAppwriteError(err: any, res: Response): void {
  const statusCode = err.code || 500;
  
  switch (statusCode) {
    case 400:
      res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: err.message || 'Invalid request data',
        },
        timestamp: new Date().toISOString(),
      });
      break;

    case 401:
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: err.message || 'Authentication required',
        },
        timestamp: new Date().toISOString(),
      });
      break;

    case 404:
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: err.message || 'Resource not found',
        },
        timestamp: new Date().toISOString(),
      });
      break;

    case 409:
      res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: err.message || 'Resource conflict',
        },
        timestamp: new Date().toISOString(),
      });
      break;

    default:
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'A database error occurred',
          details: process.env.NODE_ENV === 'production' ? undefined : err.message,
        },
        timestamp: new Date().toISOString(),
      });
  }
}

// Async error wrapper to catch async errors in route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler for unmatched routes
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
    timestamp: new Date().toISOString(),
  });
};