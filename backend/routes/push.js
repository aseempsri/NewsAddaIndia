const express = require('express');
const PushSubscription = require('../models/PushSubscription');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/push/vapid-public - Public key for client subscription (no auth)
router.get('/vapid-public', (req, res) => {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) {
    return res.status(503).json({ error: 'Push notifications not configured' });
  }
  res.json({ publicKey: key });
});

// POST /api/push/subscribe - Save push subscription (no auth)
router.post('/subscribe', express.json(), async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: 'Invalid subscription: endpoint and keys required' });
    }

    await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        endpoint,
        keys: { p256dh: keys.p256dh, auth: keys.auth },
        userAgent: req.get('user-agent') || ''
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Subscribed successfully' });
  } catch (err) {
    console.error('[Push subscribe] Error:', err);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

// GET /api/push/subscribers/count - Get push notification subscriber count (Admin only)
router.get('/subscribers/count', authenticateAdmin, async (req, res) => {
  try {
    const count = await PushSubscription.countDocuments();
    res.json({ success: true, count });
  } catch (err) {
    console.error('[Push subscribers count] Error:', err);
    res.status(500).json({ error: 'Failed to get subscriber count' });
  }
});

module.exports = router;
