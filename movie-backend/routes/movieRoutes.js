const express = require("express");
const router = express.Router();
const Movie = require("../models/Movie");


// 🎬 1. LẤY DANH SÁCH PHIM
// GET /api/movies
router.get("/", async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// 🔥 2. TOP 10 PHIM (views hoặc rating)
// GET /api/movies/top?sortBy=views
// GET /api/movies/top?sortBy=rating
router.get("/top", async (req, res) => {
  try {
    const { sortBy = "views" } = req.query;

    let sortOption = {};

    if (sortBy === "rating") {
      sortOption = { rating: -1 };
    } else {
      sortOption = { views: -1 };
    }

    const movies = await Movie.find()
      .sort(sortOption)
      .limit(10);

    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// 🎥 3. LẤY CHI TIẾT + TĂNG VIEW
// GET /api/movies/:id
router.get("/:id", async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } }, // 🔥 tăng views
      { new: true }
    );

    res.json(movie);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ➕ 4. THÊM PHIM (test data)
// POST /api/movies
router.post("/", async (req, res) => {
  try {
    const movie = new Movie(req.body);
    await movie.save();
    res.json(movie);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ❌ 5. XOÁ PHIM
router.delete("/:id", async (req, res) => {
  try {
    await Movie.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;