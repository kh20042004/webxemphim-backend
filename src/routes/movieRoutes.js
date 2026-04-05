// ==================== MOVIE ROUTES (PUBLIC) ====================
//
// Mô tả: Các route xem phim dành cho tất cả người dùng (không cần đăng nhập)
// Sử dụng: app.use('/api/movies', require('./routes/movieRoutes'));
//
// ⚠️  THỨ TỰ ROUTE RẤT QUAN TRỌNG:
//     Route cụ thể (/trending, /new) phải đặt TRƯỚC route động (/:id)
//     Nếu không, Express sẽ hiểu 'trending' là một movieId → 404
//

const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');

// Import cache middleware để tối ưu tốc độ truy vấn
// Khi user xem danh sách/chi tiết phim, kết quả sẽ được lưu Redis tạm thời
// Giảm tải cho MongoDB khi có nhiều request cùng lúc
const { cacheMiddleware } = require('../middleware/cache');

// ==================== ROUTES ====================

// ------------------------------------------------------------------
// GET /api/movies/trending
// Lấy top phim xem nhiều nhất (sắp xếp theo lượt views giảm dần)
// Cache 5 phút (300s) — dữ liệu trending thay đổi không quá thường xuyên
// Dùng cho: Banner, Slider trang chủ, Section "Phim Hot"
// ⚠️  PHẢI đặt TRƯỚC /:id — nếu không Express nhầm 'trending' là ID
// ------------------------------------------------------------------
router.get(
  '/trending',
  cacheMiddleware({ ttl: 300, keyPrefix: 'movies_trending' }),
  movieController.getTrending
);

// ------------------------------------------------------------------
// GET /api/movies/new
// Lấy phim mới nhất (sắp xếp theo createdAt giảm dần)
// Cache 5 phút (300s) — phim mới thêm mỗi vài giờ, cache 5 phút là đủ
// Dùng cho: Section "Phim Mới Ra Mắt" trên trang chủ
// ⚠️  PHẢI đặt TRƯỚC /:id
// ------------------------------------------------------------------
router.get(
  '/new',
  cacheMiddleware({ ttl: 300, keyPrefix: 'movies_new' }),
  movieController.getNewMovies
);

// ------------------------------------------------------------------
// GET /api/movies
// Lấy danh sách tất cả phim (có pagination, search, filter)
// Cache 10 phút (600s) — danh sách phim thay đổi ít, cache lâu hơn
// Query params: ?type= &category= &year= &page= &limit= &search= &sort=
// ------------------------------------------------------------------
router.get(
  '/',
  cacheMiddleware({ ttl: 600, keyPrefix: 'movies' }),
  movieController.getAllMovies
);

// ------------------------------------------------------------------
// GET /api/movies/:id
// Lấy chi tiết một bộ phim theo MongoDB ObjectId
// Cache 5 phút (300s) — chi tiết phim ít thay đổi, giảm tải DB
// ⚠️  Phải đặt SAU các route tĩnh (/trending, /new) để tránh xung đột
// ------------------------------------------------------------------
router.get(
  '/:id',
  cacheMiddleware({ ttl: 300, keyPrefix: 'movie' }),
  movieController.getMovieById
);

module.exports = router;
