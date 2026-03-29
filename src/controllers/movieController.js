// ==================== MOVIE CONTROLLER ====================
// Người làm: Tuấn Anh
// Chức năng: API cho người dùng xem phim (Public)
// ⭐ CẢI THIỆN: Đã thêm Pagination, Search, Filter
// ==========================================================

const Movie = require('../models/Movie');
const Rating = require('../models/Rating');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { NotFoundError } = require('../utils/errorHandling');
const { paginateQuery, getPaginationParams, parseSortString } = require('../utils/paginationHelper');
const { HTTP_STATUS } = require('../config/constants');

/**
 * @desc    Lấy danh sách phim với pagination, search, filter
 * @route   GET /api/movies
 * @access  Public (Ai cũng xem được)
 * @query   page, limit, sort, type, category, year, search
 * 
 * ⭐ PAGINATION:
 * - ?page=1&limit=10 → Trang 1, mỗi trang 10 phim
 * - ?page=2&limit=20 → Trang 2, mỗi trang 20 phim
 * 
 * ⭐ SORTING:
 * - ?sort=-createdAt → Mới nhất trước (mặc định)
 * - ?sort=-views → Xem nhiều nhất trước
 * - ?sort=title → Sắp xếp theo tên A-Z
 * - ?sort=-year → Năm mới nhất trước
 * 
 * ⭐ FILTERING:
 * - ?type=Phim lẻ → Lọc theo loại phim
 * - ?category=Hành động → Lọc theo thể loại
 * - ?year=2024 → Lọc theo năm
 * - ?search=avengers → Tìm kiếm theo tên phim
 * 
 * ⭐ COMBINED:
 * - ?page=1&limit=12&sort=-views&type=Phim lẻ&category=Hành động
 */
exports.getAllMovies = async (req, res, next) => {
    try {
        // ============ XÂY DỰNG FILTER ====================
        const filter = {};

        // Lọc theo type (Phim lẻ, Phim bộ, TV Show, Hoạt hình)
        if (req.query.type) {
            filter.type = req.query.type;
        }

        // Lọc theo category (Hành động, Hài, Kinh dị, v.v.)
        if (req.query.category) {
            filter.category = req.query.category;
        }

        // Lọc theo năm
        if (req.query.year) {
            filter.year = parseInt(req.query.year);
        }

        // Tìm kiếm theo tên phim (case-insensitive, partial match)
        if (req.query.search) {
            filter.title = { $regex: req.query.search, $options: 'i' };
        }

        // ============ PAGINATION PARAMS ====================
        const { page, limit } = getPaginationParams(req.query);

        // ============ SORTING ====================
        // Mặc định: sắp xếp theo mới nhất (-createdAt)
        // User có thể override bằng query param ?sort=...
        const sort = req.query.sort ? parseSortString(req.query.sort) : { createdAt: -1 };

        // ============ QUERY VỚI PAGINATION ====================
        const result = await paginateQuery(Movie, filter, {
            page,
            limit,
            sort,
            select: '-__v', // Bỏ field __v
        });

        // ============ TÍNH RATING TRUNG BÌNH CHO MỖI PHIM ====================
        // Vì ratings được lưu riêng trong collection Rating, ta cần tính avgRating từ đó
        if (result.data && result.data.length > 0) {
            const moviesWithRatings = await Promise.all(
                result.data.map(async (movie) => {
                    // Tính rating trung bình cho phim này
                    const ratings = await Rating.find({ movieId: movie._id });
                    const avgRating = ratings.length > 0 
                        ? (ratings.reduce((sum, r) => sum + r.star, 0) / ratings.length).toFixed(1)
                        : 5; // Mặc định 5 nếu chưa có rating

                    // Trả về movie + avgRating
                    return {
                        ...movie.toObject(),
                        avgRating: parseFloat(avgRating),
                        totalRatings: ratings.length
                    };
                })
            );
            result.data = moviesWithRatings;
        }

        // ============ TRẢ VỀ RESPONSE ====================
        // Response có dạng:
        // {
        //   success: true,
        //   data: [...movies với avgRating],
        //   pagination: {
        //     page: 1,
        //     limit: 10,
        //     total: 100,
        //     totalPages: 10,
        //     hasNext: true,
        //     hasPrev: false
        //   }
        // }
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: `Lấy danh sách phim thành công`,
            ...result, // Spread data và pagination
        });

    } catch (error) {
        next(error);
    }
};

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

        // Tăng lượt xem: dùng findByIdAndUpdate + $inc thay vì movie.save()
        // LÝ DO: movie.save() chạy full Mongoose validation → lỗi nếu data cũ
        // trong DB không khớp schema (VD: description thiếu, type sai enum).
        // findByIdAndUpdate với $inc bỏ qua validation → an toàn hơn
        await Movie.findByIdAndUpdate(
            movieId,
            { $inc: { views: 1 } },  // Chỉ tăng views lên 1, không đụng field khác
            { new: false, runValidators: false } // Tắt validation cho thao tác này
        );

        // Cộng thêm 1 vào views của object đang có để trả về đúng số
        movie.views += 1;

        // ============ TÍNH RATING TRUNG BÌNH ====================
        // Lấy tất cả ratings của phim này và tính trung bình
        const ratings = await Rating.find({ movieId: movieId });
        const avgRating = ratings.length > 0 
            ? (ratings.reduce((sum, r) => sum + r.star, 0) / ratings.length).toFixed(1)
            : 5; // Mặc định 5 nếu chưa có rating

        // Chuyển movie sang object và thêm avgRating vào
        const movieObj = movie.toObject ? movie.toObject() : movie;
        movieObj.avgRating = parseFloat(avgRating);
        movieObj.totalRatings = ratings.length;

        // Dùng chuẩn Response Handler của team để trả về
        return sendSuccess(res, movieObj, 'Lấy chi tiết phim thành công');

    } catch (error) {
        // Nếu ID sai format của MongoDB, đẩy lỗi cho hệ thống xử lý
        next(error);
    }
};

