const User = require('../models/User');
const { HTTP_STATUS, MESSAGES, VIP_PLANS } = require('../config/constants');
const bcrypt = require('bcryptjs');

/**
 * Lấy profile cá nhân
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Không tìm thấy người dùng' });
    }
    res.status(HTTP_STATUS.OK).json({ success: true, data: user });
  } catch (error) {
    res.status(HTTP_STATUS.SERVER_ERROR).json({ success: false, message: error.message });
  }
};

/**
 * Cập nhật thông tin profile
 */
const updateProfile = async (req, res) => {
  try {
    const { fullName, avatar, password } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    if (fullName) user.fullName = fullName;
    if (avatar) user.avatar = avatar;
    if (password) {
      // Logic băm mật khẩu được handle bởi pre-save hook trong Model
      user.password = password;
    }

    await user.save();
    
    // Ẩn mật khẩu khi trả về
    user.password = undefined;

    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Cập nhật thành công', data: user });
  } catch (error) {
    res.status(HTTP_STATUS.SERVER_ERROR).json({ success: false, message: error.message });
  }
};

/**
 * Đăng ký VIP
 * Logic: Cộng dồn ngày từ thời điểm hiện tại hoặc từ ngày hết hạn nếu còn VIP
 */
const subscribeVIP = async (req, res) => {
  try {
    const { plan } = req.body;
    
    if (!Object.values(VIP_PLANS).includes(plan) || plan === VIP_PLANS.FREE) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: 'Loại gói không hợp lệ' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    const DAYS_TO_ADD = 30; // Mặc định mua 1 tháng
    let startDate = new Date();
    
    // Nếu đang là VIP và còn hạn, cộng dồn từ ngày hết hạn cũ
    if (user.subscription.plan !== VIP_PLANS.FREE && user.subscription.expiryDate > new Date()) {
      startDate = new Date(user.subscription.expiryDate);
    }

    const expiryDate = new Date(startDate);
    expiryDate.setDate(expiryDate.getDate() + DAYS_TO_ADD);

    user.subscription = {
      plan,
      startDate: new Date(), // Ngày bấm đăng ký thực tế
      expiryDate,
    };

    await user.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Đăng ký gói ${plan} thành công!`,
      data: {
        plan: user.subscription.plan,
        expiryDate: user.subscription.expiryDate
      }
    });

  } catch (error) {
    res.status(HTTP_STATUS.SERVER_ERROR).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  subscribeVIP,
};
