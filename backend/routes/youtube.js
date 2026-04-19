/**
 * YouTube Data API v3 — latest item from the channel "Videos" tab (no Shorts).
 * Uses the system playlist UULF… (undocumented but stable): same order as Videos → Latest, excludes Shorts.
 * Requires YOUTUBE_API_KEY in .env (Google Cloud Console → YouTube Data API v3).
 */
const express = require('express');
const router = express.Router();

const YT_API = 'https://www.googleapis.com/youtube/v3';

function getEnvKey() {
  return (process.env.YOUTUBE_API_KEY || '').trim();
}

function getChannelHandle() {
  return (process.env.YOUTUBE_CHANNEL_HANDLE || 'newsaddaindialive').replace(/^@/, '').trim();
}

/** "Videos" tab playlist: public uploads minus Shorts (and not live tab). Prefix UULF + channel id without UC. */
function videosTabPlaylistId(channelId) {
  if (!channelId || typeof channelId !== 'string' || !channelId.startsWith('UC') || channelId.length < 3) {
    return null;
  }
  return `UULF${channelId.slice(2)}`;
}

/** Shorts-only playlist for the channel; used to filter uploads when UULF is empty. */
function shortsPlaylistId(channelId) {
  if (!channelId || typeof channelId !== 'string' || !channelId.startsWith('UC') || channelId.length < 3) {
    return null;
  }
  return `UUSH${channelId.slice(2)}`;
}

async function fetchJson(url) {
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) {
    const msg = data.error.message || 'YouTube API error';
    const err = new Error(msg);
    err.status = data.error.code === 403 ? 403 : 502;
    throw err;
  }
  return data;
}

/**
 * Resolve channel id (UC…) and uploads playlist id for handle / search fallback.
 */
async function resolveChannelContext(apiKey, handle) {
  let url = `${YT_API}/channels?part=id,contentDetails&forHandle=${encodeURIComponent(handle)}&key=${encodeURIComponent(apiKey)}`;
  let json = await fetchJson(url);
  let item = json.items?.[0];
  if (item?.id) {
    return {
      channelId: item.id,
      uploadsPlaylistId: item.contentDetails?.relatedPlaylists?.uploads || null
    };
  }

  url = `${YT_API}/search?part=snippet&type=channel&maxResults=3&q=${encodeURIComponent(handle)}&key=${encodeURIComponent(apiKey)}`;
  json = await fetchJson(url);
  const ch = json.items?.find((i) => i.id?.kind === 'youtube#channel') || json.items?.[0];
  const channelId = ch?.id?.channelId || ch?.snippet?.channelId;
  if (!channelId) {
    return { channelId: null, uploadsPlaylistId: null };
  }

  url = `${YT_API}/channels?part=contentDetails&id=${encodeURIComponent(channelId)}&key=${encodeURIComponent(apiKey)}`;
  json = await fetchJson(url);
  item = json.items?.[0];
  return {
    channelId,
    uploadsPlaylistId: item?.contentDetails?.relatedPlaylists?.uploads || null
  };
}

/**
 * Collect video ids from a playlist (paginate; cap pages to avoid quota spikes).
 */
async function collectPlaylistVideoIds(apiKey, playlistId, maxPages = 8) {
  const ids = new Set();
  let pageToken = '';
  for (let p = 0; p < maxPages; p += 1) {
    let url = `${YT_API}/playlistItems?part=contentDetails&playlistId=${encodeURIComponent(playlistId)}&maxResults=50&key=${encodeURIComponent(apiKey)}`;
    if (pageToken) {
      url += `&pageToken=${encodeURIComponent(pageToken)}`;
    }
    const json = await fetchJson(url);
    for (const row of json.items || []) {
      const id = row.contentDetails?.videoId;
      if (id && /^[\w-]{11}$/.test(id)) {
        ids.add(id);
      }
    }
    pageToken = json.nextPageToken;
    if (!pageToken) {
      break;
    }
  }
  return ids;
}

/**
 * Walk playlist order; pick first embeddable standard VOD (not live / upcoming).
 */
