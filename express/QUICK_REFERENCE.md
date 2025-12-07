# 🚀 QUICK REFERENCE - All Endpoints & How They Work

## File Structure Overview

```
express/
├── server.js                      # Main entry point - starts server
├── package.json                   # Dependencies
├── COMMAND_FLOW_GUIDE.md         # Detailed flow documentation (YOU ARE HERE)
├── db/
│   ├── users.json                # User data storage
│   ├── products.json             # Product data storage
│   └── orders.json               # Order data storage
├── routes/
│   ├── userRoutes.js             # User endpoints (/api/users/*)
│   ├── productRoutes.js          # Product endpoints (/api/products/*)
│   └── orderRoutes.js            # Order endpoints (/api/orders/*)
└── utils/
    ├── database.js               # JSON file operations
    ├── responseHandler.js        # Response formatting
    └── validator.js              # Input validation
```

---

## 🔥 ALL ENDPOINTS - One Page Reference

### USERS API

```bash
# ✓ GET - Read operations
curl http://localhost:3000/api/users                    # All users (paginated)
curl http://localhost:3000/api/users?page=2&limit=5    # Specific page
curl http://localhost:3000/api/users?search=john       # Search
curl http://localhost:3000/api/users/1                 # Single user

# ✓ POST - Create
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@ex.com","phone":"1234567890"}'

# ✓ PUT - Full update
curl -X PUT http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"John Smith","email":"john2@ex.com"}'

# ✓ PATCH - Partial update
curl -X PATCH http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"city":"NYC"}'

# ✓ DELETE - Remove
curl -X DELETE http://localhost:3000/api/users/1

# ✓ SPECIAL - Active users only
curl http://localhost:3000/api/users/filter/active
```

**HOW USERS WORK:**
```
- Create: POST /api/users
  - Required: name, email (format checked), phone (10 digits)
  - Email must be unique
  - Auto-generates ID starting from 1
  - Initial isActive = true

- Read: GET /api/users[/1]
  - Supports pagination (page, limit)
  - Supports search (queries name + email)
  - Single record by ID returns 404 if not found

- Update: PUT (full) / PATCH (partial) /api/users/1
  - PUT: sends all fields
  - PATCH: sends only fields to change
  - Prevents duplicate emails

- Delete: DELETE /api/users/1
  - Removes user from database
  - Returns 404 if not found

- Filter: GET /api/users/filter/active
  - Returns only users where isActive = true
```

---

### PRODUCTS API

```bash
# ✓ GET - Read operations
curl http://localhost:3000/api/products                                    # All
curl "http://localhost:3000/api/products?category=electronics"            # By category
curl "http://localhost:3000/api/products?minPrice=100&maxPrice=1000"      # Price range
curl "http://localhost:3000/api/products?sort=price-asc"                  # Sorted (asc/desc)
curl "http://localhost:3000/api/products?page=1&limit=10"                 # Paginated
curl http://localhost:3000/api/products/1                                 # Single product

# ✓ POST - Create
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Laptop","price":999.99,"category":"electronics","stock":50}'

# ✓ PUT - Full update
curl -X PUT http://localhost:3000/api/products/1 \
  -H "Content-Type: application/json" \
  -d '{"price":899.99,"stock":30}'

# ✓ PATCH - Partial update
curl -X PATCH http://localhost:3000/api/products/1 \
  -H "Content-Type: application/json" \
  -d '{"stock":25}'

# ✓ DELETE - Remove
curl -X DELETE http://localhost:3000/api/products/1

# ✓ SPECIAL - Low stock alerts
curl "http://localhost:3000/api/products/stock/low?threshold=5"

# ✓ SPECIAL - Products by category
curl http://localhost:3000/api/products/category/electronics
```

**HOW PRODUCTS WORK:**
```
- Create: POST /api/products
  - Required: name, price (positive), category, stock (non-negative)
  - Auto-sets inStock = true if stock > 0
  - Auto-generates ID

- Read: GET /api/products[/1]
  - Filtering: category, minPrice, maxPrice
  - Sorting: price-asc, price-desc, name (default)
  - Pagination support

- Update: PUT/PATCH /api/products/1
  - Auto-updates inStock flag based on stock
  - Price converted to float for precision

- Special Routes:
  - /stock/low: products with stock <= threshold (default: 5)
  - /category/:category: all products in category
```

---

### ORDERS API

