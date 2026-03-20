// ==================== KẾT NỐI DATABASE MONGODB ====================
//
// File này chứa hàm để kết nối MongoDB
// Sử dụng trong server.js: const connectDB = require('./config/database');
//

const mongoose = require('mongoose');
const config = require('./environment');

/**
 * Hàm kết nối MongoDB
 * @returns {Promise} - Promise của Mongoose connection
 */
const connectDB = async () => {
  try {
    // Kết nối tới MongoDB Atlas
    const conn = await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,      // Sử dụng URL parser mới
      useUnifiedTopology: true,   // Sử dụng engine mới
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1); // Thoát app nếu kết nối thất bại
  }
};

module.exports = connectDB;
