# 🌱 Sports Module - Seed Data & Testing Guide

## ✅ Overview

You now have realistic sample data to test all 26 Sports API endpoints!

---

## 🚀 How to Create Sample Data

### Step 1: Navigate to Backend Directory
```bash
cd d:\webxemphim-backend
```

### Step 2: Run Seed Script
```bash
node seeds/sportsSeed.js
```

### Expected Output
```
🌱 Starting Sports Module Database Seeding...

✅ MongoDB connected
🧹 Clearing collections...
✅ Collections cleared

📋 Seeding leagues...
✅ Created 5 leagues

🏟️ Seeding teams...
✅ Created 50 teams

⚽ Seeding matches...
✅ Created 100 matches

🔴 Seeding live events...
✅ Created 10 live events

▶️ Seeding highlight videos...
✅ Created 50 highlight videos

✨ Seeding completed successfully!

📊 Summary:
   - Leagues: 5
   - Total Teams: 50
   - Total Matches: 100
   - Total Highlight Videos: 50
   - Live Events: Created for live matches

🚀 Ready to test your API endpoints!
```

---

## 📊 Sample Data Created

| Collection | Count | Details |
|-----------|-------|---------|
| **leagues** | 5 | PL, La Liga, Serie A, Bundesliga, Ligue 1 |
| **teams** | 50 | 10 teams per league (Real Madrid, Man City, etc) |
| **matches** | 100 | 20 matches per league with realistic stats |
| **events** | 10 | Live events for current live matches |
| **highlights** | 50 | Post-match highlight videos with goals |

---

## 🧪 Testing All 26 Endpoints

### Terminal 1: Start Your Server
```bash
cd d:\webxemphim-backend
npm run dev
```

Wait for: `✅ Server running on port 5000`

### Terminal 2: Run API Tests

#### 1️⃣ Test Public League Endpoints (No Auth)

```bash
# Get all leagues
curl http://localhost:5000/api/sports/leagues

# Get specific league
curl http://localhost:5000/api/sports/leagues/[LEAGUE_ID]
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f191e810c19729de860ea",
      "name": "Ngoại Hạng Anh",
      "code": "PL",
      "country": "England",
      "season": "2025-2026",
      "status": "active"
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

#### 2️⃣ Test Public Match Endpoints

```bash
# Get all matches
curl http://localhost:5000/api/sports/matches

# Get upcoming matches
curl http://localhost:5000/api/sports/matches/upcoming

# Get live matches
curl http://localhost:5000/api/sports/matches/live

# Get specific match
curl http://localhost:5000/api/sports/matches/[MATCH_ID]
```

#### 3️⃣ Test Public Event Endpoints

```bash
# Get all events
curl http://localhost:5000/api/sports/events

# Get live events (should show current live broadcasts)
curl http://localhost:5000/api/sports/events/live

# Get specific event
curl http://localhost:5000/api/sports/events/[EVENT_ID]
```

#### 4️⃣ Test Public Highlight Endpoints

```bash
# Get all highlights
curl http://localhost:5000/api/sports/highlights

# Get trending highlights (most viewed)
curl http://localhost:5000/api/sports/highlights/trending

# Get specific highlight
curl http://localhost:5000/api/sports/highlights/[HIGHLIGHT_ID]
```

---

## 🔐 Testing Protected Endpoints (Need JWT Token)

### Get Authentication Token First

```bash
# Login to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"user@example.com\",\"password\":\"123456\"}"
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Copy the token and use for protected routes:

```bash
# Set token as variable (PowerShell)
$TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Like a highlight
curl -X POST http://localhost:5000/api/sports/highlights/[HIGHLIGHT_ID]/like \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Unlike a highlight
curl -X POST http://localhost:5000/api/sports/highlights/[HIGHLIGHT_ID]/unlike \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

---

## 👨‍💼 Testing Admin Endpoints (Need Admin Token)

### Get Admin Token
```bash
# Login with admin account (if exists)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@example.com\",\"password\":\"123456\"}"
```

### Create New League (Admin Only)
```bash
$ADMIN_TOKEN = "your_admin_token_here"

curl -X POST http://localhost:5000/api/sports/admin/leagues \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Série A (Brazil)",
    "code": "BR",
    "country": "Brazil",
    "season": "2025-2026",
    "status": "active"
  }'
```

### Create New Match (Admin Only)
```bash
curl -X POST http://localhost:5000/api/sports/admin/matches \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "leagueId": "[LEAGUE_ID]",
    "homeTeamId": "[TEAM_ID_1]",
    "awayTeamId": "[TEAM_ID_2]",
    "scheduleDate": "2026-04-10T15:00:00Z",
    "status": "upcoming"
  }'
```

### Update Match Score (Admin Only)
```bash
curl -X PUT http://localhost:5000/api/sports/admin/matches/[MATCH_ID]/score \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "homeScore": 2,
    "awayScore": 1,
    "status": "finished"
  }'
```

### Create Event (Admin)
```bash
curl -X POST http://localhost:5000/api/sports/admin/events \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Live Commentary: Man City vs Liverpool",
    "matchId": "[MATCH_ID]",
    "eventDate": "2026-04-10T15:00:00Z",
    "status": "live"
  }'
```

### Delete Highlight (Admin)
```bash
curl -X DELETE http://localhost:5000/api/sports/admin/highlights/[HIGHLIGHT_ID] \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 📱 Using Postman (Alternative to cURL)

### Import Collection

1. Open Postman
2. Click **Import**
3. Create requests for each endpoint:

**Example Request:**
```
GET http://localhost:5000/api/sports/leagues
```

**Headers:**
```
Authorization: Bearer [YOUR_TOKEN]
Content-Type: application/json
```

