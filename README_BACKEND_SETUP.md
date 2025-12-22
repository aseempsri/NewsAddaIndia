# Backend Setup Guide

This guide will help you set up the backend server for News Adda India.

## Prerequisites

1. **Node.js** (v14 or higher)
2. **MongoDB** (v4.4 or higher)

## Installation Steps

### 1. Install MongoDB

#### Windows:
- Download MongoDB from https://www.mongodb.com/try/download/community
- Install and start MongoDB service

#### macOS:
```bash
brew install mongodb-community
brew services start mongodb-community
```

#### Linux:
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

### 2. Install Backend Dependencies

Navigate to the `backend` directory:
```bash
cd backend
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the `backend` directory:
```bash
PORT=3000
MONGODB_URI=mongodb://localhost:27017/newsaddaindia
JWT_SECRET=your-secret-key-change-in-production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
```

### 4. Start the Backend Server

```bash
npm start
```

For development (with auto-reload):
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Frontend Configuration

Update `src/environments/environment.ts` with your backend URL:
```typescript
export const environment = {
  production: false,
  newsApiKey: '',
  apiUrl: 'http://localhost:3000' // Backend API URL
};
```

For production, update `src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  newsApiKey: 'NEWSAPI_KEY_PLACEHOLDER',
  apiUrl: 'https://your-backend-url.com' // Your production backend URL
};
```

## Testing the Backend

1. Health check: `http://localhost:3000/health`
2. Get stats: `http://localhost:3000/api/stats`
3. Get news: `http://localhost:3000/api/news`

## Admin Panel

1. Start the Angular frontend: `npm start`
2. Navigate to `http://localhost:4200/admin`
3. Login with:
   - Username: `admin`
   - Password: `admin`

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod --version`
- Check if MongoDB service is started
- Verify `MONGODB_URI` in `.env` file

### Port Already in Use
- Change `PORT` in `.env` file
- Or stop the process using port 3000

### Image Upload Issues
- Ensure `uploads/` directory exists in backend folder
- Check file permissions
- Verify image file size (max 10MB)

