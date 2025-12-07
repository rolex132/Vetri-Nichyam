/**
 * =====================================================
 * RESPONSE HANDLER UTILITY - utils/responseHandler.js
 * =====================================================
 * 
 * HOW IT WORKS:
 * - Provides consistent JSON response format for all API endpoints
 * - Includes status indicators, messages, data, and timestamps
 * 
 * WHY IT WORKS THIS WAY:
 * - Client knows exactly what to expect in responses
 * - Easy to parse responses in frontend applications
 * - Consistent error/success messaging
 * - Includes pagination info for list endpoints
 * 
 * CONTROL FLOW:
 * Route Handler → response.success()/error()/paginated() → Formatted Response → Client
 * 
 * DATA FLOW:
 * User Data → Format with wrapper → JSON Response → Network → Browser
 */

/**
 * ============================================
 * SUCCESS RESPONSE - WHY: Return successful results
 * ============================================
 * 
 * HOW:
 * 1. Take data to return
 * 2. Wrap in object with metadata
 * 3. Include status, message, timestamp
 * 
 * CONTROL FLOW:
 *   Route Handler calls: response.success(userData, 'User created', 201)
 *   → Returns formatted object
 *   → Express sends as JSON
 * 
 * WHY include timestamp: Client can verify response freshness
 * WHY include status/statusCode: Client knows operation succeeded
 * 
 * @param {*} data - Data to return to client
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (200, 201, etc.)
 * @returns {Object} - Formatted success response
 */
const success = (data, message = 'Success', statusCode = 200) => {
  return {
    status: true,                              // Boolean flag: operation succeeded
    statusCode,                                // HTTP status code
    message,                                   // Human-readable message
    data,                                      // Actual data/result
    timestamp: new Date().toISOString()        // When response was generated
  };
};

/**
 * ============================================
 * ERROR RESPONSE - WHY: Return error information
 * ============================================
 * 
 * HOW:
 * 1. Take error message
 * 2. Include error status code
 * 3. Optional detailed error info
 * 4. Add timestamp
 * 
 * CONTROL FLOW:
 *   Route encounters error → response.error('Not found', 404)
 *   → Returns formatted error object
 *   → Express sends as JSON with 404 status
 * 
 * WHY status: false: Client immediately knows something failed
 * WHY optional details: Developer can see what went wrong
 * 
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (400, 404, 500, etc.)
 * @param {*} details - Optional additional error details
 * @returns {Object} - Formatted error response
 */
const error = (message = 'Error', statusCode = 500, details = null) => {
  return {
    status: false,                             // Boolean flag: operation failed
    statusCode,                                // HTTP error code
    message,                                   // Error description
    ...(details && { details }),               // Include details only if provided
    timestamp: new Date().toISOString()        // When error occurred
  };
};

/**
 * ============================================
 * PAGINATED RESPONSE - WHY: Return paginated lists
 * ============================================
 * 
 * HOW:
 * 1. Take list data and pagination info
 * 2. Calculate total pages
 * 3. Calculate hasNext/hasPrev flags
 * 4. Include all pagination metadata
 * 
 * CONTROL FLOW:
 *   Route has multiple items → response.paginated(items, page, limit, total)
 *   → Returns data with pagination info
 *   → Client can render pages
 * 
 * WHY pagination info: Client can build page navigation
 * WHY hasNext/hasPrev: Frontend knows if more data exists
 * 
 * EXAMPLE:
 *   - User requests page 1, limit 10, total 50 items
 *   - totalPages = ceil(50/10) = 5
 *   - hasNext = true (page 1 < 5)
 *   - hasPrev = false (page 1 is first)
 * 
 * @param {Array} data - Items for current page
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total items in database
 * @returns {Object} - Formatted paginated response
 */
const paginated = (data, page = 1, limit = 10, total = 0) => {
  // Calculate how many pages total exist
  // WHY: ceil() rounds up so 26 items with limit 10 = 3 pages
  const totalPages = Math.ceil(total / limit);
  
  return {
    status: true,                              // Operation succeeded
    statusCode: 200,                           // Always 200 for paginated lists
    data,                                      // Items for current page
    pagination: {                              // Pagination metadata
      page,                                    // Current page number
      limit,                                   // Items per page
      total,                                   // Total items across all pages
      totalPages,                              // How many pages exist
      hasNext: page < totalPages,              // Is there a next page?
      hasPrev: page > 1                        // Is there a previous page?
    },
    timestamp: new Date().toISOString()        // Response generation time
  };
};

// ============================================
// EXPORT ALL RESPONSE FORMATTERS - WHY: Use in routes
// ============================================
module.exports = {
  success,     // Format successful response
  error,       // Format error response
  paginated    // Format paginated list response
};