---

## 🔍 Verify Data in MongoDB

### Check With MongoDB Compass

1. **Connect to MongoDB**: `mongodb://localhost:27017`
2. **Database**: `webxemphim`
3. **Collections**:
   - `leagues` - 5 documents
   - `teams` - 50 documents
   - `matches` - 100 documents
   - `events` - 10 documents
   - `highlights` - 50 documents

### Or Use MongoDB CLI

```bash
# Connect
mongosh

# Use database
use webxemphim

# Check leagues
db.leagues.find()

# Check teams
db.teams.find().limit(5)

# Check matches
db.matches.find().limit(5)

# Check live matches
db.matches.find({ status: "live" })

# Count documents
db.leagues.countDocuments()
db.teams.countDocuments()
db.matches.countDocuments()
```

---

## 🧹 Reset/Clear Data

If you want to restart with fresh data:

```bash
# Run seed again (it will clear old data first)
node seeds/sportsSeed.js
```

Or manually clear collections:

```bash
mongosh
use webxemphim
db.leagues.deleteMany({})
db.teams.deleteMany({})
db.matches.deleteMany({})
db.events.deleteMany({})
db.highlights.deleteMany({})
```

---

## 📋 Sample Data Details

### Leagues (5 Total)
- ✅ Ngoại Hạng Anh (England) - 10 teams
- ✅ La Liga (Spain) - 10 teams
- ✅ Serie A (Italy) - 10 teams
- ✅ Bundesliga (Germany) - 10 teams (placeholder)
- ✅ Ligue 1 (France) - 10 teams (placeholder)

### Teams Sample (Real Data)
```javascript
{
  name: "Manchester City",
  logo: "https://via.placeholder.com/100?text=Man+City",
  leagueId: ObjectId("..."),
  country: "England",
  stadium: "Etihad Stadium",
  coach: "Pep Guardiola",
  stats: {
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0
  }
}
```

### Matches Sample (Random Data)
```javascript
{
  leagueId: ObjectId("..."),
  homeTeamId: ObjectId("..."),
  awayTeamId: ObjectId("..."),
  scheduleDate: ISODate("2026-04-10T15:00:00Z"),
  homeScore: 2,
  awayScore: 1,
  status: "finished",  // upcoming, live, finished
  liveViewers: 250000,
  stats: {
    homeTeam: { possession: 58, shots: 15, passes: 450 },
    awayTeam: { possession: 42, shots: 8, passes: 380 }
  }
}
```

### Highlights Sample
```javascript
{
  title: "Match Highlights",
  duration: 180,  // seconds
  videoUrl: "https://via.placeholder.com/...",
  matchId: ObjectId("..."),
  leagueId: ObjectId("..."),
  viewCount: 250000,
  likes: 15000,
  goals: [
    { playerName: "Player A", minute: 45, teamId: ObjectId("...") },
    { playerName: "Player B", minute: 67, teamId: ObjectId("...") }
  ],
  isVip: false
}
```

---

## ✅ API Endpoint Checklist

### Public Endpoints ✅
- [ ] GET /api/sports/leagues
- [ ] GET /api/sports/leagues/:id
- [ ] GET /api/sports/matches
- [ ] GET /api/sports/matches/upcoming
- [ ] GET /api/sports/matches/live
- [ ] GET /api/sports/matches/:id
- [ ] GET /api/sports/events
- [ ] GET /api/sports/events/live
- [ ] GET /api/sports/events/:id
- [ ] GET /api/sports/highlights
- [ ] GET /api/sports/highlights/trending
- [ ] GET /api/sports/highlights/:id

### Protected Endpoints ✅
- [ ] POST /api/sports/highlights/:id/like
- [ ] POST /api/sports/highlights/:id/unlike

### Admin Endpoints ✅
- [ ] POST /api/sports/admin/leagues
- [ ] PUT /api/sports/admin/leagues/:id
- [ ] DELETE /api/sports/admin/leagues/:id
- [ ] POST /api/sports/admin/matches
- [ ] PUT /api/sports/admin/matches/:id/score
- [ ] DELETE /api/sports/admin/matches/:id
- [ ] POST /api/sports/admin/events
- [ ] DELETE /api/sports/admin/events/:id
- [ ] POST /api/sports/admin/highlights
- [ ] DELETE /api/sports/admin/highlights/:id

---

## 🐛 Troubleshooting

### Issue: MongoDB Connection Error
```
❌ MongoDB connection failed: connect ECONNREFUSED
```

**Solution:**
1. Make sure MongoDB is running: `mongod`
2. Check MongoDB URI in `.env` file
3. Verify MongoDB service is active on Windows

### Issue: Script Hangs
**Solution:** Press `Ctrl+C` to stop and check logs for errors

### Issue: Duplicate Key Error
**Solution:** Run seed again (it clears old data first)

### Issue: Port 5000 Already in Use
```
❌ Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:**
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill it (replace PID)
taskkill /PID [PID] /F
```

---

## 🎯 Next Steps

1. ✅ **Run seed script** → `node seeds/sportsSeed.js`
2. ✅ **Start server** → `npm run dev`
3. ✅ **Test all endpoints** → Use curl/Postman
4. ✅ **Integrate with frontend** → Update `frontend/src/services/api.js`
5. ✅ **Render data** → Update `frontend/src/pages/sports.html`

---

## 💡 Need Help?

Documents to reference:
- `docs/SPORTS_API_SPEC.md` - Full endpoint specifications
- `docs/SPORTS_INTEGRATION_GUIDE.md` - Integration details
- `docs/SPORTS_ARCHITECTURE.md` - Architecture overview

---

**Status:** ✅ Ready for Testing!  
**Created:** April 3, 2026
