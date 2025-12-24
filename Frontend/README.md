# Frontend Application

This folder contains the Angular frontend application for News Adda India.

## Structure

```
Frontend/
├── src/
│   ├── app/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components (including admin pages)
│   │   ├── services/      # Angular services
│   │   └── ui/            # UI components
│   ├── assets/            # Static assets (images, videos)
│   ├── environments/      # Environment configurations
│   └── styles.css        # Global styles
├── angular.json           # Angular CLI configuration
├── package.json           # Frontend dependencies
└── tsconfig.json          # TypeScript configuration
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Update `src/environments/environment.ts` with your backend API URL:
```typescript
export const environment = {
  production: false,
  newsApiKey: '',
  apiUrl: 'http://localhost:3000' // Backend API URL
};
```

3. Start the development server:
```bash
npm start
# or
ng serve
```

4. Build for production:
```bash
npm run build
```

## Port

Default port: 4200

## Admin Pages

Admin pages are located in `src/app/pages/admin/`:
- `/admin` - Admin dashboard
- `/admin/create` - Create new post
- `/admin/review` - Review unpublished posts
- `/admin/review-live` - Review live posts
- `/admin/edit/:id` - Edit pending post
- `/admin/edit-live/:id` - Edit live post

