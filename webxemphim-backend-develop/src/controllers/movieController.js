const Movie = require('../models/Movie');

exports.getMovies = async(req, res) => {
    try {
        // 1. Lấy params và ép kiểu dữ liệu
        let { category, year, type, search, q, page = 1, limit = 5 } = req.query;
        let query = {};

        // 2. Xử lý Tìm kiếm
        const searchKeyword = search || q;
        if (searchKeyword) {
            query.title = { $regex: searchKeyword.trim(), $options: 'i' };
        }

        // 3. Lọc theo loại (Chỉ lọc nếu giá trị khác "Tất cả")
        if (type && type !== "Tất cả") {
            query.type = type;
        }

        // 4. Lọc theo thể loại (Chỉ lọc nếu giá trị khác "Tất cả")
        if (category && category !== "Tất cả") {
            query.category = { $regex: category, $options: 'i' };
        }

        // 5. Lọc theo năm
        if (year && year !== "Tất cả") {
            query.year = Number(year);
        }

        // 6. Tính toán phân trang
        const p = Math.max(1, Number(page));
        const l = Math.max(1, Number(limit));
        const skip = (p - 1) * l;

        // 7. Thực thi truy vấn
        const total = await Movie.countDocuments(query);
        const movies = await Movie.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(l);

        // 8. Trả về kết quả
        res.status(200).json({
            success: true,
            pagination: {
                total,
                totalPages: Math.ceil(total / l),
                currentPage: p,
                limit: l
            },
            data: movies
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getMovieById = async(req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (!movie) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phim' });
        }
        res.status(200).json({ success: true, data: movie });
    } catch (error) {
        // Xử lý lỗi nếu ID sai định dạng MongoDB
        res.status(500).json({ success: false, message: "ID không hợp lệ hoặc lỗi server" });
    }
};