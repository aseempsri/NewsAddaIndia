# Admin Module

This folder contains admin-specific documentation and configuration references.

## Admin Functionality

The admin functionality is distributed across the project:

### Frontend Admin Pages
**Location:** `Frontend/src/app/pages/admin/`

Admin pages are part of the Angular application:
- `/admin` - Admin dashboard
- `/admin/create` - Create new post
- `/admin/review` - Review unpublished posts  
- `/admin/review-live` - Review live posts
- `/admin/edit/:id` - Edit pending post
- `/admin/edit-live/:id` - Edit live post

### Backend Admin Routes
**Location:** `Backend/routes/auth.js` and `Backend/middleware/auth.js`

Admin authentication and protected routes:
- `POST /api/auth/login` - Admin login
- Protected routes require JWT token authentication
- Admin middleware validates admin access

## Admin Features

- ✅ Content Management (Create, Edit, Delete posts)
- ✅ Review and Approve AI-generated posts
- ✅ Manage published posts
- ✅ Image upload and processing
- ✅ Category management
- ✅ Breaking news management

## Access

1. Navigate to: `http://localhost:4200/admin`
2. Login with admin credentials (configured in Backend `.env`)

## Configuration

Admin credentials are configured in `Backend/.env`:
```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
JWT_SECRET=your-secret-key
```

**Important:** Change default credentials in production!
