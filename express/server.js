/**
 * =====================================================
 * MAIN SERVER FILE - server.js
 * =====================================================
 * 
 * HOW IT WORKS:
 * 1. Imports Express framework to create a web server
 * 2. Sets up middleware to parse incoming JSON/URL-encoded data
 * 3. Imports all route modules (users, products, orders)
 * 4. Mounts routes at specific URL paths
 * 5. Handles 404 errors and general server errors
 * 6. Starts the server on port 3000
 * 
 * WHY IT WORKS THIS WAY:
 * - Middleware processes requests BEFORE reaching routes
 * - Routes are separated by resource type for clean organization
 * - Error handlers catch unhandled errors and respond with proper HTTP codes
 * - Modular structure allows easy addition of new routes
 * 
 * CONTROL FLOW:
 * Request → Middleware (parse JSON) → Route Handler → Response
 * 
 * DATA FLOW:
 * Client sends JSON → express.json() parses it → Route processes it → Database updates → Response sent
 */

const express = require('express');
const app = express();

// ============================================
// MIDDLEWARE SETUP - WHY: Pre-process all requests
// ============================================

// Parses incoming JSON bodies (Content-Type: application/json)
// WHY: Converts raw JSON string to JavaScript objects
app.use(express.json());

// Parses URL-encoded form data (Content-Type: application/x-www-form-urlencoded)
// WHY: Allows form submissions and query parameters to be parsed
// extended: true = use 'qs' library for complex objects
app.use(express.urlencoded({ extended: true }));

// ============================================
// IMPORT ROUTE MODULES - WHY: Organize code by resource
// ============================================
// Each route file handles all CRUD operations for that resource

const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');

// ============================================
// HEALTH CHECK ENDPOINT - WHY: Verify server is running
// ============================================
// Used by monitoring tools and clients to check if API is alive
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Server is running', timestamp: new Date() });
});

// ============================================
// ROUTE MOUNTING - WHY: Organize API endpoints by resource
// ============================================
// CONTROL FLOW: Request → Route path checked → Matching route handler executes

// Mount user routes: ALL user endpoints will start with /api/users
// Examples: GET /api/users, POST /api/users, PUT /api/users/1
app.use('/api/users', userRoutes);

// Mount product routes: ALL product endpoints will start with /api/products
// Examples: GET /api/products, GET /api/products/1, DELETE /api/products/1
app.use('/api/products', productRoutes);

// Mount order routes: ALL order endpoints will start with /api/orders
// Examples: GET /api/orders, POST /api/orders, PATCH /api/orders/1/cancel
app.use('/api/orders', orderRoutes);

// ============================================
// 404 NOT FOUND HANDLER - WHY: Handle undefined routes
// ============================================
// This middleware runs if NO other route matched the request
// Position: MUST be after all route definitions
// WHY: If we put it before routes, it would catch all requests
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found', 
    path: req.path,
    message: `${req.method} ${req.path} - Endpoint does not exist`
  });
});

// ============================================
// GLOBAL ERROR HANDLER - WHY: Catch and format all errors
// ============================================
// This middleware catches errors from any route handler
// CONTROL FLOW: Error occurs → Error handler catches → Formatted response sent
// Position: MUST be the LAST middleware defined
// WHY: Express passes errors to this handler automatically

app.use((err, req, res, next) => {
  // Log error to console for debugging
  console.error('❌ ERROR:', err.message);
  console.error('   Stack:', err.stack);
  
  // Send error response with appropriate status code
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal Server Error',
    statusCode: err.status || 500,
    timestamp: new Date().toISOString(),
    // In production, remove details for security
    ...(process.env.NODE_ENV !== 'production' && { details: err.stack })
  });
});

// ============================================
// START SERVER - WHY: Listen for incoming connections
// ============================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📍 Health Check: http://localhost:${PORT}/health`);
  console.log(`📚 API Routes:`);
  console.log(`   - /api/users (Users management)`);
  console.log(`   - /api/products (Products management)`);
  console.log(`   - /api/orders (Orders management)`);
  console.log(`${'='.repeat(50)}\n`);
});
