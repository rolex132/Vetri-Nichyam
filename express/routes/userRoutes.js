/**
 * =====================================================
 * USER ROUTES - routes/userRoutes.js
 * =====================================================
 * 
 * HOW IT WORKS:
 * - Defines all endpoints for user management (CRUD operations)
 * - Each route handler processes requests and returns formatted responses
 * - Validators run before route handlers to check data validity
 * - Database functions read/write JSON file
 * 
 * WHY IT WORKS THIS WAY:
 * - Separates user logic from other resources
 * - Reusable validators prevent invalid data
 * - Consistent response format across all endpoints
 * 
 * CONTROL FLOW:
 * Client Request → Route Matcher → Validators → Handler → Database → Response
 * 
 * DATA FLOW:
 * JSON Request → Parse → Validate → Process → JSON File → Return JSON Response
 * 
 * COMMAND FLOW EXAMPLE (Creating User):
 * POST /api/users with body {name, email, phone}
 * → validateRequired checks all 3 present
 * → validateEmail checks email format
 * → validatePhone checks phone format
 * → Handler executes
 * → db.create() writes to users.json
 * → Response sent with new user ID
 */

const express = require('express');
const router = express.Router();

// Import utilities
const db = require('../utils/database');                      // Database operations
const response = require('../utils/responseHandler');         // Response formatting
const { validateRequired, validateEmail, validatePhone, validateId } = require('../utils/validator'); // Validators

// Database filename (stored in /db/users.json)
const FILENAME = 'users.json';

/**
 * ============================================
 * GET /api/users - Retrieve all users
 * ============================================
 * 
 * HOW:
 * 1. Get all users from database
 * 2. Apply search filter if provided
 * 3. Paginate results
 * 4. Return formatted response
 * 
 * CONTROL FLOW:
 *   Request arrives → Query params extracted
 *   → db.getAll() reads users.json
 *   → Filter by search term
 *   → Slice array for pagination
 *   → Format response → Send to client
 * 
 * COMMAND FLOW EXAMPLES:
 * GET /api/users
 *   → Returns first 10 users
 * 
 * GET /api/users?search=john
 *   → Returns users with 'john' in name or email
 * 
 * GET /api/users?page=2&limit=5
 *   → Returns 5 users from page 2 (items 6-10)
 * 
 * DATA FLOW:
 * users.json [all users] → Filter/Search → Slice for page → Format with pagination → Client
 * 
 * @route GET /api/users
 * @param {string} search - Search term (optional, searches name/email)
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 10)
 * @returns {Object} - Paginated user list with metadata
 */
router.get('/', (req, res) => {
  try {
    // Extract query parameters with defaults and coerce to integers when needed
    const { search: searchQuery } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    // Get all users from users.json
    let users = db.getAll(FILENAME) || [];

    // SEARCH FILTERING - WHY: Allow client to find specific users
    // Searches in name and email fields (case-insensitive)
    if (searchQuery) {
      const q = String(searchQuery).toLowerCase();
      users = users.filter(user =>
        (user.name || '').toLowerCase().includes(q) ||
        (user.email || '').toLowerCase().includes(q)
      );
    }

    // PAGINATION CALCULATION - WHY: Handle large datasets efficiently
    const total = users.length;                              // Total matching records
    const start = (page - 1) * limit;                        // Calculate starting index
    const paginatedUsers = users.slice(start, start + limit);

    // Send formatted paginated response
    res.json(response.paginated(paginatedUsers, page, limit, total));
  } catch (error) {
    res.status(500).json(response.error('Failed to fetch users', 500));
  }
});

/**
 * ============================================
 * GET /api/users/:id - Retrieve single user by ID
 * ============================================
 * 
 * HOW:
 * 1. Extract ID from URL parameter
 * 2. Validate ID is numeric and positive
 * 3. Search database for matching user
 * 4. Return user or 404 error
 * 
 * CONTROL FLOW:
 *   Request: GET /api/users/1
 *   → validateId middleware checks ID is valid
 *   → db.getById() searches users.json for id=1
 *   → If found: Return user
 *   → If not found: Return 404 error
 * 
 * COMMAND FLOW EXAMPLES:
 * GET /api/users/1
 *   → Returns user with ID 1
 * 
 * GET /api/users/999
 *   → Returns 404 (user not found)
 * 
 * GET /api/users/abc
 *   → Returns 400 (validator rejects non-numeric ID)
 * 
 * @route GET /api/users/:id
 * @param {number} id - User ID (URL parameter)
 * @returns {Object} - User object or 404 error
 */
