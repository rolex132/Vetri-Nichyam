# 🚀 COMMAND FLOW GUIDE - How Everything Works

## 📚 Complete Control Flow & Data Flow Documentation

This guide explains **HOW** everything works, **WHY** it works that way, and **WHERE** the control flows through the application.

---

## 🔄 REQUEST LIFECYCLE

Every request follows this flow:

```
1. Client sends HTTP Request
   ↓
2. Express receives request
   ↓
3. Middleware processes (parse JSON, etc.)
   ↓
4. Route matching (find correct handler)
   ↓
5. Validator middleware (check data validity)
   ↓
6. Route handler (process business logic)
   ↓
7. Database operation (read/write JSON file)
   ↓
8. Format response (wrap in standard format)
   ↓
9. Send JSON response to client
   ↓
10. Client receives response
```

---

## 📡 USER ROUTES - /api/users

### GET /api/users - Fetch All Users

**HOW IT WORKS:**
```
User Request: GET /api/users?search=john&page=1&limit=10
     ↓
Route: router.get('/')
     ↓
Extract query params: search, page, limit
     ↓
db.getAll('users.json') → Read entire users.json file
     ↓
Filter by search term (name or email contains "john")
     ↓
Calculate pagination: start = (1-1)*10 = 0, take items 0-9
     ↓
Format response with pagination info
     ↓
Return: {data: [...users], pagination: {page, limit, total, totalPages, hasNext, hasPrev}}
```

**COMMAND EXAMPLE:**
```bash
# Get all users, page 1, 10 per page
curl http://localhost:3000/api/users

# Search for users named "john"
curl "http://localhost:3000/api/users?search=john"

# Get specific page
curl "http://localhost:3000/api/users?page=2&limit=5"

# Combine filters
curl "http://localhost:3000/api/users?search=john&page=1&limit=20"
```

**DATA FLOW:**
```
users.json (JSON file)
    ↓
readFile() parses JSON to array
    ↓
[User1, User2, User3, ...]
    ↓
Filter/Search: [User1]
    ↓
Paginate: [User1] (for page 1)
    ↓
response.paginated() wraps data
    ↓
Sends: {status: true, data: [User1], pagination: {...}}
```

---

### GET /api/users/:id - Fetch Single User

**HOW IT WORKS:**
```
User Request: GET /api/users/1
     ↓
validateId middleware: Check if ID is valid number (> 0)
     ↓
Route: router.get('/:id')
     ↓
db.getById(FILENAME, id=1)
     ↓
Read users.json, find user.id === 1
     ↓
If found: Return user object
If not found: Return 404 error
```

**COMMAND EXAMPLE:**
```bash
curl http://localhost:3000/api/users/1          # Returns user with ID 1
curl http://localhost:3000/api/users/999        # Returns 404
curl http://localhost:3000/api/users/abc        # Returns 400 (invalid ID)
```

---

### POST /api/users - Create New User

**HOW IT WORKS:**
```
User Request: POST /api/users with JSON body
     {
       "name": "John Doe",
       "email": "john@example.com",
       "phone": "1234567890",
       "address": "123 Main St",
       "city": "NYC",
       "country": "USA"
     }
     ↓
validateRequired middleware: Check name, email, phone present
     ↓
validateEmail middleware: Check email format valid
     ↓
validatePhone middleware: Check phone is 10 digits
     ↓
Route: router.post('/')
     ↓
db.search(FILENAME, 'email', 'john@example.com')
     ↓
Check if email already exists
     ↓
If exists: Return 409 Conflict error
If not exists: Continue
     ↓
db.create() generates:
  - id: Math.max(existing IDs) + 1 = next ID
  - createdAt: current timestamp
  - updatedAt: current timestamp
     ↓
Write new user to users.json
     ↓
Return 201 Created with new user object
```

**COMMAND EXAMPLE:**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name":"John Doe",
    "email":"john@example.com",
    "phone":"1234567890",
    "address":"123 Main St",
    "city":"NYC",
    "country":"USA"
  }'

# Missing required field → 400 error
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John"}'  # Missing email, phone

# Invalid email → 400 error
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"invalid","phone":"1234567890"}'

