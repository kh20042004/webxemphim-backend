const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    posterUrl: String,
    videoUrl: String,
    category: String,
    year: Number,
    type: { type: String, default: 'Movie' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Movie', movieSchema);