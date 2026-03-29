const Movie = require('../models/Movie');

exports.getMovies = async(req, res) => {
    try {
        // Lấy các tham số từ URL: ?q=...&category=...
        const { q, category, year, type } = req.query;
        let query = {};

        if (q) query.title = { $regex: q, $options: 'i' }; // Tìm kiếm tên phim
        if (category) query.category = category;
        if (year) query.year = parseInt(year);
        if (type) query.type = type;

        const movies = await Movie.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: movies });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};