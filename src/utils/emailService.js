// ==================== EMAIL SERVICE ====================
//
// Mô tả: Service gửi email sử dụng nodemailer + Gmail SMTP
// Sử dụng: const { sendResetPasswordEmail } = require('../utils/emailService');
//

const nodemailer = require('nodemailer');
const config = require('../config/environment');

// ==================== KHỞI TẠO TRANSPORTER ====================
// Cấu hình kết nối tới Gmail SMTP để gửi email

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: config.SMTP_HOST,                    // smtp.gmail.com
  port: config.SMTP_PORT,                    // 587 (TLS)
  secure: false,                             // Dùng TLS thay vì SSL
  auth: {
    user: config.SMTP_FROM_EMAIL,            // Email Gmail (vd: tk04052k4@gmail.com)
    pass: config.SMTP_FROM_PASSWORD,         // App Password từ Google (16 ký tự, không phải password thường)
  },
});

// ==================== TEST KẾT NỐI EMAIL ====================
// Kiểm tra xem Gmail credentials có hợp lệ không khi app khởi động

transporter.verify((error, success) => {
  if (error) {
    // ❌ Lỗi xác thực - có thể là:
    // 1. SMTP_FROM_PASSWORD sai hoặc chưa được set
    // 2. Password là Gmail password thường (sai!) - phải dùng App Password
    // 3. Gmail account chưa bật 2-Step Verification
    console.log('❌ Lỗi email service - xác thực Gmail thất bại:');
    console.log('   Kiểm tra:');
    console.log('   1. SMTP_FROM_EMAIL = ' + config.SMTP_FROM_EMAIL);
    console.log('   2. SMTP_FROM_PASSWORD được set trong .env chưa?');
    console.log('   3. Password phải là App Password (16 ký tự), KHÔNG phải Gmail password thường');
    console.log('   4. Hướng dẫn lấy App Password: https://myaccount.google.com/apppasswords');
    console.log('');
    console.log('   Chi tiết lỗi:', error.message);
  } else {
    // ✅ Kết nối thành công - email service sẵn sàng
    console.log('✅ Email service sẵn sàng - có thể gửi email reset password');
  }
});

// ==================== EMAIL TEMPLATE ====================

/**
 * Hàm: Tạo HTML template cho email reset password
 * @param {string} resetToken - Mã reset password 6 chữ số
 * @param {number} expiresInMinutes - Thời gian hết hạn (phút)
 * @returns {string} - HTML email
 */
const createResetPasswordTemplate = (resetToken, expiresInMinutes = 15) => {
  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .content {
          padding: 30px;
        }
        .reset-code {
          background-color: #f0f0f0;
          border-left: 4px solid #667eea;
          padding: 20px;
          margin: 20px 0;
          font-size: 32px;
          font-weight: bold;
          color: #667eea;
          text-align: center;
          letter-spacing: 5px;
          font-family: 'Courier New', monospace;
        }
        .warning {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
          color: #856404;
        }
        .footer {
          background-color: #f9f9f9;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #999;
          border-top: 1px solid #eee;
        }
        .btn {
          display: inline-block;
          padding: 12px 30px;
          background-color: #667eea;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          margin-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Khôi Phục Mật Khẩu</h1>
        </div>
        <div class="content">
          <p>Xin chào,</p>
          <p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn. Mã xác minh của bạn là:</p>
          
          <div class="reset-code">${resetToken}</div>
          
          <p>Vui lòng nhập mã này vào ứng dụng để tiếp tục quá trình đặt lại mật khẩu.</p>
          
          <div class="warning">
            <strong>⚠️ Lưu ý quan trọng:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Mã này sẽ hết hạn sau <strong>${expiresInMinutes} phút</strong></li>
              <li>Không chia sẻ mã này với bất kỳ ai</li>
              <li>Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email</li>
            </ul>
          </div>
          
          <p>Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng liên hệ với chúng tôi ngay lập tức.</p>
          
          <p>Trân trọng,<br><strong>Đội ngũ Rồi Giải Trí</strong></p>
        </div>
        <div class="footer">
          <p>© 2024 Rồi Giải Trí. Mọi quyền được bảo lưu.</p>
          <p>Email này được gửi tự động, vui lòng không trả lời.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// ==================== HÀM GỬI EMAIL ====================

/**
 * Hàm: Gửi email reset password
 * @param {string} recipientEmail - Email người nhận
 * @param {string} resetToken - Mã reset password 6 chữ số
 * @returns {Promise<boolean>} - True nếu gửi thành công
 */
exports.sendResetPasswordEmail = async (recipientEmail, resetToken) => {
  try {
    const mailOptions = {
      from: `"Rồi Giải Trí" <${config.SMTP_FROM_EMAIL}>`, // Tên hiển thị + email
      to: recipientEmail,
      subject: '🔐 Mã khôi phục mật khẩu của bạn',
      html: createResetPasswordTemplate(resetToken, 15),
    };

    // Gửi email
    const info = await transporter.sendMail(mailOptions);

    console.log(`✅ Reset password email sent to ${recipientEmail}`);
    console.log(`   Message ID: ${info.messageId}`);

    return true;
  } catch (error) {
    console.error(`❌ Error sending reset password email to ${recipientEmail}:`, error);
    throw error;
  }
};

/**
 * Hàm: Gửi email welcome (khi user đăng ký)
 * @param {string} recipientEmail - Email người nhận
 * @param {string} fullName - Tên người dùng
 * @returns {Promise<boolean>} - True nếu gửi thành công
 */
exports.sendWelcomeEmail = async (recipientEmail, fullName) => {
  try {
    const mailOptions = {
      from: `"Rồi Giải Trí" <${config.SMTP_FROM_EMAIL}>`,
      to: recipientEmail,
      subject: '🎉 Chào mừng bạn đến với Rồi Giải Trí',
      html: `
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Chào mừng ${fullName}!</h1>
            </div>
            <div class="content">
              <p>Cảm ơn bạn đã tạo tài khoản trên Rồi Giải Trí.</p>
              <p>Bây giờ bạn có thể:</p>
              <ul>
                <li>Xem phim yêu thích của bạn</li>
                <li>Tạo danh sách yêu thích</li>
                <li>Theo dõi các series mới</li>
              </ul>
              <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
              <p>Chúc bạn xem phim vui vẻ!<br><strong>Đội ngũ Rồi Giải Trí</strong></p>
            </div>
            <div class="footer">
              <p>© 2024 Rồi Giải Trí. Mọi quyền được bảo lưu.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending welcome email to ${recipientEmail}:`, error);
    throw error;
  }
};

module.exports = exports;
