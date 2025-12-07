/**
 * =====================================================
 * PRODUCT ROUTES - routes/productRoutes.js
 * =====================================================
 * 
 * HOW IT WORKS:
 * - Handles all product management endpoints (CRUD + filtering)
 * - Advanced filtering by price range, category, sorting
 * - Pagination for large product lists
 * - Stock management tracking
 * 
 * WHY IT WORKS THIS WAY:
 * - E-commerce features like filtering and sorting
 * - Stock tracking for inventory management
 * - Price range filtering for shopping experience
 * - Efficient database queries with pagination
 * 
 * CONTROL FLOW:
 * Client Request → Route Matcher → Validators → Filter/Sort Logic → Database → Response
 * 
 * DATA FLOW:
 * GET /api/products?category=electronics&minPrice=100&maxPrice=1000&sort=price-asc
 * → Read all products → Filter by category → Filter by price → Sort → Paginate → Return
 */

const express = require('express');
const router = express.Router();
const db = require('../utils/database');
const response = require('../utils/responseHandler');
const { validateRequired, validateId } = require('../utils/validator');

const FILENAME = 'products.json';

/**
 * ============================================
 * GET /api/products - Get all products with advanced filtering
 * ============================================
 * 
 * HOW:
 * 1. Get all products from database
 * 2. Filter by category if provided
 * 3. Filter by price range (minPrice to maxPrice)
 * 4. Sort by name, price-asc, or price-desc
 * 5. Paginate results
 * 6. Return formatted response
 * 
 * CONTROL FLOW:
 *   Query params extracted → db.getAll() reads data
 *   → Apply category filter → Apply price filter
 *   → Apply sort → Paginate → Return
 * 
 * COMMAND FLOW EXAMPLES:
 * GET /api/products
 *   → Returns all products paginated
 * 
 * GET /api/products?category=electronics
 *   → Returns only electronics products
 * 
 * GET /api/products?minPrice=100&maxPrice=500
 *   → Returns products priced between $100-$500
 * 
 * GET /api/products?sort=price-asc&page=1&limit=20
 *   → Returns products sorted by price (low to high), 20 per page
 * 
 * SORTING OPTIONS:
 * price-asc   = Sort by price ascending (cheapest first)
 * price-desc  = Sort by price descending (most expensive first)
 * name        = Sort alphabetically by name (default)
 * 
 * @route GET /api/products
 * @param {string} category - Filter by category (optional)
 * @param {number} minPrice - Minimum price filter (optional)
 * @param {number} maxPrice - Maximum price filter (optional)
 * @param {string} sort - Sort order (price-asc, price-desc, name)
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 10)
 * @returns {Object} - Paginated products with filtering
 */
router.get('/', (req, res) => {
  try {
    // Extract and default query parameters and coerce numeric values
    const { category, minPrice, maxPrice, sort = 'name' } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    // Get all products from database
    let products = db.getAll(FILENAME) || [];

    // ============================================
    // CATEGORY FILTER - WHY: Allow users to browse by category
    // ============================================
    if (category) {
      const cat = String(category).toLowerCase();
      products = products.filter(p => (p.category || '').toLowerCase() === cat);
    }

    // ============================================
    // PRICE RANGE FILTER - WHY: Enable price-based shopping
    // ============================================
    if (minPrice || maxPrice) {
      const min = minPrice ? parseFloat(minPrice) : 0;      // Default min = 0
      const max = maxPrice ? parseFloat(maxPrice) : Infinity; // Default max = unlimited
      products = products.filter(p => {
        const price = parseFloat(p.price) || 0;
        return price >= min && price <= max;
      });
    }

    // ============================================
    // SORTING - WHY: Allow different sort preferences
    // ============================================
    if (sort === 'price-asc') {
      products.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
    } else if (sort === 'price-desc') {
      products.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
    } else {
      products.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    }

    // ============================================
    // PAGINATION - WHY: Handle large product lists efficiently
    // ============================================
    const total = products.length;
    const start = (page - 1) * limit;
    const paginatedProducts = products.slice(start, start + limit);

    res.json(response.paginated(paginatedProducts, page, limit, total));
  } catch (error) {
    res.status(500).json(response.error('Failed to fetch products', 500));
  }
});

/**
 * ============================================
 * GET /api/products/:id - Get single product by ID
 * ============================================
 * 
 * HOW:
 * 1. Validate ID format
 * 2. Search database for product with matching ID
 * 3. Return product or 404 error
 * 
 * CONTROL FLOW:
 *   GET /api/products/5
 *   → validateId checks ID valid
 *   → db.getById() searches products.json
 *   → If found: Return product
 *   → If not found: Return 404
 * 
 * COMMAND FLOW EXAMPLE:
 * curl http://localhost:3000/api/products/1
 * 
 * @route GET /api/products/:id
 * @param {number} id - Product ID
 * @returns {Object} - Product object
 */
