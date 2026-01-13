const express = require('express');
const router = express.Router();
const translationService = require('../services/translation.service');
const { authenticateAdmin } = require('../middleware/auth');

// POST /api/translation/translate-text - Translate a single text field
router.post('/translate-text', authenticateAdmin, async (req, res) => {
  try {
    const { text, sourceLang = 'hi', targetLang = 'en' } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    const translatedText = await translationService.translateText(text, sourceLang, targetLang);
    
    res.json({
      success: true,
      translatedText: translatedText
    });
  } catch (error) {
    console.error('[Translation Route] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to translate text',
      message: error.message
    });
  }
});

// POST /api/translation/translate-all - Manually trigger translation of all news
router.post('/translate-all', authenticateAdmin, async (req, res) => {
  try {
    console.log('[Translation Route] Manual translation triggered by admin');
    const result = await translationService.translateAllNews();
    
    res.json({
      success: result.success,
      message: result.message || 'Translation completed',
      translated: result.translated || 0,
      errors: result.errors || 0,
      total: result.total || 0
    });
  } catch (error) {
    console.error('[Translation Route] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to translate news',
      message: error.message
    });
  }
});

// POST /api/translation/translate-single - Translate a single news article
router.post('/translate-single/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isPending } = req.body; // true for pending news, false for published news
    
    const News = require('../models/News');
    const PendingNews = require('../models/PendingNews');
    const Model = isPending ? PendingNews : News;
    
    const news = await Model.findById(id);
    if (!news) {
      return res.status(404).json({
        success: false,
        error: 'News article not found'
      });
    }
    
    const result = await translationService.translateNewsArticle(news, isPending);
    
    res.json({
      success: true,
      message: result ? 'Translation completed' : 'No translation needed',
      translated: result
    });
  } catch (error) {
    console.error('[Translation Route] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to translate news',
      message: error.message
    });
  }
});

module.exports = router;

