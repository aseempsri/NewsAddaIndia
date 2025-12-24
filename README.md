# News Adda India

A comprehensive news portal with English-Hindi translation support, admin panel, and real-time news updates.

## Project Structure

This project is organized into three main folders:

### 📁 Backend/
Contains the Node.js/Express backend API server with MongoDB integration.

**Key Features:**
- RESTful API for news management
- Admin authentication (JWT)
- Image upload and processing
- MongoDB database integration

**Setup:** See [Backend/README.md](Backend/README.md)

### 📁 Frontend/
Contains the Angular frontend application.

**Key Features:**
- Responsive news portal
- English-Hindi language toggle
- Admin panel for content management
- Real-time news updates
- Category-based news filtering

**Setup:** See [Frontend/README.md](Frontend/README.md)

### 📁 admin/
Contains admin-specific backend routes and middleware.

**Key Features:**
- Admin authentication routes
- Protected admin endpoints
- Admin middleware

**Setup:** See [admin/README.md](admin/README.md)

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Angular CLI (v18 or higher)

### Backend Setup
```bash
cd Backend
npm install
# Create .env file with MongoDB URI and other configs
npm start
```

### Frontend Setup
```bash
cd Frontend
npm install
npm start
```

## Environment Variables

### Backend (.env)
```
MONGODB_URI=your_mongodb_connection_string
PORT=3000
FRONTEND_URL=http://localhost:4200
JWT_SECRET=your_jwt_secret_key
```

### Frontend (src/environments/environment.ts)
```typescript
export const environment = {
  production: false,
  newsApiKey: '',
  apiUrl: 'http://localhost:3000'
};
```

## Features

- 🌐 **Bilingual Support**: English-Hindi translation for all content
- 📱 **Responsive Design**: Mobile-first approach
- 🔐 **Admin Panel**: Complete content management system
- 📰 **Real-time News**: Latest news from multiple sources
- 🎨 **Modern UI**: Tailwind CSS with custom components
- 🔍 **Category Filtering**: News organized by categories

## Development

- Backend runs on: `http://localhost:3000`
- Frontend runs on: `http://localhost:4200`

## License

ISC