router.get('/:id', validateId, (req, res) => {
  try {
    const product = db.getById(FILENAME, req.params.id);
    
    if (!product) {
      return res.status(404).json(response.error('Product not found', 404));
    }

    res.json(response.success(product, 'Product fetched successfully'));
  } catch (error) {
    res.status(500).json(response.error('Failed to fetch product', 500));
  }
});

/**
 * ============================================
 * POST /api/products - Create new product
 * ============================================
 * 
 * HOW:
 * 1. Validate required fields (name, price, category, stock)
 * 2. Validate price and stock are positive numbers
 * 3. Create product with auto-ID
 * 4. Set inStock flag based on stock quantity
 * 5. Save to database
 * 6. Return created product
 * 
 * CONTROL FLOW:
 *   POST request with JSON
 *   → validateRequired checks 4 fields present
 *   → Handler validates price/stock are valid numbers
 *   → db.create() auto-generates ID
 *   → Returns 201 status
 * 
 * COMMAND FLOW EXAMPLE:
 * curl -X POST http://localhost:3000/api/products \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "name":"Laptop",
 *     "price":999.99,
 *     "category":"electronics",
 *     "stock":50,
 *     "description":"High-performance laptop",
 *     "image":"laptop.jpg"
 *   }'
 * 
 * VALIDATION RULES:
 * - price: Must be positive number
 * - stock: Must be non-negative integer
 * - inStock: Automatically set to true if stock > 0
 * 
 * @route POST /api/products
 * @param {string} name - Product name (required)
 * @param {number} price - Product price (required, must be > 0)
 * @param {string} category - Product category (required)
 * @param {number} stock - Stock quantity (required, must be >= 0)
 * @param {string} description - Product description (optional)
 * @param {string} image - Product image URL (optional)
 * @returns {Object} - Created product with 201 status
 */
router.post('/', validateRequired(['name', 'price', 'category', 'stock']), (req, res) => {
  try {
    const { name, price, category, stock, description, image } = req.body;

    // ============================================
    // VALIDATION - WHY: Prevent invalid data in database
    // ============================================
    // WHY isNaN(): Checks if value cannot be converted to number
    if (isNaN(price) || price < 0 || isNaN(stock) || stock < 0) {
      return res.status(400).json(response.error('Price and stock must be positive numbers', 400));
    }

    // Create product record
    const newProduct = db.create(FILENAME, {
      name,
      price: parseFloat(price),              // Convert string to number
      category,
      stock: parseInt(stock),                // Convert to integer
      description: description || '',
      image: image || '',
      inStock: parseInt(stock) > 0           // Automatic flag: true if stock > 0
    });

    res.status(201).json(response.success(newProduct, 'Product created successfully', 201));
  } catch (error) {
    res.status(500).json(response.error('Failed to create product', 500));
  }
});

/**
 * ============================================
 * PUT /api/products/:id - Update product
 * ============================================
 * 
 * HOW:
 * 1. Validate ID
 * 2. Check product exists
 * 3. Update all fields
 * 4. Automatically update inStock flag based on new stock
 * 5. Save to database
 * 6. Return updated product
 * 
 * CONTROL FLOW:
 *   PUT /api/products/1
 *   → validateId checks ID valid
 *   → Handler checks product exists
 *   → Update all fields
 *   → Auto-recalculate inStock
 *   → Save to database
 * 
 * COMMAND FLOW EXAMPLE:
 * curl -X PUT http://localhost:3000/api/products/1 \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "price":899.99,
 *     "stock":25
 *   }'
 * 
 * @route PUT /api/products/:id
 * @param {number} id - Product ID
 * @param {Object} body - Updated product fields
 * @returns {Object} - Updated product object
 */
router.put('/:id', validateId, (req, res) => {
  try {
    const product = db.getById(FILENAME, req.params.id);
    
    if (!product) {
      return res.status(404).json(response.error('Product not found', 404));
    }

    const updateData = { ...req.body };
    
    // WHY: Auto-update inStock flag when stock changes
    if (updateData.stock !== undefined) {
      updateData.inStock = parseInt(updateData.stock) > 0;
      updateData.stock = parseInt(updateData.stock);
    }
    
    // WHY: Convert price to float for decimal precision
    if (updateData.price !== undefined) {
      updateData.price = parseFloat(updateData.price);
    }

    const updatedProduct = db.update(FILENAME, req.params.id, updateData);
    res.json(response.success(updatedProduct, 'Product updated successfully'));
  } catch (error) {
    res.status(500).json(response.error('Failed to update product', 500));
  }
});

