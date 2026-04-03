# 🏀 SPORTS API INTEGRATION GUIDE

## 📝 Overview

Hướng dẫn tích hợp Sports API vào backend Film+ project.

---

## 🔧 SETUP & INTEGRATION

### 1️⃣ File Được Tạo

**Models** (Database Schemas):
- `src/models/League.js` - Giải đấu
- `src/models/Team.js` - Đội bóng
- `src/models/Match.js` - Trận đấu
- `src/models/Event.js` - Sự kiện trực tiếp
- `src/models/Highlight.js` - Video nổi bật

**Controllers** (Business Logic):
- `src/controllers/sportsController.js` - Xử lý tất cả logic Sports

**Routes** (API Endpoints):
- `src/routes/sportsRoutes.js` - Định nghĩa tất cả endpoints

**Documentation**:
- `docs/SPORTS_API_SPEC.md` - Chi tiết API specification
- `docs/SPORTS_INTEGRATION_GUIDE.md` - File này

---

### 2️⃣ Cách Integrate vào Server

**File:** `src/server.js`

```javascript
// ==================== IMPORT ROUTES ====================
// Existing routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

// NEW: Sports routes
const sportsRoutes = require('./routes/sportsRoutes');

// ==================== MOUNT ROUTES ====================
// Existing routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// NEW: Sports routes
app.use('/api/sports', sportsRoutes);

// Các routes khác...
// app.use('/api/movies', require('./routes/movieRoutes'));
// ...
```

---

### 3️⃣ Models Dependency

**Import in Controllers:**
```javascript
const League = require('../models/League');
const Team = require('../models/Team');
const Match = require('../models/Match');
const Event = require('../models/Event');
const Highlight = require('../models/Highlight');
```

**No External Dependencies** - Chỉ dùng:
- Mongoose (đã có)
- Constants từ `config/constants`
- Utils từ `utils/responseHandler`

---

## 📊 API ENDPOINTS SUMMARY

### Public Endpoints (50+ API calls)

**Leagues:**
- `GET /api/sports/leagues`
- `GET /api/sports/leagues/:id`

**Matches:**
- `GET /api/sports/matches`
- `GET /api/sports/matches/upcoming`
- `GET /api/sports/matches/live`
- `GET /api/sports/matches/:id`

**Events:**
- `GET /api/sports/events`
- `GET /api/sports/events/live`
- `GET /api/sports/events/:id`

**Highlights:**
- `GET /api/sports/highlights`
- `GET /api/sports/highlights/trending`
- `GET /api/sports/highlights/:id`

### Protected Endpoints (Cần token)

- `POST /api/sports/highlights/:id/like`
- `POST /api/sports/highlights/:id/unlike`

### Admin Endpoints (Cần token + role=admin)

**Leagues Management:**
- `POST /api/sports/admin/leagues`
- `PUT /api/sports/admin/leagues/:id`
- `DELETE /api/sports/admin/leagues/:id`

**Matches Management:**
- `POST /api/sports/admin/matches`
- `PUT /api/sports/admin/matches/:id/score`
- `DELETE /api/sports/admin/matches/:id`

**Events Management:**
- `POST /api/sports/admin/events`
- `DELETE /api/sports/admin/events/:id`

**Highlights Management:**
- `POST /api/sports/admin/highlights`
- `DELETE /api/sports/admin/highlights/:id`

---

## 🗄️ Database Schema

### League Collection
```javascript
{
  _id: ObjectId,
  name: String,              // "Ngoại Hạng Anh"
  slug: String,              // "ngoai-hang-anh"
  code: String,              // "PL"
  description: String,
  logo: String,              // CDN URL
  country: String,           // "England"
  season: Number,            // 2026
  startDate: Date,
  endDate: Date,
  matchesPerSeason: Number,
  teamsCount: Number,
  status: String,            // "active", "upcoming", "finished"
  teams: [ObjectId],         // Ref to Team
  matches: [ObjectId],       // Ref to Match
  timestamps: true
}
```

