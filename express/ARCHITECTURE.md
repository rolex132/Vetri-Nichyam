# 🏗️ ARCHITECTURE & CONTROL FLOW DIAGRAM

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser/cURL)                    │
│                                                             │
│  curl -X GET/POST/PUT/DELETE /api/users                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              NETWORK (HTTP Request/Response)                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  EXPRESS SERVER (server.js)                 │
│                                                             │
│  app.listen(3000)                                           │
│  ├─ Middleware Layer                                       │
│  │  ├─ express.json() - Parse JSON bodies                 │
│  │  └─ express.urlencoded() - Parse form data             │
│  │                                                         │
│  └─ Routes Dispatcher                                      │
│     ├─ /api/users → userRoutes.js                          │
│     ├─ /api/products → productRoutes.js                    │
│     └─ /api/orders → orderRoutes.js                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   ┌─────────┐   ┌─────────┐   ┌─────────┐
   │  User   │   │ Product │   │  Order  │
   │ Routes  │   │ Routes  │   │ Routes  │
   └────┬────┘   └────┬────┘   └────┬────┘
        │             │             │
        └─────────────┼─────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │  Validator Middleware       │
        │                             │
        │  validateRequired()         │
        │  validateEmail()            │
        │  validatePhone()            │
        │  validateId()               │
        └────────────┬────────────────┘
                     │
                     ▼
        ┌─────────────────────────────┐
        │  Route Handler Functions    │
        │                             │
        │  POST /api/users            │
        │  GET /api/users/:id         │
        │  PUT /api/users/:id         │
        │  PATCH /api/users/:id       │
        │  DELETE /api/users/:id      │
        │  ... etc for all resources  │
        └────────────┬────────────────┘
                     │
                     ▼
        ┌─────────────────────────────┐
        │   Database Functions        │
        │   (database.js)             │
        │                             │
        │  - readFile()               │
        │  - writeFile()              │
        │  - getAll()                 │
        │  - getById()                │
        │  - create()                 │
        │  - update()                 │
        │  - deleteRecord()           │
        │  - search()                 │
        │  - filter()                 │
        └────────────┬────────────────┘
                     │
                     ▼
        ┌─────────────────────────────┐
        │    File System (disk)       │
        │                             │
        │  /db/                       │
        │  ├─ users.json              │
        │  ├─ products.json           │
        │  └─ orders.json             │
        └─────────────────────────────┘
```

---

## Request-Response Cycle

```
REQUEST COMING IN:
═════════════════════════════════════════════════════════════

1. CLIENT SENDS REQUEST
   ┌────────────────────────────────┐
   │  POST /api/users               │
   │  Content-Type: application/json│
   │  Body: {name, email, phone}    │
   └────────────────┬───────────────┘
                    │

2. EXPRESS RECEIVES → server.js
   │
   ▼

3. MIDDLEWARE LAYER
   ┌─────────────────────────┐
   │ express.json()          │
   │ Parses request body     │
   │ req.body = {...}        │
   └────────┬────────────────┘
            │
            ▼
   ┌─────────────────────────┐
   │ Router matching         │
   │ /api/users matched!     │
   │ Load userRoutes.js      │
   └────────┬────────────────┘
            │

4. VALIDATOR MIDDLEWARE
   ┌─────────────────────────────────────┐
   │ validateRequired(['name','email','phone']) │
   │ ✓ All fields present? YES            │
   │ → Call next()                        │
   └────────┬────────────────────────────┘
            │
            ▼
   ┌─────────────────────────────────────┐
   │ validateEmail                       │
   │ ✓ Email format valid? YES            │
   │ → Call next()                        │
   └────────┬────────────────────────────┘
            │
            ▼
   ┌─────────────────────────────────────┐
   │ validatePhone                       │
   │ ✓ Phone 10 digits? YES               │
   │ → Call next()                        │
   └────────┬────────────────────────────┘
            │