# Email already exists → 409 error
# (if john@example.com already in database)
```

**DATABASE OPERATION:**
```
Before:
users.json = [
  {id: 1, name: "Alice", email: "alice@ex.com", ...},
  {id: 2, name: "Bob", email: "bob@ex.com", ...}
]

Create new user with name="John", email="john@ex.com"
     ↓
Calculate next ID: Math.max(1, 2) + 1 = 3
     ↓
Create object:
{
  id: 3,
  name: "John",
  email: "john@ex.com",
  ...,
  createdAt: "2025-11-23T10:30:00.000Z",
  updatedAt: "2025-11-23T10:30:00.000Z"
}
     ↓
After:
users.json = [
  {id: 1, ...},
  {id: 2, ...},
  {id: 3, name: "John", email: "john@ex.com", ...}  // NEW
]
```

---

### PUT /api/users/:id - Full Update User

**HOW IT WORKS:**
```
User Request: PUT /api/users/1
     {
       "name": "John Smith",
       "email": "john.smith@example.com",
       "phone": "9876543210"
     }
     ↓
validateId: Check ID is valid
     ↓
validateEmail: Check email format if provided
     ↓
validatePhone: Check phone format if provided
     ↓
Route: router.put('/:id')
     ↓
db.getById() → Find user with ID 1
     ↓
If not found: Return 404
     ↓
If email changed: Check if new email already used
     ↓
If duplicate: Return 409 Conflict
     ↓
db.update() → Merge old + new fields
     ↓
Keep: id, createdAt
Update: All provided fields, updatedAt = now
     ↓
Write to users.json
     ↓
Return updated user
```

**COMMAND EXAMPLE:**
```bash
# Update entire user
curl -X PUT http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"John Smith","email":"john.smith@ex.com","phone":"9876543210"}'

# Result: User 1 now has these values
```

---

### PATCH /api/users/:id - Partial Update User

**HOW IT WORKS:**
```
User Request: PATCH /api/users/1
     {
       "city": "Los Angeles"
     }
     ↓
validateId: Check ID is valid
     ↓
Route: router.patch('/:id')
     ↓
db.getById() → Find user with ID 1
     ↓
If not found: Return 404
     ↓
db.update() → Merge new fields only
     ↓
DIFFERENCE FROM PUT:
- PUT: Update all fields (or provide all)
- PATCH: Update ONLY provided fields
     ↓
Keep: All old fields + id + createdAt
Update: {city: "Los Angeles"} + updatedAt
     ↓
Write to users.json
     ↓
Return updated user (only city changed, others same)
```

**COMMAND EXAMPLE:**
```bash
# Update only one field
curl -X PATCH http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"city":"Los Angeles"}'

# Result: Only city changes, everything else stays same
```

---

### DELETE /api/users/:id - Delete User

**HOW IT WORKS:**
```
User Request: DELETE /api/users/1
     ↓
validateId: Check ID is valid
     ↓
Route: router.delete('/:id')
     ↓
db.getById() → Find user with ID 1
     ↓
If not found: Return 404
     ↓
db.deleteRecord() → Filter out user with ID 1
     ↓
Before: [User1, User2, User3]
Filter: [User2, User3] (User1 removed)
     ↓
Write filtered array to users.json
     ↓
Return success message
```

**COMMAND EXAMPLE:**
```bash
curl -X DELETE http://localhost:3000/api/users/1

# User 1 is now removed from database
```

---

## 🛍️ PRODUCT ROUTES - /api/products

### GET /api/products - Advanced Filtering

**HOW IT WORKS:**
```
Request: GET /api/products?category=electronics&minPrice=100&maxPrice=1000&sort=price-asc&page=1
     ↓
Extract params: category, minPrice, maxPrice, sort, page, limit
     ↓
db.getAll('products.json') → Get ALL products
     ↓
FILTER BY CATEGORY:
if (category) filter products.category === "electronics"
Result: [Laptop, Phone, Tablet] (only electronics)
     ↓
FILTER BY PRICE RANGE:
if (minPrice || maxPrice) filter price >= 100 && price <= 1000
Result: [Laptop-$999, Phone-$499] (within range)
     ↓