### Team Collection
```javascript
{
  _id: ObjectId,
  name: String,              // "Manchester United"
  slug: String,
  logo: String,              // CDN URL
  country: String,
  stadium: String,
  founded: Number,
  coach: String,
  players: Number,
  description: String,
  wins: Number,
  draws: Number,
  losses: Number,
  goalsFor: Number,
  goalsAgainst: Number,
  isActive: Boolean,
  timestamps: true
}
```

### Match Collection
```javascript
{
  _id: ObjectId,
  leagueId: ObjectId,        // Ref to League
  homeTeamId: ObjectId,      // Ref to Team
  awayTeamId: ObjectId,
  homeTeamName: String,
  awayTeamName: String,
  homeTeamLogo: String,
  awayTeamLogo: String,
  scheduleDate: Date,
  scheduleTime: String,      // "20:00"
  homeScore: Number,
  awayScore: Number,
  status: String,            // "upcoming", "live", "finished"
  isLive: Boolean,
  round: Number,
  stadium: String,
  referee: String,
  description: String,
  highlightId: ObjectId,     // Ref to Highlight
  possession: { home, away },
  shots: { home, away },
  shotsOnTarget: { home, away },
  passes: { home, away },
  viewCount: Number,
  liveViewers: Number,
  lastUpdated: Date,
  timestamps: true
}
```

### Event Collection
```javascript
{
  _id: ObjectId,
  title: String,
  slug: String,
  description: String,
  postImage: String,         // CDN URL
  eventDate: Date,
  eventTime: String,         // "20:00"
  matchId: ObjectId,         // Ref to Match
  leagueId: ObjectId,        // Ref to League
  type: String,              // "live", "upcoming", "replay"
  status: String,            // "live", "coming_soon", "finished"
  isLive: Boolean,
  isFeatured: Boolean,
  viewers: Number,
  viewCount: Number,
  timeTillStart: String,
  tags: [String],
  timestamps: true
}
```

### Highlight Collection
```javascript
{
  _id: ObjectId,
  title: String,
  slug: String,
  description: String,
  videoUrl: String,          // CDN URL
  thumbnailImage: String,    // CDN URL
  duration: Number,          // Seconds
  matchId: ObjectId,         // Ref to Match
  leagueId: ObjectId,        // Ref to League (required)
  homeTeamName: String,
  awayTeamName: String,
  uploadedDate: Date,
  viewCount: Number,
  likes: Number,
  likedBy: [ObjectId],       // Ref to User
  isVip: Boolean,
  isPublished: Boolean,
  goals: [
    { player, team, minute, description }
  ],
  tags: [String],
  keywords: [String],
  timestamps: true
}
```

---

## 🔐 Authentication & Authorization

### Middleware Usage

```javascript
const { protect, authorize } = require('../middleware/auth');

// Public route
router.get('/leagues', controller);

// Protected route (need token)
router.post('/highlights/:id/like', protect, controller);

// Admin only
router.post('/admin/leagues', protect, authorize('admin'), controller);
```

### Check User in Controller

```javascript
// Kiểm tra user login
if (!req.user) {
  return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Vui lòng đăng nhập');
}

// Kiểm tra VIP
const isVip = req.user.subscription?.plan === 'vip';
if (highlight.isVip && !isVip) {
  return sendError(res, HTTP_STATUS.FORBIDDEN, 'Video này yêu cầu VIP');
}

// Kiểm tra admin
if (req.user.role !== 'admin') {
  return sendError(res, HTTP_STATUS.FORBIDDEN, 'Bạn không có quyền');
}
```

---

## 📱 Frontend Integration

### Gọi API từ Frontend

**File:** `frontend/src/services/api.js`

```javascript
// ============================================
// SPORTS ENDPOINTS
// ============================================

// Leagues
async function getLeaguesAPI(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/sports/leagues?${queryString}`);
}

async function getLeagueDetailsAPI(leagueId) {
    return apiRequest(`/sports/leagues/${leagueId}`);
}

