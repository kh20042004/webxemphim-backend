# 🏀 SPORTS API SPECIFICATION

## API Overview

Sports module quản lý toàn bộ nội dung thể thao: giải đấu, trận đấu, sự kiện trực tiếp, highlight videos.

**Base URL:** `/api/sports`
**Status:** Sắp phát hành

---

## 📊 Database Models

### 1. League (Giải Đấu)
```javascript
{
  _id: ObjectId,
  name: String,              // "Ngoại Hạng Anh"
  slug: String,              // "ngoai-hang-anh"
  code: String,              // "PL" (Premier League)
  description: String,       // Mô tả chi tiết
  logo: String,              // URL logo từ Cloudinary
  country: String,           // "England"
  season: Number,            // 2025-2026
  status: String,            // "active", "upcoming", "finished"
  matchesPerSeason: Number,  // 380
  startDate: Date,
  endDate: Date,
  teams: [ObjectId],         // Reference tới Team
  matches: [ObjectId],       // Reference tới Match
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Team (Đội Bóng)
```javascript
{
  _id: ObjectId,
  name: String,              // "Manchester United"
  slug: String,              // "manchester-united"
  logo: String,              // URL logo
  country: String,           // "England"
  founded: Number,           // 1878
  stadium: String,           // "Old Trafford"
  coach: String,             // "Tên huấn luyện viên"
  players: Number,           // Số lượng cầu thủ
  description: String,
  createdAt: Date,
  updatedAt: Date
}
```

### 3. Match (Trận Đấu)
```javascript
{
  _id: ObjectId,
  leagueId: ObjectId,        // Reference tới League
  homeTeamId: ObjectId,      // Team nhà
  awayTeamId: ObjectId,      // Team khách
  homeTeamName: String,      // "Manchester United"
  awayTeamName: String,      // "Liverpool"
  homeTeamLogo: String,
  awayTeamLogo: String,
  status: String,            // "upcoming", "live", "finished"
  scheduleDate: Date,        // Ngày thi đấu
  scheduleTime: String,      // "20:00"
  homeScore: Number,         // null nếu chưa đánh
  awayScore: Number,
  round: Number,             // Vòng thứ mấy
  stadium: String,           // Sân vận động
  referee: String,           // Trọng tài
  highlights: ObjectId,      // Reference tới Highlight
  viewCount: Number,         // Lượt xem
  description: String,
  createdAt: Date,
  updatedAt: Date
}
```

### 4. Event (Sự Kiện Trực Tiếp)
```javascript
{
  _id: ObjectId,
  matchId: ObjectId,         // Reference tới Match
  title: String,             // "Ngoại Hạng Anh Vòng 25"
  type: String,              // "live", "upcoming", "replay"
  postImage: String,         // URL ảnh quảng cáo
  description: String,
  eventDate: Date,
  eventTime: String,         // "20:00"
  status: String,            // "live", "coming_soon", "finished"
  isLive: Boolean,
  viewers: Number,           // Số người xem live
  timeTillStart: String,     // "Trong 2 tiếng", "Trong 4 tiếng"
  viewCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### 5. Highlight (Video Nổi Bật)
```javascript
{
  _id: ObjectId,
  matchId: ObjectId,         // Reference tới Match
  leagueId: ObjectId,
  title: String,             // "Manchester United vs Liverpool - Highlights"
  slug: String,
  description: String,
  thumbnailImage: String,    // URL image
  videoUrl: String,          // URL video từ Cloudinary
  duration: Number,          // Seconds (342 = 5:42)
  uploadedDate: Date,
  viewCount: Number,
  likes: Number,
  isVip: Boolean,            // Cần VIP để xem?
  goals: [
    {
      player: String,        // "Bruno Fernandes"
      team: String,          // "Manchester United"
      minute: Number,        // 45
      description: String
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔌 API ENDPOINTS

### 1️⃣ LEAGUES (Giải Đấu)

#### GET /api/sports/leagues
**Mô tả:** Lấy danh sách tất cả giải đấu
**Quyền:** Công khai
**Query Params:**
- `status`: active, upcoming, finished (optional)
- `page`: 1 (default)
- `limit`: 10 (default)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f191e810c19729de860ea",
      "name": "Ngoại Hạng Anh",
      "code": "PL",
      "logo": "https://res.cloudinary.com/...",
      "country": "England",
      "season": 2026,
      "matchesPerSeason": 380,
      "teamsCount": 20,
      "createdAt": "2026-01-01"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

#### GET /api/sports/leagues/:id
**Mô tả:** Lấy chi tiết 1 giải đấu
**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f191e810c19729de860ea",
    "name": "Ngoại Hạng Anh",
    "description": "Premier League là giải đấu bóng đá hàng đầu của Anh",
    "logo": "https://...",
    "country": "England",
    "season": 2026,
    "startDate": "2025-08-15",
    "endDate": "2026-05-25",
    "teams": [
      {
        "_id": "...",
        "name": "Manchester United",
        "logo": "..."
      }
    ],
    "stats": {
      "totalMatches": 380,
      "finishedMatches": 145,
      "upcomingMatches": 235
    }
  }
}
```

#### POST /api/sports/admin/leagues
**Mô tả:** Tạo giải đấu mới (Chỉ Admin)
**Quyền:** Admin
**Body:**
```json
{
  "name": "Ngoại Hạng Anh",
  "code": "PL",
  "description": "...",
  "logo": "image_url",
  "country": "England",
  "season": 2026,
  "matchesPerSeason": 380,
  "startDate": "2025-08-15",
  "endDate": "2026-05-25"
}
```

#### PUT /api/sports/admin/leagues/:id
**Mô tả:** Cập nhật giải đấu (Chỉ Admin)
**Body:** Các field cần update

#### DELETE /api/sports/admin/leagues/:id
**Mô tả:** Xóa giải đấu (Chỉ Admin)

---

### 2️⃣ MATCHES (Trận Đấu)

#### GET /api/sports/matches
**Mô tả:** Lấy danh sách trận đấu
**Query Params:**
- `status`: upcoming, live, finished
- `leagueId`: Lọc theo giải đấu
- `page`: 1
- `limit`: 10

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "leagueId": "...",
      "homeTeamName": "Manchester United",
      "awayTeamName": "Liverpool",
      "homeTeamLogo": "...",
      "awayTeamLogo": "...",
      "status": "upcoming",
      "scheduleDate": "2026-04-05",
      "scheduleTime": "20:00",
      "homeScore": null,
      "awayScore": null,
      "round": 25,
      "stadium": "Old Trafford",
      "viewCount": 123456
    }
  ],
  "pagination": {...}
}
```

#### GET /api/sports/matches/upcoming
**Mô tả:** Lấy trận đấu sắp tới (tối đa 10 trận)
**Response:** Similar to above, sorted by scheduleDate

#### GET /api/sports/matches/live
**Mô tả:** Lấy trận đấu đang trực tiếp
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "homeTeamName": "Manchester United",
      "awayTeamName": "Liverpool",
      "status": "live",
      "homeScore": 2,
      "awayScore": 1,
      "liveUpdatedAt": "2026-04-05T20:45:30Z",
      "viewers": 234567
    }
  ]
}
```

