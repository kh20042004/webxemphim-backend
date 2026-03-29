// ==================== FAVORITES ROUTES ====================
//
// Mô tả: Các API endpoint quản lý danh sách phim yêu thích của user
// Sử dụng: app.use('/api/favorites', require('./routes/favoritesRoutes'));
//
// Danh sách endpoints:
//   GET    /api/favorites              → Lấy danh sách phim yêu thích
//   POST   /api/favorites/:movieId     → Thêm phim vào yêu thích
//   DELETE /api/favorites/:movieId     → Xóa phim khỏi yêu thích
//   GET    /api/favorites/check/:movieId → Kiểm tra phim có trong yêu thích không
//

const express = require('express');
const router = express.Router();

const favoritesController = require('../controllers/favoritesController');

// Middleware kiểm tra JWT token - tất cả route favorites đều yêu cầu đăng nhập
const { protect } = require('../middleware/auth');

// ==================== ÁP DỤNG BẢO MẬT CHO TOÀN BỘ ROUTE ====================
// Tất cả các route bên dưới đều cần đăng nhập (phải có JWT token hợp lệ)
router.use(protect);

// ==================== CÁC ROUTES ====================

/**
 * GET /api/favorites
 * Lấy toàn bộ danh sách phim yêu thích của user
 * Response: { success, count, data: [movies] }
 */
router.get('/', favoritesController.getFavorites);

/**
 * GET /api/favorites/check/:movieId
 * Kiểm tra phim cụ thể có trong danh sách yêu thích không
 * Dùng cho frontend để hiển thị nút tim (❤️ đã thích / 🤍 chưa thích)
 * QUAN TRỌNG: Route này phải đặt TRƯỚC /:movieId để không bị nhầm sang removeFavorite
 * Response: { success, data: { isFavorite: true/false } }
 */
router.get('/check/:movieId', favoritesController.checkFavorite);

/**
 * POST /api/favorites/toggle/:movieId
 * Toggle yêu thích: tự động thêm nếu chưa có, xóa nếu đã có
 * Dùng cho nút tim ❤️ trên frontend (1 click xử lý cả 2 chiều)
 * QUAN TRỌNG: Phải đặt TRƯỚC /:movieId để không bị nhầm sang addFavorite
 * Response: { success, message, data: { isFavorite, favoriteCount } }
 */
router.post('/toggle/:movieId', favoritesController.toggleFavorite);

/**
 * POST /api/favorites/:movieId
 * Thêm phim vào danh sách yêu thích
 * Params: movieId - ID của phim cần thêm
 * Response: { success, message, data: { favoriteCount } }
 */
router.post('/:movieId', favoritesController.addFavorite);

/**
 * DELETE /api/favorites/:movieId
 * Xóa phim khỏi danh sách yêu thích
 * Params: movieId - ID của phim cần xóa
 * Response: { success, message, data: { favoriteCount } }
 */
router.delete('/:movieId', favoritesController.removeFavorite);

// ==================== EXPORT ROUTER ====================
module.exports = router;
