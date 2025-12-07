/**
 * =====================================================
 * ORDER ROUTES - routes/orderRoutes.js
 * =====================================================
 * 
 * HOW IT WORKS:
 * - Handles all order management endpoints
 * - Order lifecycle management (pending → confirmed → shipped → delivered)
 * - User order tracking
 * - Order cancellation
 * 
 * WHY IT WORKS THIS WAY:
 * - E-commerce order processing workflow
 * - Status validation to prevent invalid transitions
 * - Prevent changing userId after order creation (data integrity)
 * - Comprehensive order filtering and searching
 * 
 * CONTROL FLOW:
 * Client Request → Route Matcher → Validators → Logic → Database → Response
 * 
 * DATA FLOW:
 * Order Creation: {userId, items, totalAmount} → Validate → Generate ID → Save → Response
 * Order Status: PATCH → Validate status → Update in DB → Return updated order
 * 
 * ORDER LIFECYCLE:
 * pending → confirmed → shipped → delivered (or cancelled at any stage)
 */

const express = require('express');
const router = express.Router();
const db = require('../utils/database');
const response = require('../utils/responseHandler');
const { validateRequired, validateId } = require('../utils/validator');

const FILENAME = 'orders.json';

/**
 * ============================================
 * GET /api/orders - Retrieve all orders with filtering
 * ============================================
 * 
 * HOW:
 * 1. Get all orders from database
 * 2. Filter by userId if provided (find specific user's orders)
 * 3. Filter by status if provided (pending, confirmed, etc.)
 * 4. Paginate results
 * 5. Return formatted response
 * 
 * CONTROL FLOW:
 *   Query params extracted → db.getAll() reads data
 *   → Apply userId filter → Apply status filter
 *   → Paginate → Return
 * 
 * COMMAND FLOW EXAMPLES:
 * GET /api/orders
 *   → Returns all orders paginated
 * 
 * GET /api/orders?userId=1
 *   → Returns all orders from user 1
 * 
 * GET /api/orders?status=pending
 *   → Returns all pending orders
 * 
 * GET /api/orders?userId=1&status=shipped&page=1&limit=5
 *   → Returns user 1's shipped orders, 5 per page
 * 
 * @route GET /api/orders
 * @param {number} userId - Filter by user ID (optional)
 * @param {string} status - Filter by order status (optional)
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 10)
 * @returns {Object} - Paginated orders with filtering
 */
router.get('/', (req, res) => {
  try {
    const { userId, status } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    let orders = db.getAll(FILENAME) || [];

    // ============================================
    // USER ID FILTER - WHY: Find specific user's orders
    // ============================================
    // Filter by userId
    if (userId) {
      orders = orders.filter(o => o.userId === parseInt(userId, 10));
    }

    // ============================================
    // STATUS FILTER - WHY: Filter by order status
    // ============================================
    // Filter by status
    if (status) {
      const s = String(status).toLowerCase();
      orders = orders.filter(o => String(o.status || '').toLowerCase() === s);
    }

    // ============================================
    // PAGINATION - WHY: Handle large order lists efficiently
    // ============================================
    const total = orders.length;
    const start = (page - 1) * limit;
    const paginatedOrders = orders.slice(start, start + limit);

    res.json(response.paginated(paginatedOrders, page, limit, total));
  } catch (error) {
    res.status(500).json(response.error('Failed to fetch orders', 500));
  }
});

/**
 * ============================================
 * GET /api/orders/:id - Get single order by ID
 * ============================================
 * 
 * HOW:
 * 1. Validate ID format
 * 2. Search database for order with matching ID
 * 3. Return order or 404 error
 * 
 * CONTROL FLOW:
 *   GET /api/orders/1
 *   → validateId checks ID valid
 *   → db.getById() searches orders.json
 *   → If found: Return order
 *   → If not found: Return 404
 * 
 * COMMAND FLOW EXAMPLE:
 * curl http://localhost:3000/api/orders/1
 * 
 * @route GET /api/orders/:id
 * @param {number} id - Order ID
 * @returns {Object} - Order object
 */
router.get('/:id', validateId, (req, res) => {
  try {
    const order = db.getById(FILENAME, req.params.id);
    
    if (!order) {
      return res.status(404).json(response.error('Order not found', 404));
    }

    res.json(response.success(order, 'Order fetched successfully'));
  } catch (error) {
    res.status(500).json(response.error('Failed to fetch order', 500));
  }
});