router.get('/:id', validateId, (req, res) => {
  try {
    // Search database for user with matching ID
    const user = db.getById(FILENAME, req.params.id);
    
    // If user not found, return 404
    if (!user) {
      return res.status(404).json(response.error('User not found', 404));
    }

    // Return found user
    res.json(response.success(user, 'User fetched successfully'));
  } catch (error) {
    res.status(500).json(response.error('Failed to fetch user', 500));
  }
});

/**
 * ============================================
 * POST /api/users - Create new user
 * ============================================
 * 
 * HOW:
 * 1. Validate required fields (name, email, phone) are present
 * 2. Validate email format is correct
 * 3. Validate phone has 10 digits
 * 4. Check email doesn't already exist (duplicate prevention)
 * 5. Create new user with auto-ID and timestamps
 * 6. Save to users.json
 * 7. Return created user with 201 status
 * 
 * CONTROL FLOW:
 *   POST request arrives with JSON body
 *   → validateRequired checks for name, email, phone
 *   → validateEmail checks email format
 *   → validatePhone checks phone format
 *   → Handler checks for duplicate email
 *   → db.create() generates ID, adds timestamps
 *   → Returns 201 (Created) status
 * 
 * COMMAND FLOW EXAMPLE:
 * curl -X POST http://localhost:3000/api/users \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "name":"John Doe",
 *     "email":"john@example.com",
 *     "phone":"1234567890",
 *     "address":"123 Main St",
 *     "city":"NYC",
 *     "country":"USA"
 *   }'
 * 
 * RESPONSE:
 * {
 *   "status": true,
 *   "statusCode": 201,
 *   "data": {
 *     "id": 1,
 *     "name": "John Doe",
 *     "email": "john@example.com",
 *     "createdAt": "2025-11-23T...",
 *     "updatedAt": "2025-11-23T..."
 *   }
 * }
 * 
 * @route POST /api/users
 * @param {string} name - User full name (required)
 * @param {string} email - User email (required, must be valid format)
 * @param {string} phone - User phone (required, must be 10 digits)
 * @param {string} address - User address (optional)
 * @param {string} city - User city (optional)
 * @param {string} country - User country (optional)
 * @returns {Object} - Created user object with 201 status
 */
router.post('/', 
  validateRequired(['name', 'email', 'phone']),  // Check required fields present
  validateEmail,                                  // Check email format valid
  validatePhone,                                  // Check phone format valid
  (req, res) => {
    try {
      const { name, email, phone, address, city, country } = req.body;

      // DUPLICATE CHECK - WHY: Prevent multiple users with same email
      // Uses search() to find any users with this email
      const existingUser = db.search(FILENAME, 'email', email);
      if (existingUser.length > 0) {
        return res.status(409).json(response.error('Email already exists', 409));
      }

      // Create new user record
      // db.create() auto-generates:
      // - id (next available ID)
      // - createdAt (current timestamp)
      // - updatedAt (current timestamp)
      const newUser = db.create(FILENAME, {
        name,
        email,
        phone,
        address: address || '',
        city: city || '',
        country: country || '',
        isActive: true  // New users are active by default
      });

      // Return 201 (Created) status with new user
      res.status(201).json(response.success(newUser, 'User created successfully', 201));
    } catch (error) {
      res.status(500).json(response.error('Failed to create user', 500));
    }
  }
);

/**
 * ============================================
 * PUT /api/users/:id - Update entire user
 * ============================================
 * 
 * HOW:
 * 1. Validate ID is numeric
 * 2. Check user exists
 * 3. Validate new email format (if provided)
 * 4. Validate new phone format (if provided)
 * 5. Check new email isn't duplicate (if changed)
 * 6. Replace all user fields with new values
 * 7. Save to database
 * 8. Return updated user
 * 
 * CONTROL FLOW:
 *   PUT /api/users/1 with JSON body
 *   → validateId checks ID valid
 *   → Handler checks user exists
 *   → Validates email/phone if provided
 *   → db.update() merges all fields
 *   → Returns updated user
 * 
 * COMMAND FLOW EXAMPLE:
 * curl -X PUT http://localhost:3000/api/users/1 \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "name":"John Smith",
 *     "email":"john.smith@example.com",
 *     "phone":"9876543210"
 *   }'
 * 
 * WHY separate update from patch: PUT = full update, PATCH = partial update
 * 
 * @route PUT /api/users/:id
 * @param {number} id - User ID (URL parameter)
 * @param {Object} body - Updated user fields
 * @returns {Object} - Updated user object
 */
