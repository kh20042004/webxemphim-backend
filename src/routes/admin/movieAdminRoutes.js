// ==================== ADMIN MOVIE ROUTES ====================
//
// Mô tả: Các route quản lý phim dành riêng cho Admin
// Tất cả routes đều yêu cầu đăng nhập và có role 'admin'
// Sử dụng: app.use('/api/admin/movies', require('./routes/admin/movieAdminRoutes'));
//

const express = require('express');
const router = express.Router();

const movieAdminController = require('../../controllers/admin/movieAdminController');

// Import middleware bảo mật: protect kiểm tra JWT, requireAdmin kiểm tra role admin
const { protect, requireAdmin } = require('../../middleware/auth');

// Import middleware invalidate cache để xóa cache sau khi thay đổi dữ liệu phim
const { invalidateCache } = require('../../middleware/cache');

// ==================== BẢO MẬT: ÁP DỤNG CHO TOÀN BỘ ROUTE ====================
// Tất cả các route bên dưới đều phải:
// 1. Đăng nhập hợp lệ (protect - kiểm tra JWT token)
// 2. Có quyền admin (requireAdmin - kiểm tra role === 'admin')
router.use(protect, requireAdmin);

// ==================== ROUTES CRUD PHIM ====================

// [READ] Lấy danh sách tất cả phim (chỉ admin, không cache - cần dữ liệu mới nhất)
router.get('/', movieAdminController.getAllMovies);

// [CREATE] Thêm phim mới → sau khi tạo xong, xóa cache danh sách phim public
router.post(
  '/',
  movieAdminController.createMovie,
  invalidateCache(['movies:*']) // Xóa cache danh sách phim để user thấy phim mới
);

// [UPDATE] Sửa phim / Thêm tập phim → xóa cache phim đó + danh sách
router.put(
  '/:id',
  movieAdminController.updateMovie,
  invalidateCache((req) => [
    'movies:*',                     // Xóa cache danh sách phim
    `movie:${req.params.id}:*`,     // Xóa cache chi tiết phim này
  ])
);

// [DELETE] Xóa phim → xóa cache phim đó + danh sách
router.delete(
  '/:id',
  movieAdminController.deleteMovie,
  invalidateCache((req) => [
    'movies:*',                     // Xóa cache danh sách phim
    `movie:${req.params.id}:*`,     // Xóa cache chi tiết phim này
  ])
);

module.exports = router;