const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    title: { type: String, required: true },
    thumbnail: String,
    poster: String,
    description: String,
    category: String,
    year: Number,
    type: { type: String, enum: ['phim_le', 'phim_bo'] },
    views: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Movie', movieSchema);