5. ROUTE HANDLER (routes/userRoutes.js)
   ┌─────────────────────────────────────┐
   │ router.post('/', ..., (req,res) => {│
   │                                     │
   │ Check duplicate email               │
   │ db.search('users.json', 'email'...)│
   │ → Not found ✓                        │
   │                                     │
   │ Create new user                     │
   │ db.create('users.json', {...})      │
   └────────┬────────────────────────────┘
            │

6. DATABASE LAYER (utils/database.js)
   ┌──────────────────────────────────────┐
   │ db.create(filename, newRecord)       │
   │                                      │
   │ 1. readFile() - Read users.json      │
   │    fs.readFileSync() → get existing  │
   │    JSON.parse() → convert to array   │
   │                                      │
   │ 2. Calculate ID                      │
   │    id = Math.max(...ids) + 1         │
   │                                      │
   │ 3. Add record with auto fields       │
   │    Add createdAt timestamp           │
   │    Add updatedAt timestamp           │
   │                                      │
   │ 4. writeFile() - Save users.json     │
   │    JSON.stringify() → convert        │
   │    fs.writeFileSync() → write to disk│
   │                                      │
   │ 5. Return new user object            │
   └────────┬─────────────────────────────┘
            │

7. FILE SYSTEM UPDATES
   ┌──────────────────────────────────┐
   │ users.json on disk               │
   │ [                                │
   │   {...existing users...},        │
   │   {...NEW USER...}  ← Added!     │
   │ ]                                │
   └──────────────────────────────────┘
            │

8. RESPONSE FORMATTING (utils/responseHandler.js)
   ┌──────────────────────────────────┐
   │ response.success(data, msg, code)│
   │                                  │
   │ Returns:                         │
   │ {                                │
   │   status: true,                  │
   │   statusCode: 201,               │
   │   message: "Created",            │
   │   data: {...user},               │
   │   timestamp: "2025-11-23T..."    │
   │ }                                │
   └────────┬─────────────────────────┘
            │

9. EXPRESS SENDS RESPONSE
   ┌──────────────────────────────┐
   │ res.status(201).json({...})  │
   │                              │
   │ HTTP/1.1 201 Created         │
   │ Content-Type: application/json│
   │ {...response JSON...}         │
   └────────┬─────────────────────┘
            │

10. CLIENT RECEIVES RESPONSE
    └─────────────────────────────────┐
        Browser/cURL receives response │
        Parses JSON                    │
        Displays to user               │
        ✓ User created successfully!   │
```

---

## Data Flow Diagram

```
CRUD OPERATIONS DATA FLOW:

CREATE (POST):
   Client JSON
      ↓
   Parse JSON → req.body
      ↓
   Validate all fields
      ↓
   Read existing data (users.json)
      ↓
   Calculate new ID
      ↓
   Create object with timestamps
      ↓
   Add to array
      ↓
   Write back to file
      ↓
   Return 201 + new object


READ (GET):
   Query parameters
      ↓
   Extract: search, filter, page, limit
      ↓
   Read file (users.json)
      ↓
   Apply search filter
      ↓
   Apply other filters
      ↓
   Sort if needed
      ↓
   Calculate pagination
      ↓
   Slice array for current page
      ↓
   Return 200 + paginated data


UPDATE (PUT/PATCH):
   Client JSON + ID
      ↓
   Validate ID
      ↓
   Read file (users.json)
      ↓
   Find record by ID
      ↓
   Merge: Keep old data + apply new fields
      ↓
   Update timestamp
      ↓
   Write back to file
      ↓
   Return 200 + updated object


DELETE (DELETE):
   ID parameter
      ↓
   Validate ID
      ↓
   Read file (users.json)
      ↓
   Find record by ID
      ↓
   Filter out that record
      ↓
   Write filtered array to file
      ↓
   Return 200 + success message
```

---

## Validation Pipeline

```
INCOMING REQUEST
    │
    ▼
┌──────────────────────────────────┐
│ middleware 1: validateRequired   │
│                                  │
│ Check: name present? ✓           │
│ Check: email present? ✓          │
│ Check: phone present? ✓          │
│                                  │
│ If ALL present → next()          │
│ If ANY missing → 400 error       │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ middleware 2: validateEmail      │
│                                  │
│ Regex test: /^[^\s@]+@...$/      │
│                                  │
│ If present & valid → next()      │
│ If present & invalid → 400 error │
│ If not present → next() (skip)   │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ middleware 3: validatePhone      │
│                                  │
│ Extract digits only              │
│ Check length === 10              │
│                                  │
│ If valid → next()                │
│ If invalid → 400 error           │
│ If not present → next() (skip)   │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ middleware 4: validateId         │
│                                  │
│ Check: isNaN() → false ✓         │
│ Check: parseInt > 0 ✓            │
│                                  │
│ If valid → next()                │
│ If invalid → 400 error           │
└──────────────┬───────────────────┘
               │
               ▼
        ROUTE HANDLER
       (process logic)
```

---

## Error Handling Flow

```
ERROR OCCURS
    │
    ▼
┌─────────────────────────────────┐
│ try-catch block                 │
│                                 │
│ Error thrown anywhere           │
│ Caught by catch(err)            │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Check error type                │
│                                 │
│ Validation error?               │
│ → statusCode = 400              │
│                                 │
│ Not found error?                │
│ → statusCode = 404              │
│                                 │
│ Duplicate error?                │
│ → statusCode = 409              │
│                                 │
│ Server error?                   │
│ → statusCode = 500              │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ response.error()                │
│                                 │
│ Format error response:          │
│ {                               │
│   status: false,                │
│   statusCode: 400,              │
│   message: "User friendly msg", │
│   timestamp: "2025-11-23..."    │
│ }                               │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ res.status(code).json(error)    │
│                                 │
│ Send error response to client   │
└─────────────────────────────────┘
```

---

## Database Operations Timeline

```
TIME ──→

USER ACTION: Create new user

T0: Request arrives
    db.json = [User1, User2]

T1: Read file
    readFile('users.json')
    ↓
    "[{id:1,...}, {id:2,...}]" (JSON text)
    ↓
    JSON.parse() converts to array
    ↓
    [User1, User2] (JavaScript array in memory)

T2: Calculate ID
    Math.max(1, 2) + 1 = 3

T3: Create new user object
    {
      id: 3,
      name: "John",
      email: "john@ex.com",
      ...
      createdAt: "2025-11-23T10:30:45Z",
      updatedAt: "2025-11-23T10:30:45Z"
    }

T4: Add to array
    [User1, User2, User3_NEW]

T5: Write to file
    JSON.stringify(array) → JSON text
    ↓
    "[{id:1,...}, {id:2,...}, {id:3,...}]" (JSON text)
    ↓
    fs.writeFileSync() writes to disk
    ↓
    users.json on disk updated!

T6: Return to client
    Send 201 + User3 object
```

---

## Complete Request Example Timeline

```
TIMELINE OF A COMPLETE REQUEST:

T0ms:  User types curl command
       curl -X POST http://localhost:3000/api/users ...

T10ms: Request arrives at Express
       POST /api/users with JSON body

T15ms: Middleware: express.json()
       Request body parsed
       req.body = {name, email, phone, address, city, country}

T20ms: Route matching
       /api/users matched
       Load routes/userRoutes.js

T25ms: Validator 1: validateRequired
       Check: name✓, email✓, phone✓
       → Pass, call next()

T30ms: Validator 2: validateEmail
       Regex test: john@ex.com ✓
       → Pass, call next()

T35ms: Validator 3: validatePhone
       Extract digits: 1234567890 (10)✓
       → Pass, call next()

T40ms: Route handler executes
       Duplicate email check
       db.search('users.json', 'email', 'john@ex.com')
       → Not found ✓

T50ms: Database.create() called
       Read users.json
       Calculate ID = 3
       Create object with timestamps

T60ms: Database.writeFile()
       Write updated users.json to disk
       File saved ✓

T70ms: Response formatting
       response.success(newUser, msg, 201)

T75ms: Express sends response
       HTTP 201 Created
       Send JSON response

T80ms: Network transmission
       JSON travels through internet

T100ms: Browser/client receives response
        Parses JSON
        ✓ User created successfully!
        Display to user
```

---

## Code Execution Path

```
server.js
    ↓
app.listen(3000)
    ↓
Request arrives
    ↓
middleware (express.json)
    ↓
app.use('/api/users', userRoutes)
    ↓
routes/userRoutes.js
    ↓
router.post('/', validators..., (req, res) => {
    ├─ validateRequired
    ├─ validateEmail
    ├─ validatePhone
    │
    └─ if email duplicate → return 409
    │
    └─ db.create('users.json', {data})
        ├─ readFile()
        │   ├─ fs.readFileSync()
        │   ├─ JSON.parse()
        │   └─ return []
        │
        ├─ Calculate ID
        │   └─ Math.max(...ids) + 1
        │
        ├─ Create object
        │   ├─ id
        │   ├─ data fields
        │   ├─ createdAt
        │   └─ updatedAt
        │
        ├─ Push to array
        │
        ├─ writeFile()
        │   ├─ JSON.stringify()
        │   ├─ fs.writeFileSync()
        │   └─ return true
        │
        └─ return newUser
    │
    └─ response.success(newUser, msg, 201)
        └─ return {status, statusCode, data, message, timestamp}
    │
    └─ res.status(201).json(response)
        └─ Send to client
```

---

## Summary

**Key Flows:**
1. **Request** comes in with HTTP method + data
2. **Middleware** parses and processes request
3. **Validators** check data is valid
4. **Route handler** executes business logic
5. **Database** reads/writes JSON files
6. **Response** formatted and sent back
7. **Client** receives and processes response

**Key Layers:**
- Express: HTTP server and routing
- Validators: Data validation before processing
- Routes: Business logic and API endpoints
- Database: JSON file read/write operations
- Responses: Consistent format for all responses

**Key Operations:**
- CREATE: Add new record with auto-ID and timestamps
- READ: Query, filter, search, paginate
- UPDATE: Merge old + new data, update timestamp
- DELETE: Remove from array, write back

