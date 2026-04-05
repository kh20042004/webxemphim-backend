// ========================================
// PAGINATION HELPER
// ========================================
// File: src/utils/paginationHelper.js
// Mục đích: Hàm tiện ích cho phân trang
// Sử dụng: Áp dụng cho tất cả list endpoints

const { PAGINATION } = require('../config/constants');

/**
 * ============================================================
 * TÍNH TOÁN PAGINATION PARAMETERS
 * ============================================================
 * Hàm tính toán các tham số phân trang từ query params
 * @param {Object} query - Query params từ request (req.query)
 * @param {number} query.page - Trang hiện tại (mặc định: 1)
 * @param {number} query.limit - Số items mỗi trang (mặc định: 10, max: 100)
 * @returns {Object} Các tham số để dùng trong Mongoose query
 */
function getPaginationParams(query = {}) {
  // Parse page number (trang hiện tại)
  const page = Math.max(1, parseInt(query.page) || PAGINATION.DEFAULT_PAGE);
  
  // Parse limit (số items mỗi trang)
  let limit = parseInt(query.limit) || PAGINATION.DEFAULT_LIMIT;
  
  // Giới hạn limit tối đa để tránh query quá lớn
  limit = Math.min(limit, PAGINATION.MAX_LIMIT);
  
  // Tính skip (bỏ qua bao nhiêu items)
  // VD: page=3, limit=10 → skip=20 (bỏ qua 20 items đầu)
  const skip = (page - 1) * limit;
  
  return {
    page,
    limit,
    skip,
  };
}

/**
 * ============================================================
 * TẠO PAGINATION METADATA
 * ============================================================
 * Hàm tạo thông tin metadata cho response
 * @param {number} total - Tổng số items trong DB
 * @param {number} page - Trang hiện tại
 * @param {number} limit - Số items mỗi trang
 * @returns {Object} Metadata cho response
 */
function createPaginationMeta(total, page, limit) {
  // Tính tổng số trang
  const totalPages = Math.ceil(total / limit) || 1;
  
  // Kiểm tra có trang tiếp theo không
  const hasNext = page < totalPages;
  
  // Kiểm tra có trang trước không
  const hasPrev = page > 1;
  
  return {
    page,           // Trang hiện tại
    limit,          // Số items mỗi trang
    total,          // Tổng số items
    totalPages,     // Tổng số trang
    hasNext,        // Có trang tiếp theo không
    hasPrev,        // Có trang trước không
  };
}

/**
 * ============================================================
 * PAGINATION RESPONSE BUILDER
 * ============================================================
 * Hàm xây dựng response hoàn chỉnh với pagination
 * @param {Array} data - Dữ liệu đã query
 * @param {number} total - Tổng số items trong DB
 * @param {number} page - Trang hiện tại
 * @param {number} limit - Số items mỗi trang
 * @returns {Object} Response object với data và pagination
 */
function buildPaginatedResponse(data, total, page, limit) {
  const pagination = createPaginationMeta(total, page, limit);
  
  return {
    success: true,
    data,
    pagination,
  };
}

/**
 * ============================================================
 * MONGOOSE PAGINATION QUERY
 * ============================================================
 * Hàm thực hiện query với pagination cho Mongoose
 * @param {Object} Model - Mongoose Model
 * @param {Object} filter - Filter conditions
 * @param {Object} options - Query options
 * @param {number} options.page - Trang hiện tại
 * @param {number} options.limit - Số items mỗi trang
 * @param {string} options.sort - Sắp xếp (VD: '-createdAt' = mới nhất trước)
 * @param {string} options.select - Chọn fields (VD: 'title poster')
 * @param {string} options.populate - Populate relationships
 * @returns {Promise<Object>} Response với data và pagination
 * 
 * CÁCH DÙNG:
 * const result = await paginateQuery(Movie, { type: 'Phim lẻ' }, {
 *   page: 1,
 *   limit: 10,
 *   sort: '-createdAt',
 *   populate: 'user'
 * });
 */
