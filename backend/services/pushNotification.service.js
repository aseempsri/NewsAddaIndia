/**
 * Push Notification Service (Self-hosted Web Push / VAPID)
 * Sends push notifications via the Web Push Protocol - no Firebase or third-party services.
 *
 * Setup:
 * 1. npm install web-push
 * 2. Generate VAPID keys: npx web-push generate-vapid-keys
 * 3. Set env: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
 */

const PushSubscription = require('../models/PushSubscription');

let webpush = null;
let initialized = false;

function initialize() {
  if (initialized) return !!webpush;
  try {
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush = require('web-push');
      webpush.setVapidDetails(
        'mailto:support@newsaddaindia.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
      initialized = true;
      console.log('[PushNotification] Initialized with VAPID keys');
      return true;
    }
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.log('[PushNotification] web-push not installed. Run: npm install web-push');
    } else {
      console.warn('[PushNotification] Not configured:', err.message);
    }
  }
  initialized = true;
  return false;
}

/**
 * Get base URL for links (use first URL if FRONTEND_URL is comma-separated)
 */
function getBaseUrl() {
  const raw = process.env.FRONTEND_URL || process.env.SITE_URL || 'https://newsaddaindia.com';
  const first = String(raw).split(',')[0].trim();
  return first.replace(/\/$/, ''); // Remove trailing slash
}

/**
 * Build absolute URL for an image path (e.g. /uploads/foo.jpg)
 */
function getImageUrl(imagePath) {
  if (!imagePath || typeof imagePath !== 'string') return null;
  const base = getBaseUrl();
  const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${base}${path}`;
}

/**
 * Send push notification for a news article to all subscribed users
 * @param {Object} news - News object with title, titleEn, excerpt, excerptEn, image, images, _id, slug
 * @param {Object} options - { pushEn: boolean, pushHi: boolean } - which languages to send
 * @returns {Promise<{ sent: number; failed: number }>}
 */
async function sendPushForNews(news, options = {}) {
  if (!initialize() || !webpush) {
    console.log('[PushNotification] Skipped (not configured):', news?.title?.substring(0, 50));
    return { sent: 0, failed: 0 };
  }
  const { pushEn = true, pushHi = false } = options;
  if (!pushEn && !pushHi) {
    console.log('[PushNotification] Skipped (no language selected)');
    return { sent: 0, failed: 0 };
  }

  try {
    const baseUrl = getBaseUrl();
    const path = news.slug ? `/news/${news.slug}` : `/news/${news._id}`;
    const url = `${baseUrl}${path}`;

    const imageUrl = getImageUrl(news.image || (news.images && news.images[0]));

    const notifications = [];
    if (pushEn) {
      const title = (news.titleEn || news.title || 'New Article').trim().slice(0, 65);
      const body = (news.excerptEn || news.excerpt || '')
        .replace(/<[^>]*>/g, '')
        .trim()
        .slice(0, 120);
      notifications.push({ title: title || 'News Adda India', body: body || 'Read the latest news' });
    }
    if (pushHi) {
      const title = (news.title || 'New Article').trim().slice(0, 65);
      const body = (news.excerpt || '')
        .replace(/<[^>]*>/g, '')
        .trim()
        .slice(0, 120);
      notifications.push({ title: title || 'News Adda India', body: body || 'Read the latest news' });
    }

    const subscriptions = await PushSubscription.find({}).lean();
    if (subscriptions.length === 0) {
      console.log('[PushNotification] No subscribers.');
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    for (const notif of notifications) {
      const payload = JSON.stringify({
        title: notif.title,
        body: notif.body,
        url,
        image: imageUrl,
        id: String(news._id)
      });

      const results = await Promise.allSettled(
        subscriptions.map(sub =>
          webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.keys.p256dh,
                auth: sub.keys.auth
              }
            },
            payload,
            { TTL: 86400 }
          )
        )
      );

      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          sent++;
        } else {
          failed++;
          if (r.reason?.statusCode === 410 || r.reason?.statusCode === 404) {
            PushSubscription.deleteOne({ endpoint: subscriptions[i].endpoint }).catch(() => {});
          }
        }
      });
    }

    console.log('[PushNotification] Sent:', sent, 'Failed:', failed);
    return { sent, failed };
  } catch (err) {
    console.error('[PushNotification] Error:', err.message);
    return { sent: 0, failed: 0 };
  }
}

module.exports = { sendPushForNews, initialize };
