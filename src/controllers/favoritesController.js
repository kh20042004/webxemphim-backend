// ==================== FAVORITES CONTROLLER ====================
//
// Mô tả: Xử lý logic cho các API quản lý danh sách phim yêu thích
// Dữ liệu: Lưu mảng favorties[] trong User model (tham chiếu tới Movie._id)
// Sử dụng: const favoritesController = require('../controllers/favoritesController');
//

const User = require('../models/User');
const Movie = require('../models/Movie');
const { HTTP_STATUS } = require('../config/constants');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// ==================== LẤY DANH SÁCH PHIM YÊU THÍCH ====================

/**
 * GET /api/favorites
 * Mô tả: Lấy toàn bộ danh sách phim yêu thích của user hiện tại
 * Headers: Authorization: Bearer <token>
 * Response: { success, count, data: [movies] }
 * Middleware: protect (yêu cầu đăng nhập)
 */
exports.getFavorites = async (req, res, next) => {
  try {
    // req.user được gán bởi middleware protect
    // Dùng populate() để lấy thông tin đầy đủ của từng phim trong mảng favorites
    const user = await User.findById(req.user._id)
      .populate({
        path: 'favorites', // Trường cần populate (mảng ObjectId tham chiếu Movie)
        select: 'title poster description category year type views', // Chỉ lấy các trường cần thiết
        options: { sort: { createdAt: -1 } }, // Phim mới thêm lên đầu
      });

    if (!user) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'User không tồn tại');
    }

    return sendSuccess(
      res,
      {
        count: user.favorites.length,     // Tổng số phim yêu thích
        data: user.favorites,             // Danh sách phim đầy đủ thông tin
      },
      `Lấy danh sách yêu thích thành công (${user.favorites.length} phim)`
    );
  } catch (error) {
    next(error);
  }
};

// ==================== THÊM PHIM VÀO DANH SÁCH YÊU THÍCH ====================

/**
 * POST /api/favorites/:movieId
 * Mô tả: Thêm phim vào danh sách yêu thích
 * Params: movieId - ID của phim muốn thêm
 * Headers: Authorization: Bearer <token>
 * Response: { success, message, data: { favoriteCount } }
 * Middleware: protect (yêu cầu đăng nhập)
 */
exports.addFavorite = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const userId = req.user._id;

    // ============ KIỂM TRA PHIM CÓ TỒN TẠI KHÔNG ====================
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'Phim không tồn tại trong hệ thống');
    }

    // ============ LẤY USER ====================
    const user = await User.findById(userId);

    // Kiểm tra phim đã có trong danh sách yêu thích chưa
    // toString() để so sánh ObjectId với string
    const isAlreadyFavorite = user.favorites.some(
      (favId) => favId.toString() === movieId
    );

    if (isAlreadyFavorite) {
      return sendError(
        res,
        HTTP_STATUS.CONFLICT, // 409 - Đã tồn tại
        'Phim này đã có trong danh sách yêu thích của bạn'
      );
    }

    // ============ THÊM VÀO DANH SÁCH ====================
    // Dùng $addToSet để đảm bảo không bị trùng (thêm an toàn dù đã check ở trên)
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { favorites: movieId } }, // $addToSet: chỉ thêm nếu chưa có
      { new: true }
    );

    // Đếm lại số phim yêu thích sau khi thêm
    const updatedUser = await User.findById(userId).select('favorites');

    return sendSuccess(
      res,
      { favoriteCount: updatedUser.favorites.length },
      `Đã thêm "${movie.title}" vào danh sách yêu thích`
    );
  } catch (error) {
    next(error);
  }
};

// ==================== XÓA PHIM KHỎI DANH SÁCH YÊU THÍCH ====================

/**
 * DELETE /api/favorites/:movieId
 * Mô tả: Xóa phim khỏi danh sách yêu thích
 * Params: movieId - ID của phim muốn xóa
 * Headers: Authorization: Bearer <token>
 * Response: { success, message, data: { favoriteCount } }
 * Middleware: protect (yêu cầu đăng nhập)
 */
