/**
 * Google Cloud Text-to-Speech API route.
 * POST /api/tts with body: { text: string, lang: 'hi-IN' | 'en-IN' }
 * Returns: { success: true, chunks: string[] } (base64 MP3 per chunk) or { success: false, error }
 * Long text is split into chunks of ~4500 chars (API limit 5000).
 */

const express = require('express');
const router = express.Router();

const MAX_CHARS_PER_REQUEST = 4500;

function chunkText(text) {
  if (!text || text.length <= MAX_CHARS_PER_REQUEST) return [text.trim()].filter(Boolean);
  const chunks = [];
  let remaining = text;
  while (remaining.length > 0) {
    const slice = remaining.slice(0, MAX_CHARS_PER_REQUEST);
    const lastSpace = slice.lastIndexOf(' ');
    const chunk = lastSpace > MAX_CHARS_PER_REQUEST / 2 ? slice.slice(0, lastSpace + 1) : slice;
    chunks.push(chunk);
    remaining = remaining.slice(chunk.length).trim();
  }
  return chunks.filter(Boolean);
}

router.post('/', async (req, res) => {
  try {
    const { text, lang } = req.body || {};
    const langCode = (lang === 'hi' || lang === 'hi-IN') ? 'hi-IN' : 'en-IN';
    const cleanText = typeof text === 'string' ? text.trim() : '';
    if (!cleanText) {
      return res.status(400).json({ success: false, error: 'Missing or empty text' });
    }

    let client;
    try {
      client = require('@google-cloud/text-to-speech').v1.TextToSpeechClient();
    } catch (e) {
      console.error('[TTS] Google Cloud TTS client init failed:', e.message);
      return res.status(503).json({
        success: false,
        error: 'Text-to-speech not configured. Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON path.',
        code: 'TTS_NOT_CONFIGURED'
      });
    }

    const voice = langCode === 'hi-IN'
      ? { languageCode: 'hi-IN', name: 'hi-IN-Standard-A' }
      : { languageCode: 'en-IN', name: 'en-IN-Standard-A' };
    const chunks = chunkText(cleanText);
    const audioChunks = [];

    for (const chunk of chunks) {
      const [response] = await client.synthesizeSpeech({
        input: { text: chunk },
        voice,
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 0.9,
          pitch: 0
        }
      });
      if (response.audioContent && response.audioContent.length) {
        const b64 = Buffer.isBuffer(response.audioContent)
          ? response.audioContent.toString('base64')
          : Buffer.from(response.audioContent).toString('base64');
        audioChunks.push(b64);
      }
    }

    if (audioChunks.length === 0) {
      return res.status(500).json({ success: false, error: 'No audio generated' });
    }

    res.json({ success: true, chunks: audioChunks });
  } catch (err) {
    console.error('[TTS] Error:', err.message || err);
    const code = err.code || err.status;
    const message = err.message || 'Text-to-speech failed';
    res.status(code === 3 ? 400 : 500).json({
      success: false,
      error: message,
      code: code || 'TTS_ERROR'
    });
  }
});

module.exports = router;
