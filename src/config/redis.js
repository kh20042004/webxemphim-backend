// ========================================
// REDIS CONFIGURATION - TUỲ CHỌN (OPTIONAL)
// ========================================
// File: src/config/redis.js
// Mục đích: Kết nối Redis để cache dữ liệu, giảm tải MongoDB
//
// ⚡ HOẠT ĐỘNG TUỲ CHỌN:
//   - Nếu có REDIS_URL trong .env → Kết nối và dùng cache
//   - Nếu KHÔNG có REDIS_URL       → Bỏ qua, app vẫn chạy bình thường
//
// Cách bật Redis:
//   1. Thêm vào .env: REDIS_URL=redis://localhost:6379
//   2. Cài Redis trên máy (xem hướng dẫn bên dưới)
//      - Windows: https://github.com/microsoftarchive/redis/releases
//      - Hoặc dùng Redis Cloud miễn phí: https://redis.io/try-free/
//

const { REDIS_URL, REDIS_PASSWORD, NODE_ENV } = require('./environment');

// ============================================================
// KIỂM TRA XEM CÓ CẤU HÌNH REDIS KHÔNG
// ============================================================
// Chỉ cố kết nối Redis khi REDIS_URL được cung cấp trong .env
// Tránh spam lỗi khi chưa cài Redis trên máy
const REDIS_ENABLED = !!REDIS_URL;

