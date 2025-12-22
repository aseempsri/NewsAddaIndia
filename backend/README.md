# News Adda India Backend

Backend API server for News Adda India application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (copy from `.env.example`):
```bash
PORT=3000
MONGODB_URI=mongodb://localhost:27017/newsaddaindia
JWT_SECRET=your-secret-key-change-in-production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
```

3. Make sure MongoDB is running on your system.

4. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login (username: admin, password: admin)
- `GET /api/auth/verify` - Verify token

### News
- `GET /api/news` - Get all news (query params: category, page, limit, published)
- `GET /api/news/:id` - Get single news article
- `POST /api/news` - Create news (Admin only, requires authentication)
- `PUT /api/news/:id` - Update news (Admin only)
- `DELETE /api/news/:id` - Delete news (Admin only)

### Stats
- `GET /api/stats` - Get reader count
- `POST /api/stats/increment` - Increment reader count

## Admin Panel

Access the admin panel at `/admin` route in the frontend application.

Default credentials:
- Username: `admin`
- Password: `admin`

## Image Upload

Images are automatically resized to 800x600px and stored in the `uploads/` directory. Images are accessible at `/uploads/filename`.

## Database

The application uses MongoDB with two collections:
- `news` - Stores news articles
- `stats` - Stores reader count statistics