/**
 * ============================================
 * POST /api/orders - Create new order
 * ============================================
 * 
 * HOW:
 * 1. Validate required fields (userId, items, totalAmount)
 * 2. Validate items is non-empty array
 * 3. Validate totalAmount is positive number
 * 4. Create order with auto-ID
 * 5. Set initial status to 'pending'
 * 6. Save to database
 * 7. Return created order with 201 status
 * 
 * CONTROL FLOW:
 *   POST request with JSON
 *   → validateRequired checks 3 fields present
 *   → Handler validates items array and amount
 *   → db.create() auto-generates ID
 *   → Returns 201 status
 * 
 * COMMAND FLOW EXAMPLE:
 * curl -X POST http://localhost:3000/api/orders \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "userId":1,
 *     "items":[
 *       {"productId":1,"quantity":2,"price":99.99}
 *     ],
 *     "totalAmount":199.98,
 *     "shippingAddress":"123 Main St",
 *     "paymentMethod":"credit-card"
 *   }'
 * 
 * VALIDATION RULES:
 * - items: Must be array with at least 1 item
 * - totalAmount: Must be positive number
 * - Initial status: Always 'pending'
 * 
 * @route POST /api/orders
 * @param {number} userId - User ID placing order (required)
 * @param {Array} items - Order items array (required, non-empty)
 * @param {number} totalAmount - Total order amount (required, must be > 0)
 * @param {string} shippingAddress - Delivery address (optional)
 * @param {string} paymentMethod - Payment method (optional, default: credit-card)
 * @param {string} notes - Order notes (optional)
 * @returns {Object} - Created order with 201 status
 */
router.post('/', validateRequired(['userId', 'items', 'totalAmount']), (req, res) => {
  try {
    const { userId, items, totalAmount, shippingAddress, paymentMethod } = req.body;

    // ============================================
    // VALIDATION - WHY: Prevent invalid orders in database
    // ============================================
    
    // WHY: Items must be array with data
    // Validate items is an array
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json(response.error('Items must be a non-empty array', 400));
    }

    // WHY: Amount must be positive
    // Validate total amount is a number
    if (isNaN(totalAmount) || totalAmount <= 0) {
      return res.status(400).json(response.error('Total amount must be a positive number', 400));
    }

    const newOrder = db.create(FILENAME, {
      userId: parseInt(userId),
      items,
      totalAmount: parseFloat(totalAmount),
      status: 'pending',
      paymentMethod: paymentMethod || 'credit-card',
      shippingAddress: shippingAddress || '',
      notes: req.body.notes || ''
    });

    res.status(201).json(response.success(newOrder, 'Order created successfully', 201));
  } catch (error) {
    res.status(500).json(response.error('Failed to create order', 500));
  }
});

/**
 * ============================================
 * PUT /api/orders/:id - Update entire order
 * ============================================
 * 
 * HOW:
 * 1. Validate ID
 * 2. Check order exists
 * 3. Prevent userId change (data integrity)
 * 4. Update all fields
 * 5. Save to database
 * 6. Return updated order
 * 
 * CONTROL FLOW:
 *   PUT /api/orders/1
 *   → validateId checks ID valid
 *   → Handler checks order exists
 *   → Prevents userId change
 *   → Update all fields
 *   → Save to database
 * 
 * WHY prevent userId change: Prevents reassigning orders to different users
 * 
 * @route PUT /api/orders/:id
 * @param {number} id - Order ID
 * @param {Object} body - Updated order fields
 * @returns {Object} - Updated order object
 */
router.put('/:id', validateId, (req, res) => {
  try {
    const order = db.getById(FILENAME, req.params.id);
    
    if (!order) {
      return res.status(404).json(response.error('Order not found', 404));
    }

    // ============================================
    // PREVENT USER ID CHANGE - WHY: Data integrity
    // ============================================
    // Prevent changing userId after creation
    if (req.body.userId && req.body.userId !== order.userId) {
      return res.status(400).json(response.error('Cannot change userId after order creation', 400));
    }

    const updateData = { ...req.body };
    
    // WHY: Convert totalAmount to float for precision
    if (updateData.totalAmount !== undefined) {
      updateData.totalAmount = parseFloat(updateData.totalAmount);
    }

    const updatedOrder = db.update(FILENAME, req.params.id, updateData);
    res.json(response.success(updatedOrder, 'Order updated successfully'));
  } catch (error) {
    res.status(500).json(response.error('Failed to update order', 500));
  }
});

/**
 * ============================================
 * PATCH /api/orders/:id - Partial update order (usually for status changes)
 * ============================================
 * 
 * HOW:
 * 1. Validate ID
 * 2. Check order exists
 * 3. If updating status, validate it's a valid status
 * 4. Update provided fields only
 * 5. Save to database
 * 6. Return updated order
 * 
 * CONTROL FLOW:
 *   PATCH /api/orders/1 with {"status":"shipped"}
 *   → validateId checks ID valid
 *   → Handler validates status is valid
 *   → db.update() merges fields
 *   → Returns updated order
 * 
 * VALID STATUS VALUES:
 * - pending    = Order created, awaiting confirmation
 * - confirmed  = Order confirmed by system/payment
 * - shipped    = Order has been shipped
 * - delivered  = Order delivered to customer
 * - cancelled  = Order cancelled
 * 
 * COMMAND FLOW EXAMPLE:
 * curl -X PATCH http://localhost:3000/api/orders/1 \
 *   -H "Content-Type: application/json" \
 *   -d '{"status":"shipped"}'
 * 
 * Result: Order status changed to shipped, other fields unchanged
 * 
 * @route PATCH /api/orders/:id
 * @param {number} id - Order ID
 * @param {Object} body - Fields to update (partial)
 * @returns {Object} - Updated order object
 */