SORTING:
if (sort === 'price-asc') sort by price ascending
Result: [Phone-$499, Laptop-$999]
     ↓
PAGINATION:
page=1, limit=10
start = (1-1)*10 = 0
slice(0, 10) = [Phone-$499, Laptop-$999]
     ↓
Return paginated response
```

**COMMAND EXAMPLES:**
```bash
# Get all products
curl http://localhost:3000/api/products

# Filter by category
curl "http://localhost:3000/api/products?category=electronics"

# Price range filter
curl "http://localhost:3000/api/products?minPrice=100&maxPrice=1000"

# Sorting
curl "http://localhost:3000/api/products?sort=price-asc"
curl "http://localhost:3000/api/products?sort=price-desc"
curl "http://localhost:3000/api/products?sort=name"

# Combine all filters
curl "http://localhost:3000/api/products?category=electronics&minPrice=100&maxPrice=1000&sort=price-asc&page=1&limit=20"
```

---

### POST /api/products - Create Product

**HOW IT WORKS:**
```
Request: POST /api/products with body
     {
       "name": "Laptop",
       "price": 999.99,
       "category": "electronics",
       "stock": 50,
       "description": "High-performance",
       "image": "laptop.jpg"
     }
     ↓
validateRequired: Check name, price, category, stock present
     ↓
Route: router.post('/')
     ↓
VALIDATION:
Check price is number && price >= 0
Check stock is number && stock >= 0
     ↓
db.create():
- id: auto-generated (next ID)
- price: convert to float (999.99)
- stock: convert to integer (50)
- inStock: true if stock > 0, else false
- createdAt, updatedAt: timestamps
     ↓
Write to products.json
     ↓
Return 201 Created with new product
```

**COMMAND EXAMPLE:**
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Laptop",
    "price":999.99,
    "category":"electronics",
    "stock":50,
    "description":"High-performance laptop",
    "image":"laptop.jpg"
  }'
```

---

### GET /api/products/stock/low - Low Stock Alert

**HOW IT WORKS:**
```
Request: GET /api/products/stock/low?threshold=5
     ↓
Extract threshold = 5 (or default if not provided)
     ↓
db.filter(FILENAME, product => product.stock <= 5)
     ↓
Read products.json
Filter each product: if stock <= 5, include it
     ↓
Return all products with low stock
```

**COMMAND EXAMPLE:**
```bash
# Get products with stock <= 5 (default)
curl http://localhost:3000/api/products/stock/low

# Get products with stock <= 20
curl "http://localhost:3000/api/products/stock/low?threshold=20"
```

---

### GET /api/products/category/:category - Products by Category

**HOW IT WORKS:**
```
Request: GET /api/products/category/electronics
     ↓
Extract category from URL = "electronics"
     ↓
db.filter() search products.json
Filter: product.category.toLowerCase() === "electronics"
     ↓
Return matching products or 404
```

**COMMAND EXAMPLE:**
```bash
curl http://localhost:3000/api/products/category/electronics
curl http://localhost:3000/api/products/category/books
```

---

## 📦 ORDER ROUTES - /api/orders

### POST /api/orders - Create Order

**HOW IT WORKS:**
```
Request: POST /api/orders with body
     {
       "userId": 1,
       "items": [
         {"productId": 1, "quantity": 2, "price": 99.99}
       ],
       "totalAmount": 199.98,
       "shippingAddress": "123 Main St",
       "paymentMethod": "credit-card"
     }
     ↓
validateRequired: Check userId, items, totalAmount present
     ↓
Route: router.post('/')
     ↓
VALIDATION:
Check items is array && items.length > 0
Check totalAmount is number && totalAmount > 0
     ↓
db.create():
- id: auto-generated
- userId: convert to int
- items: store array as-is
- totalAmount: convert to float
- status: ALWAYS "pending" (initial status)
- createdAt, updatedAt: timestamps
     ↓
Write to orders.json
     ↓
Return 201 Created with new order
```

**COMMAND EXAMPLE:**
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId":1,
    "items":[{"productId":1,"quantity":2,"price":99.99}],
    "totalAmount":199.98,
    "shippingAddress":"123 Main St",
    "paymentMethod":"credit-card"
  }'
