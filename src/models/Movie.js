const mongoose = require('mongoose');
const { MOVIE_TYPES, MOVIE_STATUS, MOVIE_CATEGORIES } = require('../config/constants');

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Tên phim không được để trống'],
    trim: true,
  },
  description: {
    type: String,
  },
  poster: {
    type: String, // URL ảnh
  },
  trailerUrl: {
    type: String,
  },
  movieUrl: {
    type: String, // Video source
  },
  type: {
    type: String,
    enum: Object.values(MOVIE_TYPES),
    default: MOVIE_TYPES.SINGLE,
  },
  status: {
    type: String,
    enum: Object.values(MOVIE_STATUS),
    default: MOVIE_STATUS.ONGOING,
  },
  categories: [{
    type: String,
    enum: Object.values(MOVIE_CATEGORIES),
  }],
  viewCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

const Movie = mongoose.model('Movie', movieSchema);

module.exports = Movie;