async function firstEmbeddableVodFromPlaylist(apiKey, playlistId) {
  const plUrl = `${YT_API}/playlistItems?part=snippet,contentDetails&playlistId=${encodeURIComponent(playlistId)}&maxResults=50&key=${encodeURIComponent(apiKey)}`;
  const pl = await fetchJson(plUrl);
  const rows = pl.items || [];
  const orderedIds = [];
  for (const row of rows) {
    const id = row.contentDetails?.videoId || row.snippet?.resourceId?.videoId;
    if (id && /^[\w-]{11}$/.test(id)) {
      orderedIds.push(id);
    }
  }
  if (orderedIds.length === 0) {
    return null;
  }

  const idParam = orderedIds.map(encodeURIComponent).join(',');
  const vidUrl = `${YT_API}/videos?part=snippet,status&id=${idParam}&key=${encodeURIComponent(apiKey)}`;
  const vjson = await fetchJson(vidUrl);
  const byId = new Map((vjson.items || []).map((v) => [v.id, v]));

  for (const videoId of orderedIds) {
    const v = byId.get(videoId);
    if (!v) {
      continue;
    }
    const title = v.snippet?.title || '';
    const live = v.snippet?.liveBroadcastContent;
    const embeddable = v.status?.embeddable;
    if (embeddable === false) {
      continue;
    }
    if (live && live !== 'none') {
      continue;
    }
    return { videoId, title };
  }
  return null;
}

/**
 * Fallback: full uploads order minus ids that appear in the channel Shorts playlist.
 */
async function firstEmbeddableVodExcludingShortsPlaylist(apiKey, uploadsPlaylistId, channelId) {
  const uush = shortsPlaylistId(channelId);
  if (!uush) {
    return null;
  }
  let shortIds;
  try {
    shortIds = await collectPlaylistVideoIds(apiKey, uush, 10);
  } catch {
    shortIds = new Set();
  }

  const plUrl = `${YT_API}/playlistItems?part=snippet,contentDetails&playlistId=${encodeURIComponent(uploadsPlaylistId)}&maxResults=50&key=${encodeURIComponent(apiKey)}`;
  const pl = await fetchJson(plUrl);
  const rows = pl.items || [];
  const orderedIds = [];
  for (const row of rows) {
    const id = row.contentDetails?.videoId || row.snippet?.resourceId?.videoId;
    if (id && /^[\w-]{11}$/.test(id) && !shortIds.has(id)) {
      orderedIds.push(id);
    }
  }
  if (orderedIds.length === 0) {
    return null;
  }

  const idParam = orderedIds.map(encodeURIComponent).join(',');
  const vidUrl = `${YT_API}/videos?part=snippet,status&id=${idParam}&key=${encodeURIComponent(apiKey)}`;
  const vjson = await fetchJson(vidUrl);
  const byId = new Map((vjson.items || []).map((v) => [v.id, v]));

  for (const videoId of orderedIds) {
    const v = byId.get(videoId);
    if (!v) {
      continue;
    }
    const title = v.snippet?.title || '';
    const live = v.snippet?.liveBroadcastContent;
    const embeddable = v.status?.embeddable;
    if (embeddable === false) {
      continue;
    }
    if (live && live !== 'none') {
      continue;
    }
    return { videoId, title };
  }
  return null;
}

async function resolveLatestVideo(apiKey, handle) {
  const ctx = await resolveChannelContext(apiKey, handle);
  if (!ctx.channelId) {
    return null;
  }

  const vTab = videosTabPlaylistId(ctx.channelId);
  if (vTab) {
    try {
      const fromVideosTab = await firstEmbeddableVodFromPlaylist(apiKey, vTab);
      if (fromVideosTab) {
        return fromVideosTab;
      }
    } catch (err) {
      console.warn('[YouTube API] Videos-tab playlist (UULF) failed; trying uploads minus Shorts:', err.message || err);
    }
  }

  if (ctx.uploadsPlaylistId) {
    return firstEmbeddableVodExcludingShortsPlaylist(apiKey, ctx.uploadsPlaylistId, ctx.channelId);
  }

  return null;
}

router.get('/latest', async (req, res) => {
  const apiKey = getEnvKey();
  if (!apiKey) {
    return res.status(503).json({
      error: 'YouTube API key not configured',
      hint: 'Set YOUTUBE_API_KEY in backend .env'
    });
  }

  try {
    const handle = getChannelHandle();
    const latest = await resolveLatestVideo(apiKey, handle);
    if (!latest) {
      return res.status(404).json({ error: 'No eligible video found (Videos tab or uploads minus Shorts)', handle });
    }

    const watchUrl = `https://www.youtube.com/watch?v=${latest.videoId}`;
    const embedUrl = `https://www.youtube.com/embed/${latest.videoId}`;

    res.setHeader('Cache-Control', 'public, max-age=300');
    res.json({
      videoId: latest.videoId,
      title: latest.title,
      watchUrl,
      embedUrl,
      channelHandle: handle
    });
  } catch (e) {
    const status = e.status && Number.isFinite(e.status) ? e.status : 500;
    console.error('[YouTube API]', e.message || e);
    res.status(status >= 400 && status < 600 ? status : 500).json({
      error: e.message || 'YouTube request failed'
    });
  }
});

module.exports = router;
