const axios = require('axios');
const News = require('../models/News');
const PendingNews = require('../models/PendingNews');
const cron = require('node-cron');

class TranslationService {
  constructor() {
    this.googleTranslateApiKey = process.env.GOOGLE_TRANSLATE_API_KEY || '';
    this.googleTranslateUrl = 'https://translation.googleapis.com/language/translate/v2';
    this.isRunning = false;
  }

  /**
   * Translate text from Hindi to English using Google Translate API
   */
  async translateText(text, sourceLang = 'hi', targetLang = 'en') {
    if (!text || !text.trim()) {
      return '';
    }

    if (!this.googleTranslateApiKey) {
      console.error('[TranslationService] Google Translate API key not configured');
      throw new Error('Google Translate API key not configured');
    }

    try {
      const response = await axios.post(
        `${this.googleTranslateUrl}?key=${this.googleTranslateApiKey}`,
        {
          q: text,
          source: sourceLang,
          target: targetLang,
          format: 'text'
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.data && response.data.data.translations) {
        return response.data.data.translations[0].translatedText;
      }
      throw new Error('Invalid response from Google Translate API');
    } catch (error) {
      console.error('[TranslationService] Translation error:', error.message);
      if (error.response) {
        console.error('[TranslationService] API Error:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Generate a 60-word summary from content
   */
  generateSummary(content, maxWords = 60) {
    if (!content || !content.trim()) {
      return '';
    }

    // Remove HTML tags if present
    const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Split into words
    const words = textContent.split(/\s+/);
    
    // Take first maxWords words
    const summaryWords = words.slice(0, maxWords);
    
    // Join and ensure it ends properly
    let summary = summaryWords.join(' ');
    
    // If original content was longer, add ellipsis
    if (words.length > maxWords) {
      summary += '...';
    }
    
    return summary.trim();
  }

  /**
   * Translate a single news article
   */
  async translateNewsArticle(newsDoc, isPending = false) {
    try {
      const updates = {};
      let hasUpdates = false;

      // Translate title
      if (newsDoc.title && !newsDoc.titleEn) {
        try {
          updates.titleEn = await this.translateText(newsDoc.title);
          hasUpdates = true;
          console.log(`[TranslationService] Translated title for ${newsDoc._id}`);
        } catch (error) {
          console.error(`[TranslationService] Failed to translate title:`, error.message);
        }
      }

      // Translate excerpt
      if (newsDoc.excerpt && !newsDoc.excerptEn) {
        try {
          updates.excerptEn = await this.translateText(newsDoc.excerpt);
          hasUpdates = true;
          console.log(`[TranslationService] Translated excerpt for ${newsDoc._id}`);
        } catch (error) {
          console.error(`[TranslationService] Failed to translate excerpt:`, error.message);
        }
      }

      // Translate summary if exists
      if (newsDoc.summary && !newsDoc.summaryEn) {
        try {
          updates.summaryEn = await this.translateText(newsDoc.summary);
          hasUpdates = true;
          console.log(`[TranslationService] Translated summary for ${newsDoc._id}`);
        } catch (error) {
          console.error(`[TranslationService] Failed to translate summary:`, error.message);
        }
      }

      // Generate summaries if needed (only if summary doesn't exist)
      if (newsDoc.content || newsDoc.excerpt) {
        const sourceContent = newsDoc.content || newsDoc.excerpt;
        
        // Generate Hindi summary if not exists
        if (!newsDoc.summary && sourceContent) {
          updates.summary = this.generateSummary(sourceContent, 60);
          hasUpdates = true;
        }

        // Generate English summary if not exists (only if summary was just generated)
        if (!newsDoc.summaryEn && !newsDoc.summary && sourceContent) {
          // If we just generated Hindi summary, translate it
          if (updates.summary) {
            try {
              updates.summaryEn = await this.translateText(updates.summary);
              hasUpdates = true;
            } catch (error) {
              console.error(`[TranslationService] Failed to translate generated summary:`, error.message);
            }
          } else {
            // Otherwise generate from English content if available
            const englishContent = newsDoc.contentEn || newsDoc.excerptEn || '';
            if (englishContent) {
              updates.summaryEn = this.generateSummary(englishContent, 60);
              hasUpdates = true;
            } else if (sourceContent) {
              // Translate first, then generate summary
              try {
                const translatedContent = await this.translateText(sourceContent);
                updates.summaryEn = this.generateSummary(translatedContent, 60);
                hasUpdates = true;
              } catch (error) {
                console.error(`[TranslationService] Failed to generate English summary:`, error.message);
              }
            }
          }
        }
      }

      // Translate full content
      if (newsDoc.content && !newsDoc.contentEn) {
        try {
          updates.contentEn = await this.translateText(newsDoc.content);
          hasUpdates = true;
          console.log(`[TranslationService] Translated content for ${newsDoc._id}`);
        } catch (error) {
          console.error(`[TranslationService] Failed to translate content:`, error.message);
        }
      }

      // Translate trending title if exists
      if (newsDoc.trendingTitle && !newsDoc.trendingTitleEn) {
        try {
          updates.trendingTitleEn = await this.translateText(newsDoc.trendingTitle);
          hasUpdates = true;
          console.log(`[TranslationService] Translated trending title for ${newsDoc._id}`);
        } catch (error) {
          console.error(`[TranslationService] Failed to translate trending title:`, error.message);
        }
      }

      // Update the document if there are changes
      if (hasUpdates) {
        const Model = isPending ? PendingNews : News;
        await Model.findByIdAndUpdate(newsDoc._id, updates, { new: true });
        console.log(`[TranslationService] Updated ${isPending ? 'pending' : 'published'} news ${newsDoc._id}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`[TranslationService] Error translating news ${newsDoc._id}:`, error.message);
      return false;
    }
  }

  /**
   * Translate all news articles (both published and pending)
   * Uses Google Translate API
   */
  async translateAllNews() {
    if (this.isRunning) {
      console.log('[TranslationService] Translation already in progress');
      return { success: false, message: 'Translation already in progress' };
    }

    this.isRunning = true;
    console.log('[TranslationService] Starting translation of all news articles using Google Translate...');

    try {
      return await this.translateAllNewsWithGoogleTranslate();
    } catch (error) {
      console.error('[TranslationService] Error in translateAllNews:', error);
      return {
        success: false,
        message: error.message,
        translated: 0,
        errors: 0,
        total: 0
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Translate all news using Google Translate API
   */
  async translateAllNewsWithGoogleTranslate() {
    try {
      // Get all published news without English translations
      const publishedNews = await News.find({
        $or: [
          { titleEn: { $exists: false } },
          { titleEn: '' },
          { excerptEn: { $exists: false } },
          { excerptEn: '' },
          { contentEn: { $exists: false } },
          { contentEn: '' },
          { summaryEn: { $exists: false } },
          { summaryEn: '' },
          { trendingTitleEn: { $exists: false } },
          { trendingTitleEn: '' }
        ]
      }).limit(100); // Process in batches

      // Get all pending news without English translations
      const pendingNews = await PendingNews.find({
        $or: [
          { titleEn: { $exists: false } },
          { titleEn: '' },
          { excerptEn: { $exists: false } },
          { excerptEn: '' },
          { contentEn: { $exists: false } },
          { contentEn: '' },
          { summaryEn: { $exists: false } },
          { summaryEn: '' },
          { trendingTitleEn: { $exists: false } },
          { trendingTitleEn: '' }
        ]
      }).limit(100);

      let translatedCount = 0;
      let errorCount = 0;

      // Process published news
      for (const news of publishedNews) {
        try {
          const result = await this.translateNewsArticle(news, false);
          if (result) translatedCount++;
          
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          errorCount++;
          console.error(`[TranslationService] Error processing published news ${news._id}:`, error.message);
        }
      }

      // Process pending news
      for (const news of pendingNews) {
        try {
          const result = await this.translateNewsArticle(news, true);
          if (result) translatedCount++;
          
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          errorCount++;
          console.error(`[TranslationService] Error processing pending news ${news._id}:`, error.message);
        }
      }

      console.log(`[TranslationService] Translation complete. Translated: ${translatedCount}, Errors: ${errorCount}`);

      return {
        success: true,
        translated: translatedCount,
        errors: errorCount,
        total: publishedNews.length + pendingNews.length
      };
    } catch (error) {
      console.error('[TranslationService] Error in translateAllNewsWithGoogleTranslate:', error);
      throw error;
    }
  }

  /**
   * Start scheduled translation job (runs daily at 1 AM)
   */
  startScheduledTranslation() {
    // Run at 1 AM every day
    cron.schedule('0 1 * * *', async () => {
      console.log('[TranslationService] Scheduled translation job started at 1 AM');
      await this.translateAllNews();
    });
    console.log('[TranslationService] Scheduled translation job configured to run daily at 1 AM');
  }
}

module.exports = new TranslationService();