```

---

### PATCH /api/orders/:id - Update Order Status

**HOW IT WORKS:**
```
Request: PATCH /api/orders/1
     {
       "status": "shipped"
     }
     ↓
validateId: Check ID is valid
     ↓
Route: router.patch('/:id')
     ↓
VALIDATION:
If status provided, check it's valid:
Valid: ["pending", "confirmed", "shipped", "delivered", "cancelled"]
If invalid: Return 400 error
     ↓
db.update() merge fields
Keep: id, userId, createdAt
Update: status, updatedAt
     ↓
Write to orders.json
     ↓
Return updated order

ORDER LIFECYCLE:
pending ──→ confirmed ──→ shipped ──→ delivered
  ↓
  └──────→ cancelled (can cancel from any status)
```

**COMMAND EXAMPLE:**
```bash
# Create order (starts as "pending")
curl -X POST http://localhost:3000/api/orders ...

# Confirm order
curl -X PATCH http://localhost:3000/api/orders/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"confirmed"}'

# Ship order
curl -X PATCH http://localhost:3000/api/orders/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"shipped"}'

# Deliver order
curl -X PATCH http://localhost:3000/api/orders/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"delivered"}'
```

---

### GET /api/orders/user/:userId - User's Orders

**HOW IT WORKS:**
```
Request: GET /api/orders/user/1
     ↓
validateId: Check ID is valid
     ↓
Route: router.get('/user/:userId')
     ↓
db.filter(FILENAME, o => o.userId === 1)
     ↓
Read orders.json
Filter: Keep only orders where userId == 1
     ↓
If no orders found: Return 404
If found: Return orders array
```

**COMMAND EXAMPLE:**
```bash
# Get all orders from user 1
curl http://localhost:3000/api/orders/user/1

# View customer's order history
```

---

### GET /api/orders/status/:status - Orders by Status

**HOW IT WORKS:**
```
Request: GET /api/orders/status/pending
     ↓
Extract status = "pending"
     ↓
Route: router.get('/status/:status')
     ↓
db.filter() search orders.json
Filter: order.status.toLowerCase() === "pending"
     ↓
Return all pending orders
```

**COMMAND EXAMPLE:**
```bash
# Get all pending orders
curl http://localhost:3000/api/orders/status/pending

# Get all shipped orders
curl http://localhost:3000/api/orders/status/shipped

# Admin dashboard - view orders by status
curl http://localhost:3000/api/orders/status/delivered
```

---

### POST /api/orders/:id/cancel - Cancel Order

**HOW IT WORKS:**
```
Request: POST /api/orders/1/cancel
     ↓
validateId: Check ID is valid
     ↓
Route: router.post('/:id/cancel')
     ↓
db.getById() → Find order with ID 1
     ↓
If not found: Return 404
     ↓
CONSTRAINT CHECK:
if (order.status !== "pending") Return 400 error
WHY: Can only cancel pending orders
     ↓
db.update() set status = "cancelled"
     ↓
Write to orders.json
     ↓
Return cancelled order
```

**COMMAND EXAMPLE:**
```bash
# Cancel pending order
curl -X POST http://localhost:3000/api/orders/1/cancel

# Try to cancel non-pending order → 400 error
# (Order already shipped/delivered cannot be cancelled)
```

---

## 🔐 VALIDATION PIPELINE

### How Validators Work

**CONTROL FLOW:**
```
Incoming Request
     ↓
[Middleware 1: validateRequired]
├─ Check all required fields present
├─ If missing: Return 400 ✗
└─ If present: Call next() ✓
     ↓
[Middleware 2: validateEmail]
├─ Check email format if provided
├─ Regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
├─ If invalid: Return 400 ✗
└─ If valid: Call next() ✓
     ↓
[Middleware 3: validatePhone]
├─ Check phone has 10 digits
├─ Extract only digits
├─ If wrong length: Return 400 ✗
└─ If valid: Call next() ✓
     ↓
[Middleware 4: validateId]
├─ Check ID is numeric
├─ Check ID > 0
├─ If invalid: Return 400 ✗
└─ If valid: Call next() ✓
     ↓