router.patch('/:id', validateId, (req, res) => {
  try {
    const order = db.getById(FILENAME, req.params.id);
    
    if (!order) {
      return res.status(404).json(response.error('Order not found', 404));
    }

    // ============================================
    // STATUS VALIDATION - WHY: Prevent invalid status values
    // ============================================
    // If updating status, validate it
    if (req.body.status) {
      const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(req.body.status.toLowerCase())) {
        return res.status(400).json(
          response.error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400)
        );
      }
    }

    const updatedOrder = db.update(FILENAME, req.params.id, req.body);
    res.json(response.success(updatedOrder, 'Order partially updated'));
  } catch (error) {
    res.status(500).json(response.error('Failed to update order', 500));
  }
});

/**
 * DELETE /api/orders/:id - Delete order
 */
 /**
 * ============================================
 * DELETE /api/orders/:id - Delete order
 * ============================================
 * 
 * HOW:
 * 1. Validate ID
 * 2. Check order exists
 * 3. Remove from database
 * 4. Return success
 * 
 * @route DELETE /api/orders/:id
 */
 router.delete('/:id', validateId, (req, res) => {
  try {
    const order = db.getById(FILENAME, req.params.id);
    
    if (!order) {
      return res.status(404).json(response.error('Order not found', 404));
    }

    db.deleteRecord(FILENAME, req.params.id);
    res.json(response.success(null, 'Order deleted successfully'));
  } catch (error) {
    res.status(500).json(response.error('Failed to delete order', 500));
  }
});

/**
 * GET /api/orders/user/:userId - Get all orders by user
 */
 /**
 * ============================================
 * GET /api/orders/user/:userId - Get all orders by specific user
 * ============================================
 * 
 * HOW: Filter orders where userId matches
 * USE CASE: Customer viewing their order history
 * 
 * @route GET /api/orders/user/:userId
 */
 router.get('/user/:userId', validateId, (req, res) => {
  try {
    const userOrders = db.filter(FILENAME, o => o.userId === parseInt(req.params.userId));
    
    if (userOrders.length === 0) {
      return res.status(404).json(response.error('No orders found for this user', 404));
    }

    res.json(response.success(userOrders, 'User orders fetched'));
  } catch (error) {
    res.status(500).json(response.error('Failed to fetch user orders', 500));
  }
});

/**
 * GET /api/orders/status/:status - Get orders by status
 */
 /**
 * ============================================
 * GET /api/orders/status/:status - Get all orders with specific status
 * ============================================
 * 
 * HOW: Filter orders matching status (case-insensitive)
 * USE CASE: Admin dashboard showing orders by status
 * 
 * @route GET /api/orders/status/:status
 */
 router.get('/status/:status', (req, res) => {
  try {
    const orders = db.filter(FILENAME, o => o.status.toLowerCase() === req.params.status.toLowerCase());
    
    if (orders.length === 0) {
      return res.status(404).json(response.error('No orders found with this status', 404));
    }

    res.json(response.success(orders, `Orders with status '${req.params.status}' fetched`));
  } catch (error) {
    res.status(500).json(response.error('Failed to fetch orders by status', 500));
  }
});

/**
 * POST /api/orders/:id/cancel - Cancel an order
 */
 /**
 * ============================================
 * POST /api/orders/:id/cancel - Cancel an order
 * ============================================
 * 
 * HOW:
 * 1. Validate ID
 * 2. Check order exists
 * 3. Verify order is in 'pending' status only
 * 4. Change status to 'cancelled'
 * 5. Save to database
 * 
 * CONSTRAINT: Only pending orders can be cancelled
 * WHY: Prevents cancelling orders already shipped/delivered
 * 
 * @route POST /api/orders/:id/cancel
 */
 router.post('/:id/cancel', validateId, (req, res) => {
  try {
    const order = db.getById(FILENAME, req.params.id);
    
    if (!order) {
      return res.status(404).json(response.error('Order not found', 404));
    }

     // ============================================
     // STATUS CHECK - WHY: Prevent cancelling non-pending orders
     // ============================================
     if (order.status !== 'pending') {
       return res.status(400).json(response.error('Only pending orders can be cancelled', 400));
     }

    const updatedOrder = db.update(FILENAME, req.params.id, { status: 'cancelled' });
    res.json(response.success(updatedOrder, 'Order cancelled successfully'));
  } catch (error) {
    res.status(500).json(response.error('Failed to cancel order', 500));
  }
});

 // ============================================
 // EXPORT ROUTER - WHY: Use in server.js
 // ============================================
module.exports = router;
