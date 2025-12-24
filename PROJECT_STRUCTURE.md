# Project Structure Guide

This document explains the new three-folder structure of the News Adda India project.

## Folder Structure

```
NewsAddaIndia/
├── Backend/          # Backend API Server
├── Frontend/         # Angular Frontend Application
├── admin/            # Admin-specific configurations and documentation
└── README.md         # Main project README
```

## Backend/

**Location:** `Backend/`

**Contents:**
- Node.js/Express API server
- MongoDB models and schemas
- API routes (news, auth, stats, pendingNews)
- Middleware (authentication)
- Upload handling
- Server configuration

**Key Files:**
- `server.js` - Main server entry point
- `package.json` - Backend dependencies
- `routes/` - API route handlers
- `models/` - MongoDB schemas
- `middleware/` - Authentication middleware

**To Run:**
```bash
cd Backend
npm install
npm start
```

## Frontend/

**Location:** `Frontend/`

**Contents:**
- Angular application
- All UI components
- Pages (including admin pages)
- Services
- Assets (images, videos)
- Configuration files

**Key Files:**
- `src/` - Source code
- `angular.json` - Angular CLI configuration
- `package.json` - Frontend dependencies
- `tsconfig.json` - TypeScript configuration

**Admin Pages Location:**
- `Frontend/src/app/pages/admin/` - All admin pages are here

**To Run:**
```bash
cd Frontend
npm install
npm start
```

## admin/

**Location:** `admin/`

**Contents:**
- Admin-specific documentation
- Admin configuration references
- Admin setup guides

**Note:** Admin backend routes are in `Backend/routes/` and admin frontend pages are in `Frontend/src/app/pages/admin/`. This folder serves as documentation and reference for admin functionality.

## Migration Notes

### Path Changes

1. **Backend API URL:**
   - Frontend should point to: `http://localhost:3000`
   - Update `Frontend/src/environments/environment.ts`

2. **Import Paths:**
   - All imports within Frontend remain relative to `src/`
   - No changes needed to component imports

3. **Asset Paths:**
   - Assets remain in `Frontend/src/assets/`
   - No changes needed

### Running the Application

1. **Start Backend:**
   ```bash
   cd Backend
   npm install
   npm start
   ```

2. **Start Frontend:**
   ```bash
   cd Frontend
   npm install
   npm start
   ```

3. **Access:**
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:3000
   - Admin Panel: http://localhost:4200/admin

## Important Notes

- Each folder has its own `package.json` and `node_modules`
- Backend and Frontend are independent applications
- Admin functionality is split:
  - Frontend admin pages: `Frontend/src/app/pages/admin/`
  - Backend admin routes: `Backend/routes/auth.js` and `Backend/middleware/auth.js`