[Route Handler Executes]
```

**EXAMPLE:**
```bash
# All validators pass
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@ex.com","phone":"1234567890"}'
✓ All present (validateRequired)
✓ Email format valid (validateEmail)
✓ Phone is 10 digits (validatePhone)
✓ Route handler executes

# Missing name field
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"john@ex.com","phone":"1234567890"}'
✗ validateRequired fails → Returns 400

# Invalid email format
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"invalid","phone":"1234567890"}'
✓ validateRequired passes
✗ validateEmail fails → Returns 400
```

---

## 📊 DATABASE OPERATIONS - How JSON Files Work

### File-Based Storage

**DIRECTORY STRUCTURE:**
```
/db/
├── users.json      (All user records)
├── products.json   (All product records)
└── orders.json     (All order records)
```

**HOW READS WORK:**
```
1. request arrives → route handler
2. db.readFile('users.json')
3. fs.readFileSync() reads text from file
4. JSON.parse() converts text to JavaScript array
5. Array returned to route handler
```

**HOW WRITES WORK:**
```
1. Data operation complete
2. db.writeFile('users.json', updatedArray)
3. JSON.stringify() converts array to text
4. fs.writeFileSync() writes text to file
5. File on disk updated
```

**EXAMPLE:**
```
Before (users.json):
[
  {"id": 1, "name": "Alice", ...},
  {"id": 2, "name": "Bob", ...}
]

After adding John:
[
  {"id": 1, "name": "Alice", ...},
  {"id": 2, "name": "Bob", ...},
  {"id": 3, "name": "John", ...}  // NEW
]
```

---

## 🎯 ERROR HANDLING

### How Errors Flow

**CONTROL FLOW:**
```
Error occurs (in route or database)
     ↓
try-catch block captures error
     ↓
res.status(500).json(response.error('message', statusCode))
     ↓
Global error handler (if not caught)
     ↓
Formatted error response sent to client
```

**HTTP STATUS CODES:**
```
200 - OK (successful GET)
201 - Created (successful POST, new resource)
400 - Bad Request (validation failed, invalid data)
404 - Not Found (resource doesn't exist)
409 - Conflict (duplicate email, data conflict)
500 - Server Error (unexpected error)
```

**EXAMPLE ERROR FLOW:**
```bash
# User not found
curl http://localhost:3000/api/users/999
↓
db.getById() returns null
↓
Handler: if (!user) return 404
↓
Response: {"status": false, "statusCode": 404, "message": "User not found"}

# Missing email field
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John","phone":"1234567890"}'
↓
validateRequired middleware checks
↓
email is missing
↓
Response: {"status": false, "statusCode": 400, "message": "Missing required fields: email"}
```

---

## 🔄 RESPONSE FORMAT - How Responses Are Built

### Success Response
```javascript
response.success(data, message, statusCode)
{
  "status": true,
  "statusCode": 200,
  "message": "User fetched successfully",
  "data": {...user object...},
  "timestamp": "2025-11-23T10:30:00.000Z"
}
```

### Paginated Response
```javascript
response.paginated(data, page, limit, total)
{
  "status": true,
  "statusCode": 200,
  "data": [{...}, {...}],  // Items for this page
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNext": true,        // Is there page 2?
    "hasPrev": false        // Is there page 0? (no)
  },
  "timestamp": "2025-11-23T10:30:00.000Z"
}
```

### Error Response
```javascript
response.error(message, statusCode, details)
{
  "status": false,
  "statusCode": 400,
  "message": "Validation Error",
  "details": "Optional error details",
  "timestamp": "2025-11-23T10:30:00.000Z"
}
```

---

## 📝 COMPLETE REQUEST EXAMPLE

### Create User - Full Flow

**COMMAND:**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "city": "NYC"
  }'
```

**STEP-BY-STEP FLOW:**

1. **Client sends request**
   ```
   POST /api/users
   Content-Type: application/json
   Body: {"name": "John Doe", "email": "john@example.com", "phone": "1234567890", "city": "NYC"}
   ```

2. **Express receives request**
   ```
   app.post('/api/users', ...)
   ```

3. **Middleware parse JSON**
   ```
   express.json() → req.body = {name, email, phone, city}
   ```

