const express = require('express');
const router = express.Router();

const movieAdminController = require('../../controllers/admin/movieAdminController');
const { protect, requireAdmin } = require('../../middleware/auth');

// ⚠️ CHÚ Ý: ĐANG TẠM TẮT BẢO MẬT ĐỂ TUẤN ANH TEST POSTMAN.
// TRƯỚC KHI PUSH CODE CHO TEAM, HÃY XÓA DẤU // Ở DÒNG DƯỚI NHÉ:
// router.use(protect, requireAdmin);

router.get('/', movieAdminController.getAllMovies);           // R: Lấy danh sách
router.post('/', movieAdminController.createMovie);           // C: Thêm phim
router.put('/:id', movieAdminController.updateMovie);         // U: Sửa phim / Thêm tập
router.delete('/:id', movieAdminController.deleteMovie);      // D: Xóa phim

module.exports = router;