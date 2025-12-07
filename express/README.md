# Express API - Advanced Documentation

## 🚀 Project Overview
A professional Express.js REST API with JSON file-based storage, advanced routing, validation, and error handling.

## 📁 Project Structure
```
express/
├── server.js                 # Main server file
├── package.json             # Project metadata
├── db/                      # JSON database files
│   ├── users.json
│   ├── products.json
│   └── orders.json
├── routes/                  # API route handlers
│   ├── userRoutes.js
│   ├── productRoutes.js
│   └── orderRoutes.js
└── utils/                   # Utility files
    ├── database.js          # JSON file operations
    ├── responseHandler.js   # Response formatting
    └── validator.js         # Input validation
```

## 🛠️ Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Server
```bash
npm start
```

Server will run on `http://localhost:3000`

## 📡 API Endpoints

### Users API

#### GET /api/users
Get all users with pagination and search
```
Query Params: ?search=john&page=1&limit=10
```

#### GET /api/users/:id
Get single user by ID

#### POST /api/users
Create new user
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "address": "123 Main St",
  "city": "New York",
  "country": "USA"
}
```

#### PUT /api/users/:id
Update entire user

#### PATCH /api/users/:id
Partial update user

#### DELETE /api/users/:id
Delete user

#### GET /api/users/filter/active
Get all active users

---

### Products API

#### GET /api/products
Get all products with filters
```
Query Params: ?category=electronics&minPrice=100&maxPrice=1000&sort=price-asc&page=1&limit=10
```

#### GET /api/products/:id
Get single product

#### POST /api/products
Create new product
```json
{
  "name": "Laptop",
  "price": 999.99,
  "category": "electronics",
  "stock": 50,
  "description": "High-performance laptop",
  "image": "laptop.jpg"
}
```

#### PUT /api/products/:id
Update entire product

#### PATCH /api/products/:id
Partial update product

#### DELETE /api/products/:id
Delete product

#### GET /api/products/stock/low
Get low stock products (threshold=5)

#### GET /api/products/category/:category
Get products by category

---

### Orders API

#### GET /api/orders
Get all orders with filters
```
Query Params: ?userId=1&status=pending&page=1&limit=10
```

#### GET /api/orders/:id
Get single order

#### POST /api/orders
Create new order
```json
{
  "userId": 1,
  "items": [
    {"productId": 1, "quantity": 2, "price": 99.99}
  ],
  "totalAmount": 199.98,
  "shippingAddress": "123 Main St",
  "paymentMethod": "credit-card",
  "notes": "Express delivery"
}
```

#### PUT /api/orders/:id
Update entire order

#### PATCH /api/orders/:id
Partial update order (e.g., status)

#### DELETE /api/orders/:id
Delete order

#### GET /api/orders/user/:userId
Get orders by user

#### GET /api/orders/status/:status
Get orders by status (pending, confirmed, shipped, delivered, cancelled)

#### POST /api/orders/:id/cancel
Cancel an order

---

## 🔍 Features

✅ **CRUD Operations** - Full Create, Read, Update, Delete support
✅ **Pagination** - Built-in pagination with page and limit
✅ **Filtering** - Advanced filtering by multiple criteria
✅ **Validation** - Email, phone, required fields validation
✅ **Error Handling** - Comprehensive error responses
✅ **JSON Storage** - Persistent file-based storage
✅ **Response Formatting** - Consistent API responses
✅ **Status Codes** - Proper HTTP status codes (200, 201, 400, 404, 409, 500)

## 📝 Response Format

### Success Response
```json
{
  "status": true,
  "statusCode": 200,
  "message": "Success message",
  "data": {},
  "timestamp": "2025-11-23T10:30:00.000Z"
}
```

### Error Response
```json
{
  "status": false,
  "statusCode": 400,
  "message": "Error message",
  "timestamp": "2025-11-23T10:30:00.000Z"
}
```

### Paginated Response
```json
{
  "status": true,
  "statusCode": 200,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2025-11-23T10:30:00.000Z"
}
```

## 🧪 Testing with cURL

### Create User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name":"John",
    "email":"john@test.com",
    "phone":"1234567890"
  }'
```

### Get All Users
```bash
curl http://localhost:3000/api/users
```

### Update User
```bash
curl -X PUT http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"John Updated"}'
```

### Delete User
```bash
curl -X DELETE http://localhost:3000/api/users/1
```

## 🚀 Advanced Features

### Search Functionality
Search users by name or email:
```
GET /api/users?search=john
```

### Sorting
Sort products by price:
```
GET /api/products?sort=price-asc
GET /api/products?sort=price-desc
```

### Filtering by Date
Filters can be used for date ranges, numeric ranges, and string matching.

### Validation Rules

- **Email**: Must be valid email format (xxx@xxx.xxx)
- **Phone**: Must be 10 digits
- **Price**: Must be positive number
- **Stock**: Must be non-negative integer
- **Order Status**: pending, confirmed, shipped, delivered, cancelled

## 🔒 Security Considerations

- Input validation on all POST/PUT endpoints
- Duplicate email prevention
- ID validation for all routes
- Error messages don't expose sensitive data
- Timestamps on all responses

## 📊 Database Structure

### Users
```json
{
  "id": 1,
  "name": "string",
  "email": "string",
  "phone": "string",
  "address": "string",
  "city": "string",
  "country": "string",
  "isActive": "boolean",
  "createdAt": "ISO string",
  "updatedAt": "ISO string"
}
```

### Products
```json
{
  "id": 1,
  "name": "string",
  "price": "number",
  "category": "string",
  "stock": "number",
  "description": "string",
  "image": "string",
  "inStock": "boolean",
  "createdAt": "ISO string",
  "updatedAt": "ISO string"
}
```

### Orders
```json
{
  "id": 1,
  "userId": "number",
  "items": "array",
  "totalAmount": "number",
  "status": "string",
  "paymentMethod": "string",
  "shippingAddress": "string",
  "notes": "string",
  "createdAt": "ISO string",
  "updatedAt": "ISO string"
}
```

## 🎯 Key Best Practices Implemented

1. ✅ Consistent naming conventions
2. ✅ Proper HTTP methods (GET, POST, PUT, PATCH, DELETE)
3. ✅ Appropriate status codes
4. ✅ Input validation and sanitization
5. ✅ Error handling and logging
6. ✅ Pagination for large datasets
7. ✅ RESTful endpoint design
8. ✅ Separation of concerns (routes, utils, database)
9. ✅ Comprehensive documentation
10. ✅ Timestamp tracking for all records

---

**Created**: November 23, 2025
**Version**: 1.0.0
