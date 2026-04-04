const User = require('../../models/User');
const { sendSuccess } = require('../../utils/responseHandler');

// [READ] Lấy danh sách tất cả người dùng
exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        return sendSuccess(res, users, 'Lấy danh sách người dùng thành công');
    } catch (error) {
        next(error);
    }
};

// [UPDATE] Khóa hoặc Mở khóa tài khoản (Ban/Unban)
exports.toggleUserStatus = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

        user.isActive = !user.isActive; // Đảo trạng thái
        await user.save();

        return sendSuccess(res, user, `Đã ${user.isActive ? 'mở khóa' : 'khóa'} tài khoản`);
    } catch (error) {
        next(error);
    }
};