#### GET /api/sports/matches/:id
**Mô tả:** Lấy chi tiết trận đấu
**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "homeTeamName": "Manchester United",
    "awayTeamName": "Liverpool",
    "homeTeamLogo": "...",
    "awayTeamLogo": "...",
    "status": "finished",
    "scheduleDate": "2026-04-05",
    "scheduleTime": "20:00",
    "homeScore": 3,
    "awayScore": 1,
    "round": 25,
    "stadium": "Old Trafford",
    "referee": "André Marriner",
    "description": "Đây là trận đấu kinh điển giữa 2 đội bóng lớn nhất Anh",
    "highlights": {
      "_id": "...",
      "videoUrl": "...",
      "duration": 342
    },
    "stats": {
      "possession": { home: 60, away: 40 },
      "shots": { home: 15, away: 8 },
      "passes": { home: 680, away: 450 }
    }
  }
}
```

#### POST /api/sports/admin/matches
**Mô tả:** Tạo trận đấu mới (Chỉ Admin)
**Body:**
```json
{
  "leagueId": "...",
  "homeTeamId": "...",
  "awayTeamId": "...",
  "scheduleDate": "2026-04-05",
  "scheduleTime": "20:00",
  "round": 25,
  "stadium": "Old Trafford",
  "description": "..."
}
```

#### PUT /api/sports/admin/matches/:id
**Mô tả:** Cập nhật trận đấu

#### DELETE /api/sports/admin/matches/:id
**Mô tả:** Xóa trận đấu

#### PUT /api/sports/admin/matches/:id/score
**Mô tả:** Cập nhật tỉ số trận đấu
**Body:**
```json
{
  "homeScore": 3,
  "awayScore": 1,
  "status": "finished"
}
```

---

### 3️⃣ EVENTS (Sự Kiện)

#### GET /api/sports/events
**Mô tả:** Lấy danh sách sự kiện
**Query Params:**
- `type`: live, upcoming, replay
- `page`: 1
- `limit`: 10

#### GET /api/sports/events/live
**Mô tả:** Lấy sự kiện đang trực tiếp (tối đa 5)
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "Ngoại Hạng Anh Vòng 25",
      "type": "live",
      "postImage": "...",
      "eventDate": "2026-04-05",
      "eventTime": "20:00",
      "status": "live",
      "isLive": true,
      "viewers": 234567
    }
  ]
}
```

