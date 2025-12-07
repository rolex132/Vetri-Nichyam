/**
 * =====================================================
 * DATABASE UTILITY - utils/database.js
 * =====================================================
 * 
 * HOW IT WORKS:
 * - Uses Node.js built-in 'fs' module to read/write JSON files
 * - Stores data in /db folder as JSON files (no SQL database needed)
 * - Each resource type has its own JSON file (users.json, products.json, etc.)
 * 
 * WHY IT WORKS THIS WAY:
 * - Simple, no external database dependency
 * - Data is human-readable in JSON format
 * - File operations are synchronous for easier debugging
 * - Each function handles one specific database operation
 * 
 * CONTROL FLOW:
 * Request → Route Handler → Database Function → File Read/Write → Response
 * 
 * DATA FLOW:
 * JSON File → readFile() → JavaScript Array → Process Data → writeFile() → JSON File
 */

const fs = require('fs');
const path = require('path');

// ============================================
// DATABASE DIRECTORY SETUP - WHY: Centralized storage
// ============================================
const dbDir = path.join(__dirname, '../db');

// Create /db folder if it doesn't exist
// WHY: Ensures all JSON files are stored in one place
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('📁 Database directory created:', dbDir);
}

/**
 * ============================================
 * READ FILE FUNCTION - WHY: Fetch data from disk
 * ============================================
 * 
 * HOW: Reads JSON file → Parses text to JavaScript object
 * CONTROL FLOW: 
 *   - Check if file exists
 *   - Read file contents as text
 *   - Parse text as JSON
 *   - Return JavaScript array/object
 * 
 * @param {string} filename - Name of the JSON file (e.g., 'users.json')
 * @returns {Array|Object} - Parsed JSON data or empty array
 */
const readFile = (filename) => {
  try {
    const filePath = path.join(dbDir, filename);
    
    // WHY: Check if file exists before reading
    // If not, return empty array (no data yet)
    if (!fs.existsSync(filePath)) {
      return [];
    }
    
    // Read file contents as UTF-8 text
    const data = fs.readFileSync(filePath, 'utf-8');
    
    // Convert text to JavaScript object
    // WHY: JSON.parse() transforms JSON string to usable objects
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`❌ Error reading ${filename}:`, error.message);
    return [];
  }
};

/**
 * ============================================
 * WRITE FILE FUNCTION - WHY: Save data to disk
 * ============================================
 * 
 * HOW: Takes data → Converts to JSON text → Writes to file
 * CONTROL FLOW:
 *   - Convert JavaScript object to JSON text
 *   - Write text to file
 *   - Return success/failure status
 * 
 * @param {string} filename - Name of the JSON file
 * @param {Array|Object} data - Data to write
 * @returns {boolean} - Success status
 */
const writeFile = (filename, data) => {
  try {
    const filePath = path.join(dbDir, filename);
    
    // WHY: JSON.stringify() converts JavaScript to JSON text
    // WHY: null, 2 = format with 2-space indentation for readability
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`❌ Error writing to ${filename}:`, error.message);
    return false;
  }
};

/**
 * ============================================
 * GET ALL RECORDS - WHY: Retrieve all data
 * ============================================
 * 
 * USAGE: getAll('users.json') → Returns all users
 * CONTROL FLOW: readFile() → Return array
 * 
 * @param {string} filename - Name of the JSON file
 * @returns {Array} - All records in file
 */
const getAll = (filename) => {
  return readFile(filename);
};

/**
 * ============================================
 * GET BY ID - WHY: Find one specific record
 * ============================================
 * 
 * HOW: 
 * 1. Read all records from file
 * 2. Use .find() to search for matching ID
 * 3. Return matching record or null
 * 
 * CONTROL FLOW:
 *   - readFile() gets all data
 *   - Array.find() searches for id match
 *   - Return first match or null if not found
 * 
 * WHY parse(id): ID from URL is string, database IDs are numbers
 * 
 * @param {string} filename - Name of the JSON file
 * @param {number} id - Record ID to find
 * @returns {Object|null} - Found record or null
 */
const getById = (filename, id) => {
  const data = readFile(filename);
  
  // WHY: .find() returns first item matching condition
  // WHY: parseInt(id) converts string ID to number for comparison
  return data.find(item => item.id === parseInt(id)) || null;
};

/**
 * ============================================
 * CREATE NEW RECORD - WHY: Add data to file
 * ============================================
 * 
 * HOW:
 * 1. Read existing records
 * 2. Calculate next ID (max current ID + 1)
 * 3. Add timestamps and ID to new record
 * 4. Add to array
 * 5. Write updated array back to file
 * 
 * CONTROL FLOW:
 *   - readFile() gets existing data
 *   - Math.max() finds highest ID
 *   - Spread operator adds new fields
 *   - writeFile() saves updated data
 * 
 * WHY timestamps: Track when records were created/modified
 * WHY auto-incrementing ID: Ensures unique IDs without database
 * 
 * @param {string} filename - Name of the JSON file
 * @param {Object} newRecord - Data for new record
 * @returns {Object} - Created record with ID and timestamps
 */
const create = (filename, newRecord) => {
  const data = readFile(filename);
  
  // WHY: Calculate next available ID
  // If array empty, start at 1; otherwise, use max ID + 1
  const id = data.length > 0 ? Math.max(...data.map(item => item.id || 0)) + 1 : 1;
  
  // Create record object with auto-generated fields
  const record = {
    id,                                           // Auto-generated unique ID
    ...newRecord,                                 // Spread all user-provided fields
    createdAt: new Date().toISOString(),         // When record was created
    updatedAt: new Date().toISOString()          // When record was last updated
  };
  
  // Add new record to array
  data.push(record);
  
  // Save updated array to file
  writeFile(filename, data);
  
  return record;
};

