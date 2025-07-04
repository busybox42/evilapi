const logger = require('../utils/logger');

// Standard error response format
const createErrorResponse = (message, statusCode = 500, details = null) => {
  return {
    success: false,
    error: {
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      ...(details && { details })
    }
  };
};

// Validation error middleware
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      const errorResponse = createErrorResponse(
        'Validation failed',
        400,
        error.details.map(detail => detail.message)
      );
      return res.status(400).json(errorResponse);
    }
    next();
  };
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Standard success response
const createSuccessResponse = (data, message = 'Success') => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

// Global error handler
const globalErrorHandler = (err, req, res, next) => {
  // Log error
  logger.error(`Error in ${req.method} ${req.path}:`, err);

  // Handle different error types
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (err.code === 'ENOTFOUND') {
    statusCode = 404;
    message = 'Domain or resource not found';
  } else if (err.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Service unavailable - connection refused';
  }

  const errorResponse = createErrorResponse(message, statusCode);
  res.status(statusCode).json(errorResponse);
};

module.exports = {
  createErrorResponse,
  createSuccessResponse,
  validateRequest,
  asyncHandler,
  globalErrorHandler
}; 