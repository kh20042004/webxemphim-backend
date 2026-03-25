const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const movieRoutes = require("./routes/movieRoutes");

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// connect DB
connectDB();

// routes
app.use("/api/movies", movieRoutes);

// test
app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});