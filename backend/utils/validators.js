/**
 * Input Validation Helpers
 * Reusable validation functions for request data
 */

/**
 * Validate email format
 */
exports.isValidEmail = (email) => {
  const emailRegex = /^\S+@\S+\.\S+$/;
  return emailRegex.test(email);
};

/**
 * Validate MongoDB ObjectId format
 */
exports.isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Validate date format
 */
exports.isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

/**
 * Validate required fields
 */
exports.validateRequiredFields = (data, fields) => {
  const missing = [];
  
  fields.forEach((field) => {
    if (!data[field] || data[field].toString().trim() === '') {
      missing.push(field);
    }
  });
  
  return {
    isValid: missing.length === 0,
    missingFields: missing,
  };
};

/**
 * Sanitize string input
 */
exports.sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};