4. **Middleware validateRequired**
   ```
   Check: req.body.name ✓, req.body.email ✓, req.body.phone ✓
   All present → call next()
   ```

5. **Middleware validateEmail**
   ```
   Check: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test("john@example.com")
   Matches ✓ → call next()
   ```

6. **Middleware validatePhone**
   ```
   Check: "1234567890".replace(/\D/g, '') = "1234567890" (10 digits)
   Valid ✓ → call next()
   ```

7. **Route handler executes**
   ```
   db.search('users.json', 'email', 'john@example.com')
   → Find existing users with this email → []
   ```

8. **Create new user**
   ```
   db.create('users.json', {name, email, phone, city})
   → Read users.json
   → Calculate next ID = 1 (if first user)
   → Create object:
      {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        phone: "1234567890",
        city: "NYC",
        address: "",
        country: "",
        isActive: true,
        createdAt: "2025-11-23T10:30:45.123Z",
        updatedAt: "2025-11-23T10:30:45.123Z"
      }
   → Add to users.json
   ```

9. **Write to database**
   ```
   users.json updated:
   [
     {id: 1, name: "John Doe", email: "john@example.com", ...}
   ]
   ```

10. **Format response**
    ```
    response.success(newUser, 'User created successfully', 201)
    ```

11. **Send response**
    ```
    HTTP/1.1 201 Created
    Content-Type: application/json
    
    {
      "status": true,
      "statusCode": 201,
      "message": "User created successfully",
      "data": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "1234567890",
        "city": "NYC",
        "address": "",
        "country": "",
        "isActive": true,
        "createdAt": "2025-11-23T10:30:45.123Z",
        "updatedAt": "2025-11-23T10:30:45.123Z"
      },
      "timestamp": "2025-11-23T10:30:45.456Z"
    }
    ```

12. **Client receives response**
    ```
    Parses JSON
    Checks status === true
    Displays user data
    ```

---

## 🎓 KEY CONCEPTS

### Auto-incrementing IDs
```javascript
// How next ID is calculated
const id = data.length > 0 ? Math.max(...data.map(item => item.id || 0)) + 1 : 1;

Example:
- First user: id = 1
- Second user: id = 2 (max 1 + 1)
- After deleting user 2: Next new user still gets id = 3
  (because we take max of existing IDs, not use length)
```

### Timestamps
```javascript
// Automatic timestamps on every record
createdAt: new Date().toISOString()  // When created (never changes)
updatedAt: new Date().toISOString()  // When last modified (changes with updates)

// ISO Format: "2025-11-23T10:30:45.123Z"
```

### Pagination Calculation
```javascript
page = 2, limit = 10

start = (page - 1) * limit = (2 - 1) * 10 = 10
slice(start, start + limit) = slice(10, 20)

Items 0-9 on page 1
Items 10-19 on page 2
Items 20-29 on page 3
...
```

### Status Validation
```javascript
// Orders have valid status values
const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

// Only allow these values
if (!validStatuses.includes(newStatus)) {
  return error('Invalid status')
}
```

---

## 🧪 TESTING THE API

### Using cURL

```bash
# Start server
npm start

# Create user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@ex.com","phone":"9876543210"}'

# Get all users
curl http://localhost:3000/api/users

# Get specific user
curl http://localhost:3000/api/users/1

# Update user
curl -X PUT http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"city":"LA"}'

# Delete user
curl -X DELETE http://localhost:3000/api/users/1
```

---

## 📚 SUMMARY

| Aspect | How It Works |
|--------|-------------|
| **Requests** | Come in → Middleware → Validators → Route → Database → Response |
| **Data Storage** | JSON files in `/db/` directory |
| **IDs** | Auto-generated, start at 1, increment by 1 |
| **Timestamps** | Automatic, ISO format |
| **Validation** | Middleware pipeline, stops on first error |
| **Status Codes** | 200 success, 201 created, 400 bad, 404 not found, 500 error |
| **Responses** | Consistent format with status, data, message, timestamp |
| **Errors** | Caught in try-catch, formatted, sent to client |
| **Pagination** | Query params (page, limit), calculated (totalPages, hasNext, hasPrev) |

---

**Everything is documented in comments throughout the code!** 🎯

