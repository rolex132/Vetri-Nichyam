/**
 * =====================================================
 * VALIDATOR MIDDLEWARE - utils/validator.js
 * =====================================================
 * 
 * HOW IT WORKS:
 * - Creates middleware functions to validate incoming request data
 * - Middleware runs BEFORE route handler processes data
 * - If validation fails, returns error response immediately
 * - If validation passes, calls next() to proceed to route handler
 * 
 * WHY IT WORKS THIS WAY:
 * - Prevents invalid data from reaching database
 * - Reusable validators across multiple routes
 * - Separates validation logic from route logic
 * - Catches errors early in request pipeline
 * 
 * CONTROL FLOW:
 * Request → Middleware validators → If valid: Route Handler → If invalid: Error Response
 * 
 * DATA FLOW:
 * User Input → Regex/Logic Validation → Pass/Fail → Response
 */

/**
 * ============================================
 * VALIDATE REQUIRED FIELDS - WHY: Ensure all needed data present
 * ============================================
 * 
 * HOW:
 * 1. Returns middleware function
 * 2. Middleware checks if required fields exist in req.body
 * 3. If any missing, return 400 error
 * 4. If all present, call next() to continue
 * 
 * CONTROL FLOW:
 *   Request arrives with body → Middleware checks each field
 *   → If field missing: Send error response
 *   → If all present: Call next() → Route handler runs
 * 
 * WHY: Prevents incomplete data from being saved to database
 * 
 * USAGE:
 *   router.post('/', validateRequired(['name', 'email']), routeHandler)
 *   → Before routeHandler runs, name and email must be present
 * 
 * @param {Array<string>} requiredFields - Field names that must be present
 * @returns {Function} - Express middleware function
 */
const validateRequired = (requiredFields) => {
  return (req, res, next) => {
    // WHY: Check each required field in req.body
    // If field is missing/empty, add to missing array
      // Determine absence more precisely:
      // - undefined or null are missing
      // - empty strings are missing
      // - numeric 0 or boolean false ARE considered present
      const missing = requiredFields.filter(field => {
        const val = req.body[field];
        if (val === undefined || val === null) return true;
        if (typeof val === 'string' && val.trim() === '') return true;
        return false;
      });

      // If any fields are missing, send error response
      if (missing.length > 0) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: 'Validation Error',
        details: `Missing required fields: ${missing.join(', ')}`
      });
    }
    
    // All required fields present, proceed to next middleware/route
    next();
  };
};

/**
 * ============================================
 * VALIDATE EMAIL - WHY: Ensure valid email format
 * ============================================
 * 
 * HOW:
 * 1. Use regular expression to test email format
 * 2. If email exists in body but doesn't match pattern, return error
 * 3. Otherwise, continue to next middleware
 * 
 * EMAIL REGEX BREAKDOWN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
 * ^           = Start of string
 * [^\s@]+     = One or more characters (not space or @)
 * @           = Literal @ symbol
 * [^\s@]+     = One or more characters (not space or @)
 * \.          = Literal dot (.)
 * [^\s@]+     = One or more characters (not space or @)
 * $           = End of string
 * 
 * EXAMPLES:
 * ✓ john@example.com - matches
 * ✓ user.name@company.co.uk - matches
 * ✗ invalid@email - no dot before TLD
 * ✗ @example.com - no username
 * ✗ john@.com - no domain
 * 
 * CONTROL FLOW:
 *   If req.body.email exists → Test with regex
 *   → If fails: Send 400 error
 *   → If passes: Call next()
 * 
 * WHY optional check: Email might not be in this request
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateEmail = (req, res, next) => {
  // WHY: Email validation pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Only validate if email was provided in request
  if (req.body.email && !emailRegex.test(req.body.email)) {
    return res.status(400).json({
      status: false,
      statusCode: 400,
      message: 'Invalid email format'
    });
  }
  
  next();
};

/**
 * ============================================
 * VALIDATE PHONE - WHY: Ensure valid phone format
 * ============================================
 * 
 * HOW:
 * 1. Extract only digits from phone (remove -, +, spaces, etc.)
 * 2. Check if exactly 10 digits
 * 3. If invalid, return error
 * 4. Otherwise continue
 * 
 * PHONE REGEX: /^\d{10}$/
 * ^\d{10}$ = Exactly 10 digits from start to end
 * 
 * EXAMPLES:
 * ✓ 1234567890 - 10 digits
 * ✓ (123) 456-7890 → converted to 1234567890 → matches
 * ✗ 12345678 - only 8 digits
 * ✗ 12345678901 - 11 digits
 * 
 * CONTROL FLOW:
 *   If phone provided → Extract digits only
 *   → Count digits → If not 10: Error
 *   → If 10: Call next()
 * 
 * WHY .replace(/\D/g, ''): Remove all non-digit characters
 * \D = Any non-digit character
 * /g = Global (all occurrences)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validatePhone = (req, res, next) => {
  // WHY: Phone validation pattern
  const phoneRegex = /^\d{10}$/;
  
  // Only validate if phone was provided
  if (req.body.phone !== undefined && req.body.phone !== null) {
    // Ensure we operate on a string in case phone is numeric
    const digitsOnly = String(req.body.phone).replace(/\D/g, '');

    if (!phoneRegex.test(digitsOnly)) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: 'Invalid phone format. Use 10 digits.'
      });
    }
  }
  
  next();
};

/**
 * ============================================
 * VALIDATE ID - WHY: Ensure ID is valid number
 * ============================================
 * 
 * HOW:
 * 1. Get ID from URL parameters (req.params.id)
 * 2. Check if ID is a number
 * 3. Check if ID is positive (> 0)
 * 4. If invalid, return error
 * 5. Otherwise continue
 * 
 * CONTROL FLOW:
 *   URL has :id parameter → Extract to req.params.id
 *   → Test with isNaN() and > 0
 *   → If invalid: Send 400 error
 *   → If valid: Call next()
 * 
 * WHY isNaN(): Checks if value cannot be converted to number
 * WHY parseInt(id) <= 0: IDs must be positive
 * 
 * EXAMPLES:
 * ✓ /users/1 → id='1' → parseInt(1) = 1 → valid
 * ✗ /users/abc → id='abc' → isNaN(abc) = true → invalid
 * ✗ /users/0 → id='0' → parseInt(0) = 0 ≤ 0 → invalid
 * ✗ /users/-5 → id='-5' → parseInt(-5) = -5 ≤ 0 → invalid
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateId = (req, res, next) => {
  // Support different parameter names used across routes (id, userId, orderId, productId)
  const id = req.params.id || req.params.userId || req.params.orderId || req.params.productId;

  // WHY: Both conditions check for valid positive ID number
  // isNaN(id) = true if not a number
  // parseInt(id) <= 0 = true if zero or negative
  if (id === undefined || isNaN(id) || parseInt(id) <= 0) {
    return res.status(400).json({
      status: false,
      statusCode: 400,
      message: 'Invalid ID format'
    });
  }
  
  next();
};

// ============================================
// EXPORT ALL VALIDATORS - WHY: Use in routes
// ============================================
module.exports = {
  validateRequired,  // Check that required fields are present
  validateEmail,     // Check email format is valid
  validatePhone,     // Check phone has 10 digits
  validateId         // Check ID is positive number
};
