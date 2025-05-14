// server/middleware/validators.js
const { body, query, validationResult } = require('express-validator');

/**
 * Middleware for validating API requests
 */
const validators = {
  /**
   * Validate incoming crawl requests
   */
  validateCrawlRequest: [
    body('urls')
      .isArray({ min: 1 })
      .withMessage('At least one URL is required'),
    body('urls.*')
      .isURL({ protocols: ['http', 'https'], require_protocol: true })
      .withMessage('Invalid URL format, must include http or https protocol'),
    body('vendorId')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage('VendorId must be a valid string'),
    body('settings')
      .optional()
      .isObject()
      .withMessage('Settings must be an object'),
    
    // Check for validation errors
    (req, res, next) => {
      const errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: errors.array()
        });
      }
      
      next();
    }
  ],
  
  /**
   * Validate pagination parameters
   */
  validatePaginationParams: [
    query('page')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Page must be a non-negative integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('vendorId')
      .optional()
      .isString()
      .trim(),
    query('status')
      .optional()
      .isString()
      .trim()
      .isIn(['pending', 'running', 'completed', 'failed', 'cancelled'])
      .withMessage('Invalid status value'),
      
    // Check for validation errors
    (req, res, next) => {
      const errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array()
        });
      }
      
      next();
    }
  ],
  
  /**
   * Validate job ID parameter
   */
  validateJobId: [
    query('jobId')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Job ID is required'),
      
    // Check for validation errors
    (req, res, next) => {
      const errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array()
        });
      }
      
      next();
    }
  ],
  
  /**
   * Validate vendor configuration updates
   */
  validateVendorConfig: [
    body('config')
      .isObject()
      .withMessage('Config must be an object'),
    body('config.anti_blocking_settings')
      .optional()
      .isObject()
      .withMessage('Anti-blocking settings must be an object'),
    body('config.selectors')
      .optional()
      .isObject()
      .withMessage('Selectors must be an object'),
      
    // Check for validation errors
    (req, res, next) => {
      const errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array()
        });
      }
      
      next();
    }
  ]
};

module.exports = validators;