async function paginateQuery(Model, filter = {}, options = {}) {
  try {
    // Lấy pagination params
    const { page, limit, skip } = getPaginationParams(options);
    
    // Tạo query builder
    let query = Model.find(filter);
    
    // Áp dụng sort nếu có
    if (options.sort) {
      query = query.sort(options.sort);
    }
    
    // Áp dụng select nếu có
    if (options.select) {
      query = query.select(options.select);
    }
    
    // Áp dụng populate nếu có
    if (options.populate) {
      // Nếu là string, populate đơn
      if (typeof options.populate === 'string') {
        query = query.populate(options.populate);
      }
      // Nếu là array, populate nhiều fields
      else if (Array.isArray(options.populate)) {
        options.populate.forEach(pop => {
          query = query.populate(pop);
        });
      }
      // Nếu là object, populate với options
      else {
        query = query.populate(options.populate);
      }
    }
    
    // Thực hiện query với skip và limit
    const data = await query.skip(skip).limit(limit);
    
    // Đếm tổng số documents (không skip, không limit)
    const total = await Model.countDocuments(filter);
    
    // Trả về response đã format
    return buildPaginatedResponse(data, total, page, limit);
    
  } catch (error) {
    console.error('❌ Pagination Query Error:', error.message);
    throw error;
  }
}

/**
 * ============================================================
 * PARSE SORT STRING
 * ============================================================
 * Hàm parse sort string từ query param
 * VD: 'title,-createdAt' → { title: 1, createdAt: -1 }
 * @param {string} sortString - Sort string từ query
 * @returns {Object} Sort object cho Mongoose
 */
function parseSortString(sortString) {
  if (!sortString) return { createdAt: -1 }; // Mặc định: mới nhất trước
  
  const sortObj = {};
  const fields = sortString.split(',');
  
  fields.forEach(field => {
    field = field.trim();
    if (field.startsWith('-')) {
      // Dấu - nghĩa là descending (giảm dần)
      sortObj[field.substring(1)] = -1;
    } else {
      // Không có dấu - nghĩa là ascending (tăng dần)
      sortObj[field] = 1;
    }
  });
  
  return sortObj;
}

/**
 * ============================================================
 * VALIDATE PAGINATION PARAMS
 * ============================================================
 * Hàm validate pagination parameters từ query
 * @param {Object} query - Query params từ request
 * @returns {Object} { valid: boolean, errors: array }
 */
function validatePaginationParams(query = {}) {
  const errors = [];
  
  // Validate page
  if (query.page) {
    const page = parseInt(query.page);
    if (isNaN(page) || page < 1) {
      errors.push('Page phải là số nguyên dương (>= 1)');
    }
  }
  
  // Validate limit
  if (query.limit) {
    const limit = parseInt(query.limit);
    if (isNaN(limit) || limit < 1) {
      errors.push('Limit phải là số nguyên dương (>= 1)');
    }
    if (limit > PAGINATION.MAX_LIMIT) {
      errors.push(`Limit không được vượt quá ${PAGINATION.MAX_LIMIT}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * ============================================================
 * CACHE KEY GENERATOR
 * ============================================================
 * Tạo cache key cho paginated data
 * @param {string} prefix - Prefix cho key (VD: 'movies')
 * @param {Object} params - Pagination params và filters
 * @returns {string} Cache key
 * 
 * VD: generateCacheKey('movies', { page: 1, limit: 10, type: 'Phim lẻ' })
 * → 'movies:page:1:limit:10:type:Phim lẻ'
 */
function generateCacheKey(prefix, params = {}) {
  // Sort params để đảm bảo key consistency
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join(':');
  
  return sortedParams ? `${prefix}:${sortedParams}` : prefix;
}

// ============================================================
// EXPORTS
// ============================================================
module.exports = {
  getPaginationParams,      // Lấy page, limit, skip từ query
  createPaginationMeta,     // Tạo metadata cho response
  buildPaginatedResponse,   // Build response hoàn chỉnh
  paginateQuery,            // Query với pagination (all-in-one)
  parseSortString,          // Parse sort string
  validatePaginationParams, // Validate pagination params
  generateCacheKey,         // Tạo cache key
};
