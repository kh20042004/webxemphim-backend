// ==================== GOOGLE OAUTH STRATEGY ====================
//
// Mô tả: Cấu hình Passport.js để xử lý đăng nhập bằng Google
// Sử dụng: require('../config/passport')(passport);
//

const GoogleStrategy = require('passport-google-oauth20').Strategy;
const config = require('./environment');
const User = require('../models/User');

module.exports = function(passport) {
  // ==================== GOOGLE OAUTH STRATEGY ====================
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
        callbackURL: config.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log('🔐 Google OAuth Strategy - Profile received:', {
            id: profile.id,
            displayName: profile.displayName,
            email: profile.emails?.[0]?.value,
          });

          // Lấy thông tin từ Google Profile
          const { id, displayName, emails, photos } = profile;
          
          // Validate email exists
          if (!emails || !emails[0]) {
            console.error('❌ No email from Google profile');
            return done(new Error('Google profile does not contain email'));
          }

          const email = emails[0].value;
          const googleId = id;
          const avatar = photos && photos[0] ? photos[0].value : null;
          const fullName = displayName && displayName.trim() ? displayName : email.split('@')[0];

          console.log('📝 Creating/updating user:', { email, googleId, fullName });

          // Tìm user có email hoặc googleId này
          let user = await User.findOne({
            $or: [{ email }, { googleId }],
          });

          if (user) {
            console.log('✅ User found, updating if needed');
            // Nếu user đã tồn tại, cập nhật googleId nếu chưa có
            if (!user.googleId) {
              user.googleId = googleId;
              await user.save();
              console.log('✅ googleId updated');
            }
          } else {
            console.log('➕ Creating new user from Google');
            // Nếu user chưa tồn tại, tạo user mới
            user = await User.create({
              email,
              googleId,
              fullName,
              avatar,
              // password not needed for Google OAuth users
              isEmailVerified: true, // Google email đã xác minh
            });
            console.log('✅ New user created:', user._id);
          }

          // Ensure user has all required fields before returning
          if (!user) {
            console.error('❌ User is null after create/find');
            return done(new Error('Failed to create or retrieve user'));
          }

          console.log('✅ Google strategy - returning user:', user._id);
          return done(null, user);
        } catch (error) {
          console.error('❌ Google strategy error:', error.message, error.stack);
          return done(error, null);
        }
      }
    )
  );

  // ==================== SERIALIZE & DESERIALIZE USER ====================

  /**
   * Serialize: Lưu user ID vào session
   */
  passport.serializeUser((user, done) => {
    console.log('🔐 serializeUser called for user:', user._id);
    done(null, user._id);
  });

  /**
   * Deserialize: Lấy user từ user ID
   */
  passport.deserializeUser(async (id, done) => {
    try {
      console.log('🔐 deserializeUser called for id:', id);
      const user = await User.findById(id);
      console.log('🔐 deserializeUser result:', user ? user._id : 'null');
      done(null, user);
    } catch (error) {
      console.error('❌ deserializeUser error:', error.message);
      done(error, null);
    }
  });
};
