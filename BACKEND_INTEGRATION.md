# Backend Integration Guide

This document explains how the backend integrates with the frontend and how to use the admin panel.

## Architecture Overview

The application now has a **hybrid approach**:
1. **Backend API** (Primary) - Stores admin-created news in MongoDB
2. **External APIs** (Fallback) - NewsData.io and Google News RSS when backend is unavailable

## How It Works

### News Fetching Priority

1. **Backend First**: The frontend tries to fetch news from the backend API
2. **Fallback**: If backend is unavailable, it falls back to external news APIs (NewsData.io/Google News RSS)
3. **Caching**: External API results are cached in localStorage

### Admin Panel

Access the admin panel at: `http://localhost:4200/admin`

**Default Credentials:**
- Username: `admin`
- Password: `admin`

### Adding News via Admin Panel

1. Login with admin credentials
2. Fill in the news form:
   - **Title** (required): Main headline
   - **Title (English)**: Optional English title
   - **Excerpt** (required): Short description
   - **Content**: Full article content (optional)
   - **Category** (required): Select from dropdown (National, International, Sports, etc.)
   - **Tags**: Comma-separated tags (e.g., "breaking, latest, india")
   - **Pages**: Select which pages to display the news on (home, national, international, etc.)
   - **Author**: Author name (defaults to "News Adda India")
   - **Image**: Upload an image (automatically resized to 800x600px)

3. Click "Submit News"
4. The news will immediately be available on the selected pages

### Image Handling

- Images are automatically resized to **800x600px** using Sharp
- Stored in `backend/uploads/` directory
- Accessible at `/uploads/filename`
- Frontend automatically constructs full URL if image path is relative

### Reader Count Tracking

- Each unique visitor (tracked by localStorage, once per day) increments the reader count
- Reader count is displayed in the header
- Count is stored in MongoDB `stats` collection
- API endpoint: `POST /api/stats/increment`

### Page-Based News Display

When admin selects pages (e.g., "home", "national"), the news will appear on:
- **Home page** (`/`): News marked for "home" page
- **Category pages** (`/category/national`): News marked for that category page OR news in that category

The frontend uses:
- `fetchNewsByPage('home')` for home page
- `fetchNewsByCategory('National')` for category pages

## API Endpoints

### Public Endpoints

- `GET /api/news` - Get all published news
  - Query params: `category`, `page`, `limit`, `published`
- `GET /api/news/:id` - Get single news article
- `GET /api/stats` - Get reader count
- `POST /api/stats/increment` - Increment reader count (called automatically)

### Admin Endpoints (Require Authentication)

- `POST /api/news` - Create news article
- `PUT /api/news/:id` - Update news article
- `DELETE /api/news/:id` - Delete news article
- `POST /api/auth/login` - Admin login
- `GET /api/auth/verify` - Verify admin token

## Environment Configuration

### Backend (`backend/.env`)
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/newsaddaindia
JWT_SECRET=your-secret-key-change-in-production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
FRONTEND_URL=http://localhost:4200
```

### Frontend (`src/environments/environment.ts`)
```typescript
export const environment = {
  production: false,
  newsApiKey: '',
  apiUrl: 'http://localhost:3000' // Backend API URL
};
```

## Database Schema

### News Collection
```javascript
{
  title: String (required),
  titleEn: String,
  excerpt: String (required),
  content: String,
  image: String (URL path),
  category: String (enum: National, International, Sports, Business, Entertainment, Health, Politics),
  tags: [String],
  pages: [String] (enum: home, national, international, politics, health, entertainment, sports, business),
  author: String,
  date: Date,
  published: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### Stats Collection
```javascript
{
  readerCount: Number (default: 4320),
  lastUpdated: Date
}
```

## Deployment Notes

1. **Backend**: Deploy to a Node.js hosting service (Heroku, Railway, Render, etc.)
2. **MongoDB**: Use MongoDB Atlas for cloud database
3. **Frontend**: Update `environment.prod.ts` with production backend URL
4. **CORS**: Update `FRONTEND_URL` in backend `.env` for production
5. **Image Storage**: Consider using cloud storage (AWS S3, Cloudinary) for production

## Troubleshooting

### Backend not connecting
- Check MongoDB is running
- Verify `MONGODB_URI` in `.env`
- Check backend logs for connection errors

### Images not loading
- Ensure `uploads/` directory exists in backend
- Check file permissions
- Verify image URL construction in frontend

### Admin login not working
- Check `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env`
- Verify JWT_SECRET is set
- Check browser console for errors

### News not appearing
- Verify news is marked as `published: true`
- Check if correct `pages` are selected
- Verify backend API is accessible from frontend
- Check browser network tab for API errors