// =======================================================================
// PHIM TRENDING - XEM NHIỀU NHẤT
// =======================================================================

/**
 * @desc    Lấy danh sách phim đang được xem nhiều nhất (trending)
 * @route   GET /api/movies/trending
 * @access  Public - Không cần đăng nhập
 * @query   limit - Số lượng phim muốn lấy (mặc định: 10)
 *
 * Logic hoạt động:
 *   1. Query tất cả phim trong MongoDB
 *   2. Sắp xếp theo field 'views' từ cao xuống thấp
 *   3. Giới hạn kết quả theo 'limit'
 *   4. Chỉ lấy các field cần thiết (không lấy __v để tiết kiệm băng thông)
 *
 * Dùng cho:
 *   - Banner/Slider trang chủ
 *   - Section "Phim Hot" / "Đang Thịnh Hành"
 *   - api.js: getTrendingMovies()
 */
exports.getTrending = async (req, res, next) => {
    try {
        // Đọc số lượng phim muốn lấy từ query param, mặc định 10
        // VD: /api/movies/trending?limit=5 → lấy 5 phim
        const limit = parseInt(req.query.limit) || 10;

        // Truy vấn MongoDB: lấy phim có lượt xem cao nhất
        // .sort({ views: -1 }) = sắp xếp giảm dần theo views (-1 = giảm dần, 1 = tăng dần)
        // .select(...) = chỉ lấy những field cần thiết, bỏ __v để tối ưu
        const movies = await Movie.find()
            .sort({ views: -1 })
            .limit(limit)
            .select('title poster thumbnail description category type year views episodes createdAt');

        // Trả về response theo chuẩn của dự án
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            count: movies.length,
            data: movies,
            message: `Lấy top ${movies.length} phim trending thành công`,
        });

    } catch (error) {
        // Chuyển lỗi sang middleware xử lý lỗi tập trung
        next(error);
    }
};

// =======================================================================
// PHIM MỚI NHẤT
// =======================================================================

/**
 * @desc    Lấy danh sách phim mới nhất (vừa được thêm vào hệ thống)
 * @route   GET /api/movies/new
 * @access  Public - Không cần đăng nhập
 * @query   limit - Số lượng phim muốn lấy (mặc định: 10)
 *
 * Logic hoạt động:
 *   1. Query tất cả phim trong MongoDB
 *   2. Sắp xếp theo field 'createdAt' từ mới nhất đến cũ nhất
 *   3. Giới hạn kết quả theo 'limit'
 *
 * Khác với trending: trending dựa trên LƯỢT XEM, còn new dựa trên THỜI GIAN TẠO
 *
 * Dùng cho:
 *   - Section "Phim Mới Ra Mắt" trên trang chủ
 *   - Thông báo phim mới cho người dùng
 *   - api.js: getNewMovies()
 */
exports.getNewMovies = async (req, res, next) => {
    try {
        // Đọc số lượng phim muốn lấy từ query param, mặc định 10
        // VD: /api/movies/new?limit=20 → lấy 20 phim mới nhất
        const limit = parseInt(req.query.limit) || 10;

        // Truy vấn MongoDB: lấy phim mới nhất theo thời gian tạo
        // timestamps: true trong schema tự động thêm field createdAt
        // .sort({ createdAt: -1 }) = phim được tạo gần đây nhất lên đầu
        const movies = await Movie.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('title poster thumbnail description category type year views episodes createdAt');

        // Trả về response chuẩn
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            count: movies.length,
            data: movies,
            message: `Lấy ${movies.length} phim mới nhất thành công`,
        });

    } catch (error) {
        next(error);
    }
};

// =======================================================================
// DANH SÁCH THỂ LOẠI PHIM
// =======================================================================