// ============================================================
// NẾU KHÔNG CÓ REDIS_URL → TẠO MODULE GIẢ (NO-OP)
// ============================================================
// Tất cả hàm trả về null/false/0 an toàn - app vẫn chạy bình thường
// Chỉ mất tính năng cache, không mất tính năng khác
if (!REDIS_ENABLED) {
  // Chỉ log 1 lần khi server khởi động, không spam lỗi liên tục
  console.log('⚠️  Redis: Chưa cấu hình (REDIS_URL chưa có trong .env)');
  console.log('💡  Redis: App vẫn chạy bình thường, chỉ không có cache.');
  console.log('💡  Để bật cache: thêm REDIS_URL=redis://localhost:6379 vào .env\n');

  // Export các hàm giả - luôn trả về giá trị mặc định an toàn
  module.exports = {
    redisClient: null,
    getCache: async () => null,         // Luôn cache miss → query DB bình thường
    setCache: async () => false,        // Không lưu cache → không ảnh hưởng logic
    deleteCache: async () => false,     // Không xóa gì → an toàn
    deletePattern: async () => 0,       // Không xóa gì → an toàn
    flushAll: async () => false,        // Không làm gì → an toàn
    isRedisAlive: async () => false,    // Báo Redis không hoạt động → cache middleware tự bỏ qua
    closeRedis: async () => {},         // Không có gì để đóng
  };

} else {
// ============================================================
// CÓ REDIS_URL → KẾT NỐI REDIS THỰC SỰ (toàn bộ code bên dưới)
// ============================================================

const Redis = require('ioredis');

/**
 * Tạo kết nối Redis với cấu hình tùy chỉnh
 * - Development: Kết nối theo REDIS_URL (localhost:6379 hoặc cloud)
 * - Production:  Kết nối theo REDIS_URL từ .env (cloud Redis)
 */
const redisClient = new Redis(REDIS_URL, {
  password: REDIS_PASSWORD || undefined,

  // ============ Cấu hình retry khi mất kết nối ============
  retryStrategy(times) {
    // Thử kết nối lại tối đa 5 lần (ít hơn trước để không spam log)
    if (times > 5) {
      console.error('❌ Redis: Không thể kết nối sau 5 lần thử. Tắt Redis cache.');
      console.log('💡 Kiểm tra Redis có đang chạy không: redis-cli ping');
      return null; // Dừng retry hoàn toàn
    }
    // Delay tăng dần: 500ms, 1000ms, 1500ms, 2000ms, 2500ms
    const delay = Math.min(times * 500, 3000);
    console.log(`🔄 Redis: Thử kết nối lại lần ${times}/${5} sau ${delay}ms...`);
    return delay;
  },

  // Timeout kết nối (5 giây - đủ để thử, không mất quá nhiều thời gian)
  connectTimeout: 5000,
  commandTimeout: 3000,

  // Chỉ thử lại lệnh bị lỗi 1 lần (không retry nhiều)
  maxRetriesPerRequest: 1,

  // Không hiển thị stack trace dài dòng
  showFriendlyErrorStack: false,
  
  // Không bật lazyConnect - kết nối ngay khi khởi động để phát hiện lỗi sớm
  lazyConnect: false,
});

// ============================================================
// EVENT HANDLERS - Xử lý các sự kiện của Redis
// ============================================================

// Kết nối thành công và sẵn sàng dùng
redisClient.on('ready', () => {
  console.log(`✅ Redis: Kết nối thành công → ${REDIS_URL}`);
});

// Lỗi kết nối - chỉ log lần đầu, không spam
let redisErrorLogged = false;
redisClient.on('error', (err) => {
  if (!redisErrorLogged) {
    // Ẩn message dài dòng, chỉ hiển thị nguyên nhân cốt lõi
    const shortMsg = err.code === 'ECONNREFUSED'
      ? 'Không thể kết nối - Redis chưa chạy trên máy'
      : err.message;
    console.error(`❌ Redis Error: ${shortMsg}`);
    redisErrorLogged = true; // Chỉ log 1 lần, không spam
  }
});

// Reset flag khi reconnect thành công - để log lỗi nếu mất kết nối lần sau
redisClient.on('ready', () => {
  redisErrorLogged = false;
});

// ============================================================
// HELPER FUNCTIONS - Các hàm tiện ích cho cache
// ============================================================

/**
 * Lấy dữ liệu từ cache Redis
 * @param {string} key - Key của cache
 * @returns {Promise<any|null>} - Dữ liệu đã parse hoặc null nếu không có
 */
async function getCache(key) {
  try {
    const data = await redisClient.get(key);
    if (!data) return null;

    // Parse JSON nếu có thể, trả về string gốc nếu không
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  } catch (error) {
    // Không log lỗi để tránh spam - chỉ trả về null
    return null;
  }
}

/**
 * Lưu dữ liệu vào cache Redis
 * @param {string} key   - Key của cache
 * @param {any}    value - Giá trị cần cache (object sẽ được stringify tự động)
 * @param {number} ttl   - Thời gian sống (giây), mặc định 300s = 5 phút
 * @returns {Promise<boolean>} - True nếu lưu thành công
 */
async function setCache(key, value, ttl = 300) {
  try {
    // Stringify object/array sang JSON trước khi lưu
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    
    // SETEX = SET + EXPIRE: lưu kèm thời gian hết hạn
    await redisClient.setex(key, ttl, stringValue);
    return true;
  } catch (error) {
    return false; // Không log - cache lỗi không ảnh hưởng chức năng chính
  }
}

/**
 * Xóa cache theo key cụ thể
 * @param {string} key - Key cần xóa
 * @returns {Promise<boolean>} - True nếu xóa thành công
 */
async function deleteCache(key) {
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Xóa nhiều cache theo pattern (wildcard)
 * VD: deletePattern('movies:*') → xóa tất cả key bắt đầu bằng 'movies:'
 * @param {string} pattern - Pattern dạng glob (VD: 'movies:*', 'movie:123:*')
 * @returns {Promise<number>} - Số lượng keys đã xóa
 */
async function deletePattern(pattern) {
  try {
    // KEYS command - tìm tất cả key khớp pattern
    const keys = await redisClient.keys(pattern);
    if (keys.length === 0) return 0;

    // DEL nhiều key cùng lúc
    await redisClient.del(...keys);
    console.log(`🗑️  Redis: Đã xóa ${keys.length} cache key (pattern: "${pattern}")`);
    return keys.length;
  } catch (error) {
    return 0;
  }
}

/**
 * Xóa toàn bộ cache database
 * ⚠️ NGUY HIỂM: Chỉ dùng khi cần reset hoàn toàn
 * @returns {Promise<boolean>}
 */
async function flushAll() {
  try {
    await redisClient.flushall();
    console.log('🗑️  Redis: Đã xóa toàn bộ cache');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Kiểm tra Redis có đang hoạt động không
 * Dùng trong middleware để quyết định có dùng cache không
 * @returns {Promise<boolean>} - True nếu Redis đang sống và phản hồi được
 */
async function isRedisAlive() {
  try {
    const pong = await redisClient.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}

/**
 * Đóng kết nối Redis an toàn (gọi khi server tắt)
 */
async function closeRedis() {
  try {
    await redisClient.quit();
    console.log('👋 Redis: Đã đóng kết nối');
  } catch (error) {
    // Bỏ qua lỗi khi đóng
  }
}

// ============================================================
// GRACEFUL SHUTDOWN - Đóng Redis khi server tắt
// ============================================================
process.on('SIGINT', async () => {
  await closeRedis();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeRedis();
  process.exit(0);
});

// ============================================================
// EXPORTS
// ============================================================
module.exports = {
  redisClient,     // Raw Redis client (cho những lệnh nâng cao)
  getCache,        // Lấy cache theo key
  setCache,        // Lưu cache với TTL
  deleteCache,     // Xóa 1 cache key
  deletePattern,   // Xóa nhiều cache theo pattern
  flushAll,        // Xóa toàn bộ cache
  isRedisAlive,    // Kiểm tra Redis có sống không
  closeRedis,      // Đóng kết nối
};

} // Đóng else block (có Redis thì mới load đến đây)
