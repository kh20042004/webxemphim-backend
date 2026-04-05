// ========================================
// CACHE MIDDLEWARE
// ========================================
// File: src/middleware/cache.js
// Mục đích: Middleware để cache response từ Redis
// Sử dụng: Giảm tải database bằng cách cache kết quả query

const { getCache, setCache, deleteCache, deletePattern, isRedisAlive } = require('../config/redis');

/**
 * ============================================================
 * CACHE MIDDLEWARE - Kiểm tra cache trước khi query DB
 * ============================================================
 * Middleware tự động cache response
 * Workflow:
 * 1. Check Redis có hoạt động không → Nếu không, skip cache
 * 2. Tạo cache key từ route + query params
 * 3. Tìm trong cache → Nếu có, return ngay
 * 4. Nếu không có, tiếp tục controller
 * 5. Controller gọi res.sendCached() để lưu cache
 * 
 * @param {Object} options - Cấu hình cache
 * @param {number} options.ttl - Time to live (giây), mặc định 300s = 5 phút
 * @param {string} options.keyPrefix - Prefix cho cache key
 * @param {Function} options.keyGenerator - Hàm custom tạo cache key
 * @returns {Function} Express middleware
 * 
 * CÁCH DÙNG:
 * router.get('/movies', cacheMiddleware({ ttl: 600, keyPrefix: 'movies' }), controller);
 */
function cacheMiddleware(options = {}) {
  const {
    ttl = 300,                    // Mặc định cache 5 phút
    keyPrefix = 'cache',          // Prefix mặc định
    keyGenerator = null,          // Custom key generator
  } = options;
  
  return async (req, res, next) => {
    try {
      // Bước 1: Kiểm tra Redis có hoạt động không
      const redisUp = await isRedisAlive();
      if (!redisUp) {
        // Redis không hoạt động - skip cache một cách im lặng
        // Không log warning nữa để tránh spam console
        return next();
      }
      
      // Bước 2: Tạo cache key
      let cacheKey;
      
      if (keyGenerator && typeof keyGenerator === 'function') {
        // Dùng custom key generator nếu có
        cacheKey = keyGenerator(req);
      } else {
        // Tạo key từ route + query params
        const queryString = JSON.stringify(req.query);
        const paramsString = JSON.stringify(req.params);
        cacheKey = `${keyPrefix}:${req.originalUrl}:${queryString}:${paramsString}`;
      }
      
      // Lưu cache key vào request để controller có thể dùng
      req.cacheKey = cacheKey;
      req.cacheTTL = ttl;
      
      // Bước 3: Tìm trong cache
      const cachedData = await getCache(cacheKey);
      
      if (cachedData) {
        // HIT: Có cache, return ngay
        console.log(`✅ Cache HIT: ${cacheKey}`);
        return res.status(200).json(cachedData);
      }
      
      // MISS: Không có cache, tiếp tục controller
      console.log(`❌ Cache MISS: ${cacheKey}`);
      
      // Bước 4: Override res.json để tự động cache response
      const originalJson = res.json.bind(res);
      
      res.json = function(data) {
        // Chỉ cache nếu response thành công (status 2xx)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          setCache(cacheKey, data, ttl)
            .then(() => console.log(`💾 Cached: ${cacheKey} (TTL: ${ttl}s)`))
            .catch(err => console.error(`❌ Cache set error:`, err.message));
        }
        
        // Gọi res.json() gốc
        return originalJson(data);
      };
      
      next();
      
    } catch (error) {
      // Nếu có lỗi với Redis, vẫn tiếp tục request bình thường
      console.error('❌ Cache middleware error:', error.message);
      next();
    }
  };
}

/**
 * ============================================================
 * CONDITIONAL CACHE - Cache dựa trên điều kiện
 * ============================================================
 * Cache chỉ khi thỏa mãn điều kiện
 * @param {Function} condition - Hàm kiểm tra điều kiện (req) => boolean
 * @param {Object} cacheOptions - Options cho cache
 * @returns {Function} Express middleware
 * 
 * CÁCH DÙNG:
 * // Chỉ cache khi user không login
 * router.get('/movies', conditionalCache(
 *   (req) => !req.user,
 *   { ttl: 600, keyPrefix: 'public-movies' }
 * ), controller);
 */
function conditionalCache(condition, cacheOptions = {}) {
  return async (req, res, next) => {
    // Kiểm tra điều kiện
    if (!condition(req)) {
      // Không thỏa điều kiện, skip cache
      return next();
    }
    
    // Thỏa điều kiện, áp dụng cache
    return cacheMiddleware(cacheOptions)(req, res, next);
  };
}

/**
 * ============================================================
 * CLEAR CACHE HELPER - Xóa cache cho route/pattern
 * ============================================================
 * Helper function để xóa cache từ controller
 * @param {string|Array} patterns - Pattern hoặc array of patterns
 * @returns {Promise<number>} Số lượng keys đã xóa
 * 
 * CÁCH DÙNG:
 * // Trong controller khi update movie
 * await clearCache(['movies:*', `movie:${movieId}:*`]);
 */