#### GET /api/sports/events/:id
**Mô tả:** Lấy chi tiết sự kiện

#### POST /api/sports/admin/events
**Mô tả:** Tạo sự kiện (Chỉ Admin)

#### DELETE /api/sports/admin/events/:id
**Mô tả:** Xóa sự kiện (Chỉ Admin)

---

### 4️⃣ HIGHLIGHTS (Video Nổi Bật)

#### GET /api/sports/highlights
**Mô tả:** Lấy danh sách video nổi bật
**Query Params:**
- `leagueId`: Lọc theo giải đấu
- `page`: 1
- `limit`: 10
- `sort`: newest, mostViewed, trending

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "Manchester United vs Liverpool - Highlights",
      "thumbnailImage": "...",
      "duration": 342,
      "durationFormatted": "5:42",
      "uploadedDate": "2026-04-05",
      "viewCount": 234567,
      "likes": 12345,
      "leagueName": "Ngoại Hạng Anh"
    }
  ],
  "pagination": {...}
}
```

#### GET /api/sports/highlights/:id
**Mô tả:** Lấy chi tiết video highlight
**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "Manchester United vs Liverpool - Highlights",
    "slug": "manchester-united-vs-liverpool-highlights",
    "description": "...",
    "thumbnailImage": "...",
    "videoUrl": "...",
    "duration": 342,
    "uploadedDate": "2026-04-05",
    "viewCount": 234567,
    "likes": 12345,
    "isVip": false,
    "goals": [
      {
        "player": "Bruno Fernandes",
        "team": "Manchester United",
        "minute": 45,
        "description": "siêu phẩm sút xa"
      }
    ],
    "match": {
      "_id": "...",
      "homeTeamName": "Manchester United",
      "awayTeamName": "Liverpool",
      "homeScore": 3,
      "awayScore": 1
    }
  }
}
```

#### GET /api/sports/highlights/trending
**Mô tả:** Lấy video nổi bật nhất (tối đa 10)

#### POST /api/sports/admin/highlights
**Mô tả:** Upload video highlight (Chỉ Admin)
**Body:** FormData
```
matchId: ObjectId
title: String
description: String
file: Binary (video file)
thumbnailImage: URL
```

#### PUT /api/sports/admin/highlights/:id
**Mô tả:** Cập nhật highlight

