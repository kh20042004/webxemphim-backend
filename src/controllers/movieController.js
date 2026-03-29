// ==================== MOVIE CONTROLLER ====================
// Người làm: Tuấn Anh
// Chức năng: API cho người dùng xem phim (Public)
// ==========================================================

const Movie = require('../models/Movie');
const { sendSuccess } = require('../utils/responseHandler');
const { NotFoundError } = require('../utils/errorHandling');

/**
 * @desc    Lấy chi tiết một bộ phim + Tự động tăng view
 * @route   GET /api/movies/:id
 * @access  Public (Ai cũng xem được)
 */
exports.getMovieById = async (req, res, next) => {
    try {
        const movieId = req.params.id;

        // Tìm phim theo ID
        const movie = await Movie.findById(movieId);

        // Dùng chuẩn Error Handler của team nếu không tìm thấy
        if (!movie) {
            return next(new NotFoundError('Không tìm thấy phim này trong hệ thống'));
        }

        // Tăng lượt xem lên 1
        movie.views += 1;
        await movie.save();

        // Dùng chuẩn Response Handler của team để trả về
        return sendSuccess(res, movie, 'Lấy chi tiết phim thành công');

    } catch (error) {
        // Nếu ID sai format của MongoDB, đẩy lỗi cho hệ thống xử lý
        next(error);
    }
};