async function clearCache(patterns) {
  try {
    const redisUp = await isRedisAlive();
    if (!redisUp) {
      console.warn('⚠️ Redis không hoạt động, không thể clear cache');
      return 0;
    }
    
    // Nếu patterns là string, convert thành array
    const patternArray = Array.isArray(patterns) ? patterns : [patterns];
    
    let totalDeleted = 0;
    for (const pattern of patternArray) {
      const deleted = await deletePattern(pattern);
      totalDeleted += deleted;
    }
    
    console.log(`🗑️ Đã xóa ${totalDeleted} cache keys`);
    return totalDeleted;
    
  } catch (error) {
    console.error('❌ Clear cache error:', error.message);
    return 0;
  }
}

/**
 * ============================================================
 * CACHE INVALIDATION MIDDLEWARE
 * ============================================================
 * Middleware tự động xóa cache sau khi update/delete
 * Dùng sau các endpoint POST/PUT/DELETE
 * @param {string|Array|Function} patterns - Patterns cần xóa
 * @returns {Function} Express middleware
 * 
 * CÁCH DÙNG:
 * router.post('/movies', protect, requireAdmin, 
 *   controller, 
 *   invalidateCache(['movies:*'])
 * );
 * 
 * // Hoặc dynamic pattern
 * router.delete('/movies/:id', protect, requireAdmin,
 *   controller,
 *   invalidateCache((req) => [`movies:*`, `movie:${req.params.id}:*`])
 * );
 */
function invalidateCache(patterns) {
  return async (req, res, next) => {
    try {
      // Chờ response gửi xong
      res.on('finish', async () => {
        // Chỉ invalidate nếu response thành công
        if (res.statusCode >= 200 && res.statusCode < 300) {
          
          // Nếu patterns là function, gọi với req
          const patternsToDelete = typeof patterns === 'function' 
            ? patterns(req) 
            : patterns;
          
          await clearCache(patternsToDelete);
        }
      });
      
      next();
      
    } catch (error) {
      console.error('❌ Cache invalidation error:', error.message);
      next();
    }
  };
}

/**
 * ============================================================
 * NO CACHE MIDDLEWARE
 * ============================================================
 * Middleware để disable cache cho route cụ thể
 * @returns {Function} Express middleware
 */
function noCache() {
  return (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  };
}

/**
 * ============================================================
 * CACHE WITH TAGS
 * ============================================================
 * Cache với tags để dễ dàng invalidate theo nhóm
 * VD: Tag 'movies' cho tất cả movie-related cache
 * @param {Object} options - Cache options
 * @param {Array<string>} options.tags - Tags cho cache entry
 * @returns {Function} Express middleware
 */
function cacheWithTags(options = {}) {
  const { tags = [], ...cacheOptions } = options;
  
  return async (req, res, next) => {
    // Lưu tags vào request để dùng sau
    req.cacheTags = tags;
    
    // Áp dụng cache middleware bình thường
    return cacheMiddleware(cacheOptions)(req, res, next);
  };
}

/**
 * ============================================================
 * INVALIDATE BY TAG
 * ============================================================
 * Xóa tất cả cache có tag cụ thể
 * @param {string} tag - Tag cần xóa
 * @returns {Promise<number>} Số cache keys đã xóa
 * 
 * CÁCH DÙNG:
 * await invalidateByTag('movies'); // Xóa tất cả cache liên quan đến movies
 */
async function invalidateByTag(tag) {
  return await clearCache(`*${tag}*`);
}

// ============================================================
// EXPORTS
// ============================================================
module.exports = {
  cacheMiddleware,       // Middleware cache chính
  conditionalCache,      // Cache có điều kiện
  clearCache,            // Helper xóa cache
  invalidateCache,       // Middleware invalidate cache
  noCache,               // Middleware disable cache
  cacheWithTags,         // Cache với tags
  invalidateByTag,       // Xóa cache theo tag
};

/**
 * ============================================================
 * EXAMPLES - Ví dụ sử dụng
 * ============================================================
 * 
 * // 1. Cache đơn giản
 * router.get('/movies', cacheMiddleware({ ttl: 600, keyPrefix: 'movies' }), getAllMovies);
 * 
 * // 2. Cache có điều kiện
 * router.get('/movies', conditionalCache(
 *   (req) => !req.user,  // Chỉ cache cho user chưa login
 *   { ttl: 300 }
 * ), getAllMovies);
 * 
 * // 3. Invalidate cache sau update
 * router.put('/movies/:id', protect, requireAdmin,
 *   updateMovie,
 *   invalidateCache((req) => [`movies:*`, `movie:${req.params.id}:*`])
 * );
 * 
 * // 4. Manual clear cache trong controller
 * exports.createMovie = async (req, res, next) => {
 *   // ... create movie logic
 *   
 *   // Clear cache
 *   await clearCache('movies:*');
 *   
 *   res.status(201).json({ success: true, data: movie });
 * };
 * 
 * // 5. No cache cho sensitive data
 * router.get('/user/profile', protect, noCache(), getProfile);
 * 
 * // 6. Cache với tags
 * router.get('/movies', cacheWithTags({ 
 *   tags: ['movies', 'public'], 
 *   ttl: 600 
 * }), getAllMovies);
 */