// Matches
async function getMatchesAPI(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/sports/matches?${queryString}`);
}

async function getUpcomingMatchesAPI() {
    return apiRequest('/sports/matches/upcoming');
}

async function getLiveMatchesAPI() {
    return apiRequest('/sports/matches/live');
}

async function getMatchDetailsAPI(matchId) {
    return apiRequest(`/sports/matches/${matchId}`);
}

// Events
async function getEventsAPI(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/sports/events?${queryString}`);
}

async function getLiveEventsAPI() {
    return apiRequest('/sports/events/live');
}

// Highlights
async function getHighlightsAPI(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/sports/highlights?${queryString}`);
}

async function getTrendingHighlightsAPI() {
    return apiRequest('/sports/highlights/trending');
}

async function getHighlightDetailsAPI(highlightId) {
    return apiRequest(`/sports/highlights/${highlightId}`);
}

async function likeHighlightAPI(highlightId) {
    return apiRequest(`/sports/highlights/${highlightId}/like`, {
        method: 'POST'
    });
}

async function unlikeHighlightAPI(highlightId) {
    return apiRequest(`/sports/highlights/${highlightId}/unlike`, {
        method: 'POST'
    });
}
```

### Frontend Usage (từ sports.js)

```javascript
// Fetch data
const leagues = await getLeaguesAPI();
const upcomingMatches = await getUpcomingMatchesAPI();
const liveEvents = await getLiveEventsAPI();
const highlights = await getTrendingHighlightsAPI();

// Populate DOM with data
renderMatches(upcomingMatches.data);
renderEvents(liveEvents.data);
```

---

## 🧪 Testing URLs

**Khi server chạy tại `localhost:5000`:**

### Public Testing
```
GET http://localhost:5000/api/sports/leagues
GET http://localhost:5000/api/sports/matches/upcoming
GET http://localhost:5000/api/sports/events/live
GET http://localhost:5000/api/sports/highlights/trending
```

### Admin Testing (cần lấy admin token trước)
```
POST http://localhost:5000/api/sports/admin/leagues
Headers: { Authorization: "Bearer <admin_token>" }
Body: {
  "name": "Ngoại Hạng Anh",
  "code": "PL",
  "country": "England",
  "season": 2026
}
```

---

## 📈 Future Enhancements

1. **Real-time Updates** - WebSocket cho live scores
2. **Caching** - Redis cache cho frequently accessed data
3. **Search** - ElasticSearch cho advanced search
4. **Analytics** - Track user viewing patterns
5. **Recommendations** - Gợi ý trận đấu dựa trên lịch sử xem
6. **Notifications** - Push notifications khi trận đấu sắp bắt đầu
7. **Statistics** - Detailed player & team statistics
8. **Social Features** - Share, comment, forum discussions

---

## 🚀 Deployment

### Environment Variables Cần Thêm (nếu có)

```env
# Sports Config (optional)
SPORTS_CACHE_TTL=3600          # Cache 1 hour
SPORTS_MAX_RESULTS=50
SPORTS_ENABLE_LIVE=true

# Cloudinary (cho video uploads)
CLOUDINARY_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### MongoDB Collections Cần Tạo
```bash
# Collections sẽ tự tạo khi insertFirst document
# Nhưng có thể tạo trước bằng:
db.createCollection("leagues")
db.createCollection("teams")
db.createCollection("matches")
db.createCollection("events")
db.createCollection("highlights")

# Create indexes
db.matches.createIndex({ "leagueId": 1, "status": 1 })
db.highlights.createIndex({ "leagueId": 1, "uploadedDate": -1 })
```

---

## 📞 Support

Nếu gặp lỗi:
1. Kiểm tra console logs
2. Verify MongoDB connection
3. Check JWT token validity
4. Verify user role & permissions

---

**Tạo bởi:** AI Assistant  
**Ngày:** April 3, 2026  
**Status:** Ready for Production ✅