router.put('/:id', 
  validateId,       // Check ID is numeric
  validateEmail,    // Check email format if provided
  validatePhone,    // Check phone format if provided
  (req, res) => {
    try {
      // Check user exists first
      const user = db.getById(FILENAME, req.params.id);
      if (!user) {
        return res.status(404).json(response.error('User not found', 404));
      }

      // DUPLICATE EMAIL CHECK - WHY: Prevent other users from having same email
      // Only check if email is being changed
      if (req.body.email && req.body.email !== user.email) {
        const existingUser = db.search(FILENAME, 'email', req.body.email);
        if (existingUser.length > 0) {
          return res.status(409).json(response.error('Email already exists', 409));
        }
      }

      // Update all fields (db.update() preserves id/createdAt, updates updatedAt)
      const updatedUser = db.update(FILENAME, req.params.id, req.body);
      res.json(response.success(updatedUser, 'User updated successfully'));
    } catch (error) {
      res.status(500).json(response.error('Failed to update user', 500));
    }
  }
);

/**
 * ============================================
 * PATCH /api/users/:id - Partial update user
 * ============================================
 * 
 * HOW:
 * 1. Validate ID
 * 2. Check user exists
 * 3. Update ONLY provided fields (don't require all fields)
 * 4. Save to database
 * 5. Return updated user
 * 
 * CONTROL FLOW:
 *   PATCH /api/users/1 with partial JSON
 *   → validateId checks ID valid
 *   → db.update() merges provided fields only
 *   → Returns user with updated fields
 * 
 * COMMAND FLOW EXAMPLE:
 * curl -X PATCH http://localhost:3000/api/users/1 \
 *   -H "Content-Type: application/json" \
 *   -d '{"city":"Los Angeles"}'
 * 
 * Result: Only city is updated, all other fields unchanged
 * 
 * DIFFERENCE FROM PUT:
 * PUT  = Replace entire resource, must provide all fields
 * PATCH = Update only provided fields, partial updates
 * 
 * @route PATCH /api/users/:id
 * @param {number} id - User ID
 * @param {Object} body - Fields to update (partial)
 * @returns {Object} - Updated user object
 */
router.patch('/:id', validateId, (req, res) => {
  try {
    const user = db.getById(FILENAME, req.params.id);
    if (!user) {
      return res.status(404).json(response.error('User not found', 404));
    }

    // Update only provided fields
    const updatedUser = db.update(FILENAME, req.params.id, req.body);
    res.json(response.success(updatedUser, 'User partially updated'));
  } catch (error) {
    res.status(500).json(response.error('Failed to update user', 500));
  }
});

/**
 * ============================================
 * DELETE /api/users/:id - Delete user
 * ============================================
 * 
 * HOW:
 * 1. Validate ID
 * 2. Check user exists
 * 3. Remove user from database
 * 4. Return success response
 * 
 * CONTROL FLOW:
 *   DELETE /api/users/1
 *   → validateId checks ID valid
 *   → db.getById() confirms user exists
 *   → db.deleteRecord() removes from users.json
 *   → Returns success response
 * 
 * COMMAND FLOW EXAMPLE:
 * curl -X DELETE http://localhost:3000/api/users/1
 * 
 * Response: {"status": true, "message": "User deleted successfully"}
 * 
 * WHY check exists first: Prevents confusion between "not found" and "deleted"
 * 
 * @route DELETE /api/users/:id
 * @param {number} id - User ID to delete
 * @returns {Object} - Success message
 */
router.delete('/:id', validateId, (req, res) => {
  try {
    const user = db.getById(FILENAME, req.params.id);
    if (!user) {
      return res.status(404).json(response.error('User not found', 404));
    }

    // Delete from database
    db.deleteRecord(FILENAME, req.params.id);
    res.json(response.success(null, 'User deleted successfully'));
  } catch (error) {
    res.status(500).json(response.error('Failed to delete user', 500));
  }
});

/**
 * ============================================
 * GET /api/users/filter/active - Get active users only
 * ============================================
 * 
 * HOW:
 * 1. Read all users from database
 * 2. Filter only users with isActive = true
 * 3. Return filtered list
 * 
 * CONTROL FLOW:
 *   GET /api/users/filter/active
 *   → db.filter() applies condition function
 *   → Returns users where isActive === true
 * 
 * COMMAND FLOW EXAMPLE:
 * curl http://localhost:3000/api/users/filter/active
 * 
 * Returns: All users with isActive = true
 * 
 * WHY separate route: Special filtering for common operations
 * 
 * @route GET /api/users/filter/active
 * @returns {Array} - Array of active users
 */
router.get('/filter/active', (req, res) => {
  try {
    // Filter users where isActive is true
    const activeUsers = db.filter(FILENAME, user => user.isActive === true);
    res.json(response.success(activeUsers, 'Active users fetched'));
  } catch (error) {
    res.status(500).json(response.error('Failed to fetch active users', 500));
  }
});

// ============================================
// EXPORT ROUTER - WHY: Use in server.js
// ============================================
module.exports = router;