#### DELETE /api/sports/admin/highlights/:id
**Mô tả:** Xóa highlight

---

### 5️⃣ TEAMS (Đội Bóng)

#### GET /api/sports/teams
**Mô tása:** Lấy danh sách đội bóng
**Query Params:**
- `leagueId`: Lọc theo giải đấu
- `page`: 1
- `limit`: 20

#### GET /api/sports/teams/:id
**Mô tả:** Lấy chi tiết đội bóng

#### POST /api/sports/admin/teams
**Mô tả:** Tạo đội bóng (Chỉ Admin)

#### PUT /api/sports/admin/teams/:id
**Mô tả:** Cập nhật đội bóng (Chỉ Admin)

#### DELETE /api/sports/admin/teams/:id
**Mô tả:** Xóa đội bóng (Chỉ Admin)

---

## 🔒 AUTHENTICATION & AUTHORIZATION

**Public Routes:**
- GET /api/sports/leagues
- GET /api/sports/leagues/:id
- GET /api/sports/matches
- GET /api/sports/matches/:id
- GET /api/sports/matches/upcoming
- GET /api/sports/matches/live
- GET /api/sports/events
- GET /api/sports/events/:id
- GET /api/sports/events/live
- GET /api/sports/highlights
- GET /api/sports/highlights/:id
- GET /api/sports/highlights/trending
- GET /api/sports/teams
- GET /api/sports/teams/:id

**Protected Routes (Cần token):**
- POST /api/sports/highlights/:id/like
- POST /api/sports/highlights/:id/unlike

**Admin Routes (Cần token + role=admin):**
- POST /api/sports/admin/leagues
- PUT /api/sports/admin/leagues/:id
- DELETE /api/sports/admin/leagues/:id
- POST /api/sports/admin/matches
- PUT /api/sports/admin/matches/:id
- DELETE /api/sports/admin/matches/:id
- PUT /api/sports/admin/matches/:id/score
- POST /api/sports/admin/events
- DELETE /api/sports/admin/events/:id
- POST /api/sports/admin/highlights
- PUT /api/sports/admin/highlights/:id
- DELETE /api/sports/admin/highlights/:id
- POST /api/sports/admin/teams
- PUT /api/sports/admin/teams/:id
- DELETE /api/sports/admin/teams/:id

---

## 📝 ERROR RESPONSES

```json
{
  "success": false,
  "message": "Error message",
  "code": "ERROR_CODE"
}
```

**Common Error Codes:**
- `INVALID_INPUT` - 400
- `UNAUTHORIZED` - 401
- `FORBIDDEN` - 403
- `NOT_FOUND` - 404
- `DUPLICATE_ENTRY` - 409
- `SERVER_ERROR` - 500

---

## 📊 PAGINATION

Tất cả list endpoints dùng standard pagination:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 🔄 FILTERING & SORTING

**Filters:**
- `status`: upcoming, live, finished
- `leagueId`: Filter by league
- `type`: live, upcoming, replay
- `isVip`: true, false

**Sorting:**
- `sort=newest` - Mới nhất trước
- `sort=mostViewed` - Lượt xem cao nhất
- `sort=trending` - Xu hướng
- `sort=-createdAt` - Desc by date

---

## ⏱️ RATE LIMITING

- Public endpoints: 100 requests/minute
- Authenticated endpoints: 200 requests/minute
- Admin endpoints: 50 requests/minute

---

## 📱 RESPONSE FORMAT

**Success:**
```json
{
  "success": true,
  "data": {...},
  "message": "Success message"
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error message",
  "code": "ERROR_CODE",
  "error": {} // Chỉ trong development
}
```

---

## 🚀 DEPLOYMENT

**Development:** `http://localhost:5000/api/sports`
**Production:** `https://api.fptplay.com/api/sports`

---

## 📚 REFERENCES

- Mongoose Docs: https://mongoosejs.com
- Express Docs: https://expressjs.com
- JWT: https://jwt.io
- Cloudinary: https://cloudinary.com