/**
 * ============================================
 * UPDATE RECORD - WHY: Modify existing data
 * ============================================
 * 
 * HOW:
 * 1. Read all records
 * 2. Find index of record to update
 * 3. Merge old data with new data
 * 4. Update updatedAt timestamp
 * 5. Write back to file
 * 
 * CONTROL FLOW:
 *   - readFile() gets all data
 *   - findIndex() finds record position
 *   - Spread operator merges old + new fields
 *   - writeFile() saves changes
 * 
 * WHY keep id/createdAt: These shouldn't change during update
 * WHY update updatedAt: Track when last modification happened
 * 
 * @param {string} filename - Name of the JSON file
 * @param {number} id - ID of record to update
 * @param {Object} updateData - Fields to update
 * @returns {Object|null} - Updated record or null if not found
 */
const update = (filename, id, updateData) => {
  const data = readFile(filename);
  
  // WHY: findIndex() returns position, or -1 if not found
  const index = data.findIndex(item => item.id === parseInt(id));
  
  // Return null if record doesn't exist
  if (index === -1) return null;
  
  // WHY: Merge old data + new data, but preserve id/createdAt
  data[index] = {
    ...data[index],                              // Keep old fields
    ...updateData,                               // Override with new fields
    id: data[index].id,                          // Keep original ID
    createdAt: data[index].createdAt,            // Keep original creation date
    updatedAt: new Date().toISOString()          // Update modification timestamp
  };
  
  // Save updated data to file
  writeFile(filename, data);
  
  return data[index];
};

/**
 * ============================================
 * DELETE RECORD - WHY: Remove data from file
 * ============================================
 * 
 * HOW:
 * 1. Read all records
 * 2. Filter out record with matching ID
 * 3. If length changed, something was deleted
 * 4. Write filtered array back to file
 * 
 * CONTROL FLOW:
 *   - readFile() gets all data
 *   - .filter() removes matching record
 *   - Write filtered data
 * 
 * WHY filter instead of splice: Prevents accidental mutations
 * 
 * @param {string} filename - Name of the JSON file
 * @param {number} id - ID of record to delete
 * @returns {boolean} - True if deleted, false if not found
 */
const deleteRecord = (filename, id) => {
  const data = readFile(filename);
  
  // WHY: .filter() creates new array excluding matching ID
  // This doesn't modify original array (safer than splice)
  const filteredData = data.filter(item => item.id !== parseInt(id));
  
  // WHY: Compare lengths to check if anything was deleted
  // If lengths are same, record wasn't found
  if (filteredData.length === data.length) return false;
  
  // Save filtered data (without deleted record)
  writeFile(filename, filteredData);
  
  return true;
};

/**
 * ============================================
 * SEARCH RECORDS - WHY: Find records by field value
 * ============================================
 * 
 * HOW:
 * 1. Read all records
 * 2. Filter records where field contains search value
 * 3. Case-insensitive search
 * 4. Return matching records
 * 
 * CONTROL FLOW:
 *   - readFile() gets all data
 *   - .filter() + .includes() searches field
 * 
 * WHY toLowerCase(): Case-insensitive search is user-friendly
 * WHY String(): Convert field value to string for searching
 * 
 * @param {string} filename - Name of the JSON file
 * @param {string} field - Field name to search (e.g., 'email')
 * @param {*} value - Value to search for
 * @returns {Array} - All matching records
 */
const search = (filename, field, value) => {
  const data = readFile(filename);
  
  return data.filter(item => {
    // WHY: Safely handle missing fields. Convert undefined/null to empty string
    const fieldValue = item[field] === undefined || item[field] === null ? '' : String(item[field]);
    return fieldValue.toLowerCase().includes(String(value).toLowerCase());
  });
};

/**
 * ============================================
 * FILTER RECORDS - WHY: Advanced filtering with conditions
 * ============================================
 * 
 * HOW:
 * 1. Read all records
 * 2. Apply custom filter function to each record
 * 3. Return records matching condition
 * 
 * CONTROL FLOW:
 *   - readFile() gets all data
 *   - .filter(filterFn) applies custom logic
 * 
 * WHY callback function: Allows flexible filtering logic
 * EXAMPLE: filter('users.json', u => u.isActive === true)
 * 
 * @param {string} filename - Name of the JSON file
 * @param {Function} filterFn - Function that returns true/false
 * @returns {Array} - Records where filterFn returned true
 */
const filter = (filename, filterFn) => {
  const data = readFile(filename);
  return data.filter(filterFn);
};

/**
 * ============================================
 * COUNT RECORDS - WHY: Get total number of records
 * ============================================
 * 
 * HOW: Read all records and return array length
 * CONTROL FLOW: readFile() → Return length
 * 
 * @param {string} filename - Name of the JSON file
 * @returns {number} - Total number of records
 */
const count = (filename) => {
  return readFile(filename).length;
};

// ============================================
// EXPORT ALL FUNCTIONS - WHY: Make available to routes
// ============================================
module.exports = {
  readFile,      // Low-level: Read entire file
  writeFile,     // Low-level: Write entire file
  getAll,        // Get all records
  getById,       // Get one record by ID
  create,        // Create new record
  update,        // Update entire record
  deleteRecord,  // Delete record
  search,        // Search by field value
  filter,        // Filter by condition
  count          // Get total count
};