exports.removeFavorite = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const userId = req.user._id;

    // ============ LẤY USER ====================
    const user = await User.findById(userId);

    // Kiểm tra phim có trong danh sách không thì mới xóa
    const isInFavorites = user.favorites.some(
      (favId) => favId.toString() === movieId
    );

    if (!isInFavorites) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        'Phim này không có trong danh sách yêu thích của bạn'
      );
    }

    // ============ XÓA KHỎI DANH SÁCH ====================
    // Dùng $pull để xóa movieId ra khỏi mảng favorites
    await User.findByIdAndUpdate(
      userId,
      { $pull: { favorites: movieId } }, // $pull: xóa phần tử khỏi mảng
      { new: true }
    );

    // Đếm lại số phim yêu thích sau khi xóa
    const updatedUser = await User.findById(userId).select('favorites');

    return sendSuccess(
      res,
      { favoriteCount: updatedUser.favorites.length },
      'Đã xóa phim khỏi danh sách yêu thích'
    );
  } catch (error) {
    next(error);
  }
};

// ==================== KIỂM TRA PHIM CÓ TRONG YÊU THÍCH KHÔNG ====================

/**
 * GET /api/favorites/check/:movieId
 * Mô tả: Kiểm tra xem phim cụ thể có trong danh sách yêu thích không
 *         Dùng cho frontend để highlight nút tim (❤️/🤍)
 * Params: movieId - ID phim cần kiểm tra
 * Headers: Authorization: Bearer <token>
 * Response: { success, data: { isFavorite: true/false } }
 * Middleware: protect (yêu cầu đăng nhập)
 */
exports.checkFavorite = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const userId = req.user._id;

    // Chỉ lấy trường favorites để tối ưu query (không cần load toàn bộ user)
    const user = await User.findById(userId).select('favorites');

    // Kiểm tra movieId có nằm trong mảng favorites không
    const isFavorite = user.favorites.some(
      (favId) => favId.toString() === movieId
    );

    return sendSuccess(
      res,
      { isFavorite }, // true: đã thích, false: chưa thích
      'Kiểm tra trạng thái yêu thích thành công'
    );
  } catch (error) {
    next(error);
  }
};

// ==================== TOGGLE YÊU THÍCH (THÊM/XÓA TỰ ĐỘNG) ====================

/**
 * POST /api/favorites/toggle/:movieId
 * Mô tả: Nếu phim đã trong yêu thích → xóa; Nếu chưa → thêm vào
 *         Frontend dùng endpoint này cho nút tim ❤️ (1 click = toggle)
 * Params: movieId - ID của phim
 * Headers: Authorization: Bearer <token>
 * Response: { success, message, data: { isFavorite, favoriteCount } }
 * Middleware: protect (yêu cầu đăng nhập)
 */
exports.toggleFavorite = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const userId = req.user._id;

    // Lấy user để kiểm tra trạng thái yêu thích hiện tại
    const user = await User.findById(userId).select('favorites');

    // Kiểm tra phim có trong danh sách yêu thích không
    const isAlreadyFavorite = user.favorites.some(
      (favId) => favId.toString() === movieId
    );

    let updatedUser;
    let message;

    if (isAlreadyFavorite) {
      // ĐÃ YÊU THÍCH → XÓA KHỎI DANH SÁCH
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { $pull: { favorites: movieId } }, // $pull: xóa khỏi mảng
        { new: true, select: 'favorites' }
      );
      message = 'Đã xóa phim khỏi danh sách yêu thích';
    } else {
      // CHƯA YÊU THÍCH → THÊM VÀO DANH SÁCH
      // Kiểm tra phim tồn tại trước khi thêm
      const movie = await Movie.findById(movieId).select('_id');
      if (!movie) {
        return sendError(res, HTTP_STATUS.NOT_FOUND, 'Phim không tồn tại');
      }

      updatedUser = await User.findByIdAndUpdate(
        userId,
        { $addToSet: { favorites: movieId } }, // $addToSet: thêm nếu chưa có
        { new: true, select: 'favorites' }
      );
      message = 'Đã thêm phim vào danh sách yêu thích';
    }

    return sendSuccess(
      res,
      {
        isFavorite: !isAlreadyFavorite,               // Trạng thái mới sau khi toggle
        favoriteCount: updatedUser.favorites.length,   // Tổng số phim yêu thích hiện tại
      },
      message
    );
  } catch (error) {
    next(error);
  }
};