/**
 * ============================================
 * PATCH /api/products/:id - Partial update product
 * ============================================
 * 
 * HOW:
 * 1. Validate ID
 * 2. Check product exists
 * 3. Update only provided fields
 * 4. Save to database
 * 5. Return updated product
 * 
 * COMMAND FLOW EXAMPLE:
 * curl -X PATCH http://localhost:3000/api/products/1 \
 *   -H "Content-Type: application/json" \
 *   -d '{"description":"Updated description"}'
 * 
 * @route PATCH /api/products/:id
 * @param {number} id - Product ID
 * @param {Object} body - Fields to update (partial)
 * @returns {Object} - Updated product object
 */
router.patch('/:id', validateId, (req, res) => {
  try {
    const product = db.getById(FILENAME, req.params.id);
    
    if (!product) {
      return res.status(404).json(response.error('Product not found', 404));
    }

    const updatedProduct = db.update(FILENAME, req.params.id, req.body);
    res.json(response.success(updatedProduct, 'Product partially updated'));
  } catch (error) {
    res.status(500).json(response.error('Failed to update product', 500));
  }
});

/**
 * ============================================
 * DELETE /api/products/:id - Delete product
 * ============================================
 * 
 * HOW:
 * 1. Validate ID
 * 2. Check product exists
 * 3. Remove from database
 * 4. Return success
 * 
 * COMMAND FLOW EXAMPLE:
 * curl -X DELETE http://localhost:3000/api/products/1
 * 
 * @route DELETE /api/products/:id
 * @param {number} id - Product ID to delete
 * @returns {Object} - Success message
 */
router.delete('/:id', validateId, (req, res) => {
  try {
    const product = db.getById(FILENAME, req.params.id);
    
    if (!product) {
      return res.status(404).json(response.error('Product not found', 404));
    }

    db.deleteRecord(FILENAME, req.params.id);
    res.json(response.success(null, 'Product deleted successfully'));
  } catch (error) {
    res.status(500).json(response.error('Failed to delete product', 500));
  }
});

/**
 * ============================================
 * GET /api/products/stock/low - Get low stock products
 * ============================================
 * 
 * HOW:
 * 1. Get threshold value from query (default: 5)
 * 2. Filter products with stock <= threshold
 * 3. Return low stock products
 * 
 * CONTROL FLOW:
 *   GET /api/products/stock/low?threshold=10
 *   → db.filter() applies condition
 *   → Returns products with stock <= 10
 * 
 * COMMAND FLOW EXAMPLE:
 * curl http://localhost:3000/api/products/stock/low
 * → Returns products with stock <= 5 (default)
 * 
 * curl http://localhost:3000/api/products/stock/low?threshold=20
 * → Returns products with stock <= 20
 * 
 * USE CASE: Inventory alerts - notify when stock is running low
 * 
 * @route GET /api/products/stock/low
 * @param {number} threshold - Low stock threshold (default: 5)
 * @returns {Array} - Products with stock <= threshold
 */
router.get('/stock/low', (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold, 10) || 5;
    const lowStockProducts = db.filter(FILENAME, product => (parseInt(product.stock, 10) || 0) <= threshold);
    res.json(response.success(lowStockProducts, 'Low stock products fetched'));
  } catch (error) {
    res.status(500).json(response.error('Failed to fetch low stock products', 500));
  }
});

/**
 * ============================================
 * GET /api/products/category/:category - Get products by category
 * ============================================
 * 
 * HOW:
 * 1. Extract category from URL parameter
 * 2. Filter products matching category (case-insensitive)
 * 3. Return matching products or 404
 * 
 * CONTROL FLOW:
 *   GET /api/products/category/electronics
 *   → db.filter() searches products
 *   → Returns all electronics products
 *   → If none: Return 404
 * 
 * COMMAND FLOW EXAMPLE:
 * curl http://localhost:3000/api/products/category/electronics
 * → Returns all electronics products
 * 
 * curl http://localhost:3000/api/products/category/books
 * → Returns all book products
 * 
 * @route GET /api/products/category/:category
 * @param {string} category - Product category
 * @returns {Array} - Products in category or 404
 */
router.get('/category/:category', (req, res) => {
  try {
    const products = db.filter(FILENAME, 
      p => p.category.toLowerCase() === req.params.category.toLowerCase()
    );
    
    if (products.length === 0) {
      return res.status(404).json(response.error('No products found in this category', 404));
    }

    res.json(response.success(products, 'Products by category fetched'));
  } catch (error) {
    res.status(500).json(response.error('Failed to fetch products by category', 500));
  }
});

// ============================================
// EXPORT ROUTER - WHY: Use in server.js
// ============================================
module.exports = router;