```bash
# ✓ GET - Read operations
curl http://localhost:3000/api/orders                                # All orders (paginated)
curl "http://localhost:3000/api/orders?userId=1"                    # User's orders
curl "http://localhost:3000/api/orders?status=pending"              # By status
curl "http://localhost:3000/api/orders?userId=1&status=shipped"     # Filtered
curl http://localhost:3000/api/orders/1                             # Single order

# ✓ POST - Create
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"items":[{"productId":1,"qty":2,"price":99.99}],"totalAmount":199.98}'

# ✓ PUT - Full update
curl -X PUT http://localhost:3000/api/orders/1 \
  -H "Content-Type: application/json" \
  -d '{"totalAmount":299.99,"paymentMethod":"paypal"}'

# ✓ PATCH - Update status
curl -X PATCH http://localhost:3000/api/orders/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"shipped"}'

# ✓ DELETE - Remove
curl -X DELETE http://localhost:3000/api/orders/1

# ✓ SPECIAL - Get user's orders
curl http://localhost:3000/api/orders/user/1

# ✓ SPECIAL - Get orders by status
curl http://localhost:3000/api/orders/status/pending
curl http://localhost:3000/api/orders/status/shipped

# ✓ SPECIAL - Cancel order
curl -X POST http://localhost:3000/api/orders/1/cancel
```

**HOW ORDERS WORK:**
```
- Create: POST /api/orders
  - Required: userId, items (non-empty array), totalAmount (positive)
  - Auto-sets status = "pending"
  - Auto-generates ID

- Status Lifecycle:
  pending → confirmed → shipped → delivered
           ↓
           └─→ cancelled (from any status)

- Read: GET /api/orders[/1]
  - Filtering: userId, status
  - Pagination support

- Update: PUT /api/orders/1
  - Prevents changing userId (data integrity)

- Special Routes:
  - /user/:userId: all orders from user
  - /status/:status: all orders with status
  - /:id/cancel: cancel pending order only
```

---

## ⚡ COMMAND CHEATSHEET

### User Operations

```bash
# Create user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@ex.com","phone":"1234567890"}'

# List users
curl http://localhost:3000/api/users

# Get user
curl http://localhost:3000/api/users/1

# Update user
curl -X PUT http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe"}'

# Delete user
curl -X DELETE http://localhost:3000/api/users/1
```

### Product Operations

```bash
# Create product
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Laptop","price":999,"category":"electronics","stock":50}'

# List products
curl http://localhost:3000/api/products

# Filter by price
curl "http://localhost:3000/api/products?minPrice=100&maxPrice=1000"

# Sort by price
curl "http://localhost:3000/api/products?sort=price-asc"

# Low stock
curl http://localhost:3000/api/products/stock/low
```

### Order Operations

```bash
# Create order
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"items":[{"productId":1,"qty":2}],"totalAmount":199.98}'

# List orders
curl http://localhost:3000/api/orders

# Get user's orders
curl http://localhost:3000/api/orders/user/1

# Update order status
curl -X PATCH http://localhost:3000/api/orders/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"shipped"}'

# Cancel order
curl -X POST http://localhost:3000/api/orders/1/cancel
```

---

## 📊 HTTP Status Codes Used

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | GET request successful |
| 201 | Created | POST created new resource |
| 400 | Bad Request | Missing/invalid data |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate email |
| 500 | Server Error | Unexpected error |

---

## 🔍 Validation Rules

### Email
- Format: `something@example.com`
- Regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Error: "Invalid email format"

### Phone
- Format: 10 digits (e.g., `1234567890` or `(123) 456-7890`)
- All non-digits removed, must be exactly 10
- Error: "Invalid phone format. Use 10 digits."

### Required Fields
- Users: name, email, phone
- Products: name, price, category, stock
- Orders: userId, items, totalAmount
- Error: "Missing required fields: [field names]"

### Status Values (Orders)
- Valid: `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`
- Error: "Invalid status. Must be one of: ..."

---

## 🎯 Data Flow Summary

### Create Operation
```
POST request
  ↓
Validators check input
  ↓
Business logic processes data
  ↓
Auto-generate: ID, timestamps
  ↓
Write to JSON file
  ↓
Return 201 + new object
```

### Read Operation
```
GET request
  ↓
Extract filters/pagination from query
  ↓
Read JSON file
  ↓
Filter/search/sort as needed
  ↓
Paginate results
  ↓
Return 200 + data
```

### Update Operation
```
PUT/PATCH request
  ↓
Validate ID
  ↓
Check resource exists
  ↓
Merge old + new data
  ↓
Update updatedAt timestamp
  ↓
Write to JSON file
  ↓
Return 200 + updated object
```

### Delete Operation
```
DELETE request
  ↓
Validate ID
  ↓
Check resource exists
  ↓
Remove from array
  ↓
Write to JSON file
  ↓
Return 200 + success message
```

---

## 🚀 Start Server

```bash
cd f:\assginment\express

# Install dependencies (one time)
npm install

# Start server
npm start

# Server runs on http://localhost:3000
# Health check: http://localhost:3000/health
```

---

**All detailed explanations are in the code comments!** 📝

