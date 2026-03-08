# Push Notification Setup (Self-hosted Web Push)

When the admin checks "Push Notification in English" and/or "Push Notification in Hindi" while creating or editing a post, push notification(s) are sent to all subscribed users. Select one or both languages. **No Firebase or third-party services** – fully self-hosted using the Web Push Protocol.

## How it works

1. **Users subscribe** – Click the bell icon (before language toggle), grant permission
2. **Subscription stored** – Backend saves the subscription in MongoDB
3. **Admin publishes** – When "Push Notification" is checked and post is published, backend sends to all stored subscriptions

## Backend setup

### 1. Install dependency

```bash
cd backend
npm install web-push
```

### 2. Generate VAPID keys (one-time)

```bash
npx web-push generate-vapid-keys
```

You'll get output like:
```
Public Key: BNx...
Private Key: ...
```

### 3. Set environment variables

Add to your `.env` or server environment:

```bash
VAPID_PUBLIC_KEY=BNx...your_public_key...
VAPID_PRIVATE_KEY=...your_private_key...
```

Optional (for correct notification links and article images). If comma-separated (e.g. for CORS), only the first URL is used for notification links:

```bash
FRONTEND_URL=https://newsaddaindia.com
# or comma-separated for CORS (first URL used for links):
FRONTEND_URL=https://newsaddaindia.com,https://www.newsaddaindia.com
```

### 4. Restart backend

The push service initializes on first use. No extra setup needed.

## Frontend

The bell icon in the header is shown when:
- Browser supports push (Chrome, Firefox, Edge, Safari 16+)
- Service worker is registered
- Backend returns a valid VAPID public key

If push is not configured on the backend, the button is hidden or shows an error when clicked.

## Service worker

The app includes `push-sw.js` which:
- Listens for push events
- Displays the notification with title, body, article image, and link
- Opens the article when the user clicks the notification

Notifications include the article's main image when available. Admin can choose to send in English, Hindi, or both.

## Stale subscriptions

When a subscription expires (e.g. user cleared browser data), the backend automatically removes it when a send fails with 410/404.

## Security

- VAPID keys authenticate your server to push services (Mozilla, Google, etc.)
- Subscriptions are stored in your MongoDB – no third party has access
- Each subscription is unique per browser/device
