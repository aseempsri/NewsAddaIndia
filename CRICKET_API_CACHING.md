# Cricket API Caching Implementation

## Overview

This implementation uses a **backend caching service** to reduce API hits and improve performance. Instead of each user hitting the CricAPI directly, a single backend service fetches data every 2 minutes and stores it in MongoDB. All users then fetch from the database.

## Architecture

```
┌─────────────┐
│   Users     │
│  (Frontend) │
└──────┬──────┘
       │ GET /api/cricket/matches
       ▼
┌─────────────────┐
│   Backend API   │
│  (Express.js)   │
└──────┬──────────┘
       │ Query MongoDB
       ▼
┌─────────────────┐
│    MongoDB      │
│  (Database)     │
└─────────────────┘
       ▲
       │ Update every 2 min
       │
┌─────────────────┐
│ Cricket Service │
│  (Scheduled)    │
└──────┬──────────┘
       │ GET https://api.cricapi.com/...
       ▼
┌─────────────────┐
│    CricAPI      │
│  (External API) │
└─────────────────┘
```

## Benefits

✅ **Massive API Hit Reduction**: 
- Before: N users × 1 API call every 2 min = N calls every 2 min
- After: 1 API call every 2 min (regardless of user count)
- **Example**: With 1000 users, saves 999 API calls every 2 minutes!

✅ **Better Rate Limit Management**: 
- Single point of control for API calls
- Easier to manage API quotas

✅ **Faster Response Times**: 
- Database queries are faster than external API calls
- Reduced latency for users

✅ **More Reliable**: 
- If CricAPI is temporarily down, cached data still available
- Better error handling and fallback

✅ **Cost Savings**: 
- Reduces API usage costs significantly
- Better for API plans with usage limits

## Implementation Details

### Backend Components

1. **Model**: `backend/models/CricketMatch.js`
   - MongoDB schema for storing cricket matches
   - Indexes for fast queries
   - Auto-cleanup of old matches (7+ days)

2. **Service**: `backend/services/cricket.service.js`
   - Fetches data from CricAPI every 2 minutes
   - Updates MongoDB with latest match data
   - Handles errors gracefully
   - Prevents concurrent fetches

3. **Route**: `backend/routes/cricket.js`
   - `GET /api/cricket/matches` - Get all matches from DB
   - `GET /api/cricket/matches/:matchId` - Get single match
   - `GET /api/cricket/status` - Get service status

4. **Server Integration**: `backend/server.js`
   - Starts cricket service after MongoDB connection
   - Runs automatically on server startup

### Frontend Component

- **Widget**: `Frontend/src/app/components/cricket-score-widget/cricket-score-widget.component.ts`
  - Fetches from backend API instead of direct CricAPI
  - Refreshes every 2 minutes to get latest data
  - Uses `environment.apiUrl` for backend URL

## Setup Instructions

### 1. Backend Setup

**Note**: The API key is hardcoded in `backend/services/cricket.service.js`. No environment variable configuration needed.

**Note**: The system uses a **single document** approach. All matches are stored in one document that gets updated on each API call. This ensures:
- Only one document exists in the collection
- Same document ID (`_id`) is reused on every update
- No document proliferation
- Efficient storage and retrieval

### 2. Install Dependencies

Backend dependencies are already installed (axios, mongoose, node-cron).

### 3. Start Backend Server

```bash
cd backend
npm start
```

The cricket service will automatically start and begin fetching data every 2 minutes.

### 4. Frontend Configuration

The frontend is already configured to use `environment.apiUrl`. Make sure your environment files are set:

**Development** (`environment.ts`):
```typescript
apiUrl: 'http://localhost:3000'
```

**Production** (`environment.prod.ts`):
```typescript
apiUrl: 'http://72.60.235.158' // or your API domain
```

## API Endpoints

### Get All Matches
```
GET /api/cricket/matches
```

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "match-id",
      "name": "India vs New Zealand",
      "matchType": "t20",
      "status": "Live",
      "teams": ["India", "New Zealand"],
      "score": [...],
      ...
    }
  ],
  "count": 7,
  "lastUpdated": "2026-01-28T10:30:00.000Z"
}
```

### Get Service Status
```
GET /api/cricket/status
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "isRunning": false,
    "lastFetchTime": "2026-01-28T10:30:00.000Z",
    "matchCount": 7,
    "serviceActive": true
  }
}
```

## How It Works

1. **Server Startup**: 
   - Backend connects to MongoDB
   - Cricket service starts automatically
   - Initial fetch happens immediately

2. **Scheduled Refresh**:
   - Every 2 minutes, service fetches from CricAPI
   - Updates the single document in MongoDB (same `_id` every time)
   - Replaces the entire `matches` array with fresh data

3. **User Requests**:
   - Frontend widget calls `/api/cricket/matches`
   - Backend queries MongoDB (fast!)
   - Returns cached data to user

4. **Data Flow**:
   ```
   CricAPI → Backend Service → MongoDB → Backend API → Frontend Widget
   ```

## Monitoring

Check service status:
```bash
curl http://localhost:3000/api/cricket/status
```

Check matches:
```bash
curl http://localhost:3000/api/cricket/matches
```

## Database Collection

- **Collection Name**: `cricketmatches`
- **Structure**: Single document with fixed `dataType: 'currentMatches'`
- **Document Structure**:
  ```javascript
  {
    _id: ObjectId,
    dataType: 'currentMatches', // Fixed identifier
    matches: [ /* array of all matches */ ],
    lastUpdated: Date,
    createdAt: Date,
    updatedAt: Date
  }
  ```
- **Indexes**: 
  - `dataType` (unique, ensures only one document)
  - `lastUpdated` (for tracking updates)
- **Update Strategy**: Every API call updates the same document (same `_id`), replacing the entire `matches` array

## Error Handling

- If CricAPI fails, service logs error but continues running
- Frontend shows cached data if available (from the single document)
- Service retries on next scheduled interval
- The single document persists even if API fails, so users always see the last successful update

## Performance Metrics

**Before (Direct API)**:
- 1000 users = 1000 API calls every 2 min = 30,000 calls/hour
- API rate limit risk: HIGH
- Response time: ~500-1000ms (external API)

**After (Cached)**:
- 1000 users = 1 API call every 2 min = 30 calls/hour
- API rate limit risk: LOW
- Response time: ~50-100ms (database query)
- **99.9% reduction in API calls!**

## Future Enhancements

- Add Redis caching for even faster responses
- Implement WebSocket for real-time updates
- Add match filtering (live only, by type, etc.)
- Add historical match data storage
- Implement API retry logic with exponential backoff