/**
 * @desc    Lấy tất cả thể loại phim (categories) đang có trong hệ thống
 * @route   GET /api/categories
 * @access  Public - Không cần đăng nhập
 *
 * Logic hoạt động:
 *   1. Dùng MongoDB .distinct('category') để lấy các giá trị UNIQUE
 *      của field 'category' trong collection movies
 *   2. Lọc bỏ giá trị rỗng/null (nếu có phim chưa điền thể loại)
 *   3. Sắp xếp theo bảng chữ cái để dễ hiển thị
 *
 * Tại sao dùng distinct() thay vì hardcode?
 *   → Danh sách thể loại luôn đồng bộ với dữ liệu thực trong DB
 *   → Admin thêm thể loại mới qua form → API tự động trả về luôn
 *
 * Dùng cho:
 *   - Menu điều hướng trang chủ (Hành động, Tình cảm, Kinh dị...)
 *   - Dropdown filter trên trang tìm kiếm
 *   - api.js: getCategories()
 */
exports.getCategories = async (req, res, next) => {
    try {
        // distinct('category') = lấy tất cả giá trị khác nhau của field 'category'
        // Giống SQL: SELECT DISTINCT category FROM movies
        const categories = await Movie.distinct('category');

        // Lọc sạch dữ liệu:
        //   .filter(Boolean) = bỏ những giá trị falsy (null, undefined, '', 0, false)
        //   .sort()          = sắp xếp A-Z theo Unicode (hoạt động với tiếng Việt)
        const sortedCategories = categories
            .filter(Boolean)
            .sort();

        // Trả về danh sách thể loại
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            count: sortedCategories.length,
            data: sortedCategories,
            message: `Lấy ${sortedCategories.length} thể loại phim thành công`,
        });

    } catch (error) {
        next(error);
    }
};

// =======================================================================
// TÌM KIẾM PHIM
// =======================================================================

/**
 * @desc    Tìm kiếm phim theo từ khóa
 * @route   GET /api/search?q=keyword
 * @access  Public - Không cần đăng nhập
 * @query   q     - Từ khóa tìm kiếm (bắt buộc)
 *          page  - Trang hiện tại (mặc định: 1)
 *          limit - Số phim mỗi trang (mặc định: 12)
 *
 * Logic hoạt động:
 *   1. Đọc từ khóa từ query param ?q= (hoặc ?search= để tương thích)
 *   2. Nếu không có từ khóa → trả về mảng rỗng ngay
 *   3. Tạo filter MongoDB dùng $regex (tìm kiếm gần đúng, không phân biệt hoa thường)
 *   4. Thực hiện query có phân trang (pagination)
 *   5. Sắp xếp kết quả theo lượt xem (phim phổ biến nhất lên đầu)
 *
 * Ví dụ request:
 *   GET /api/search?q=avengers&page=1&limit=12
 *   GET /api/search?q=phim%20tình%20cảm
 *
 * Tại sao dùng Regex thay vì Text Index?
 *   → Regex đơn giản, không cần cấu hình index thêm
 *   → Text Index nhanh hơn nhưng cần setup Atlas Search hoặc mongoose text index
 *   → Với dataset nhỏ (<10k phim) thì Regex hoàn toàn đủ dùng
 *
 * Dùng cho:
 *   - Thanh tìm kiếm trên header
 *   - Trang kết quả tìm kiếm search.html
 *   - api.js: searchMovies()
 */
exports.searchMovies = async (req, res, next) => {
    try {
        // Đọc từ khóa từ query param
        // Hỗ trợ cả ?q= (chuẩn) và ?search= (tương thích với getAllMovies)
        const keyword = (req.query.q || req.query.search || '').trim();

        // Nếu không có từ khóa → không tìm gì được, trả về rỗng ngay
        // Tránh query nặng khi từ khóa trống
        if (!keyword) {
            return res.status(HTTP_STATUS.OK).json({
                success: true,
                keyword: '',
                count: 0,
                data: [],
                pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
                message: 'Vui lòng nhập từ khóa để tìm kiếm',
            });
        }

        // Lấy tham số phân trang từ query string
        // getPaginationParams đọc ?page= và ?limit=, có giá trị mặc định
        const { page, limit } = getPaginationParams(req.query);

        // Tạo điều kiện tìm kiếm cho MongoDB:
        // $regex: biểu thức tìm kiếm gần đúng (tương tự LIKE trong SQL)
        // $options: 'i' = case-insensitive (không phân biệt chữ HOA/thường)
        // VD: keyword='avengers' sẽ khớp 'Avengers', 'AVENGERS', 'the avengers'
        const searchFilter = {
            title: { $regex: keyword, $options: 'i' },
        };

        // Thực hiện query với pagination đầy đủ
        // paginateQuery tự tính totalPages, hasNext, hasPrev...
        const result = await paginateQuery(Movie, searchFilter, {
            page,
            limit,
            sort: { views: -1 }, // Phim xem nhiều nhất lên đầu trong kết quả tìm kiếm
            select: '-__v',       // Bỏ field __v không cần thiết
        });

        // Trả về kết quả tìm kiếm kèm từ khóa để frontend dễ hiển thị
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            keyword,    // Echo lại từ khóa để frontend có thể hiển thị "Kết quả cho: ..."
            message: `Tìm thấy ${result.pagination.total} phim với từ khóa "${keyword}"`,
            ...result,  // Spread: data[], pagination{}
        });

    } catch (error) {
        next(error);
    }
};
