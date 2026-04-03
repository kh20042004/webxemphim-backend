// ==================== SPORTS ROUTES ====================
//
// Mô tả: Định nghĩa các API routes cho Sports module
// Sử dụng: app.use('/api/sports', require('./routes/sportsRoutes'));
//

const express = require('express');
const sportsController = require('../controllers/sportsController');
const { protect, authorize } = require('../middleware/auth');

// ==================== TẠO ROUTER ====================
const router = express.Router();

// ==================== PUBLIC ROUTES ====================

// ============ LEAGUES ============

/**
 * GET /api/sports/leagues
 * Lấy danh sách tất cả giải đấu
 */
router.get('/leagues', sportsController.getLeagues);

/**
 * GET /api/sports/leagues/:id
 * Lấy chi tiết 1 giải đấu
 */
router.get('/leagues/:id', sportsController.getLeagueById);

// ============ MATCHES ============

/**
 * GET /api/sports/matches
 * Lấy danh sách trận đấu
 */
router.get('/matches', sportsController.getMatches);

/**
 * GET /api/sports/matches/upcoming
 * Lấy trận đấu sắp tới
 */
router.get('/matches/upcoming', sportsController.getUpcomingMatches);

/**
 * GET /api/sports/matches/live
 * Lấy trận đấu đang trực tiếp
 */
router.get('/matches/live', sportsController.getLiveMatches);

/**
 * GET /api/sports/matches/:id
 * Lấy chi tiết trận đấu
 */
router.get('/matches/:id', sportsController.getMatchById);

// ============ EVENTS ============

/**
 * GET /api/sports/events
 * Lấy danh sách sự kiện
 */
router.get('/events', sportsController.getEvents);

/**
 * GET /api/sports/events/live
 * Lấy sự kiện đang trực tiếp
 */
router.get('/events/live', sportsController.getLiveEvents);

/**
 * GET /api/sports/events/:id
 * Lấy chi tiết sự kiện
 */
router.get('/events/:id', sportsController.getEventById);

// ============ HIGHLIGHTS ============

/**
 * GET /api/sports/highlights
 * Lấy danh sách video highlight
 */
router.get('/highlights', sportsController.getHighlights);

/**
 * GET /api/sports/highlights/trending
 * Lấy video nổi bật nhất
 */
router.get('/highlights/trending', sportsController.getTrendingHighlights);

/**
 * GET /api/sports/highlights/:id
 * Lấy chi tiết video highlight
 */
router.get('/highlights/:id', sportsController.getHighlightById);

// ==================== PROTECTED ROUTES (Cần đăng nhập) ====================

/**
 * POST /api/sports/highlights/:id/like
 * Like video highlight
 */
router.post('/highlights/:id/like', protect, sportsController.likeHighlight);

/**
 * POST /api/sports/highlights/:id/unlike
 * Unlike video highlight
 */
router.post('/highlights/:id/unlike', protect, sportsController.unlikeHighlight);

// ==================== ADMIN ROUTES (Chỉ Admin) ====================

// ============ LEAGUE ADMIN ============

/**
 * POST /api/sports/admin/leagues
 * Tạo giải đấu mới
 */
router.post('/admin/leagues', protect, authorize('admin'), sportsController.createLeague);

/**
 * PUT /api/sports/admin/leagues/:id
 * Cập nhật giải đấu
 */
router.put('/admin/leagues/:id', protect, authorize('admin'), sportsController.updateLeague);

/**
 * DELETE /api/sports/admin/leagues/:id
 * Xóa giải đấu
 */
router.delete('/admin/leagues/:id', protect, authorize('admin'), sportsController.deleteLeague);

// ============ MATCH ADMIN ============

/**
 * POST /api/sports/admin/matches
 * Tạo trận đấu mới
 */
router.post('/admin/matches', protect, authorize('admin'), sportsController.createMatch);

/**
 * PUT /api/sports/admin/matches/:id/score
 * Cập nhật tỉ số trận đấu
 */
router.put('/admin/matches/:id/score', protect, authorize('admin'), sportsController.updateMatchScore);

/**
 * DELETE /api/sports/admin/matches/:id
 * Xóa trận đấu
 */
router.delete('/admin/matches/:id', protect, authorize('admin'), sportsController.deleteMatch);

// ============ EVENT ADMIN ============

/**
 * POST /api/sports/admin/events
 * Tạo sự kiện
 */
router.post('/admin/events', protect, authorize('admin'), sportsController.createEvent);

/**
 * DELETE /api/sports/admin/events/:id
 * Xóa sự kiện
 */
router.delete('/admin/events/:id', protect, authorize('admin'), sportsController.deleteEvent);

// ============ HIGHLIGHT ADMIN ============

/**
 * POST /api/sports/admin/highlights
 * Tạo highlight
 */
router.post('/admin/highlights', protect, authorize('admin'), sportsController.createHighlight);

/**
 * DELETE /api/sports/admin/highlights/:id
 * Xóa highlight
 */
router.delete('/admin/highlights/:id', protect, authorize('admin'), sportsController.deleteHighlight);

// ==================== EXPORT ROUTER ====================
module.exports = router;
