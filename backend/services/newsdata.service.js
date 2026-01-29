const axios = require('axios');
const cron = require('node-cron');
const PendingNews = require('../models/PendingNews');

class NewsDataService {
  constructor() {
    this.apiKey = 'pub_d36c5443f93c449db2774fedbc786894';
    this.baseUrl = 'https://newsdata.io/api/1';
    
    // Map our categories to NewsData.io categories
    this.categoryMapping = {
      'Home': 'top', // General/top news
      'National': 'top',
      'International': 'world',
      'Religious': 'top', // NewsData.io doesn't have religious category
      'Politics': 'politics',
      'Health': 'health',
      'Entertainment': 'entertainment',
      'Sports': 'sports',
      'Business': 'business'
    };
    
    // Map NewsData.io categories to our categories
    this.reverseCategoryMapping = {
      'top': 'National',
      'world': 'International',
      'politics': 'Politics',
      'health': 'Health',
      'entertainment': 'Entertainment',
      'sports': 'Sports',
      'business': 'Business'
    };
  }

  /**
   * Fetch latest news from NewsData.io for a specific category
   */
  async fetchNewsForCategory(category, limit = 10) {
    try {
      const newsDataCategory = this.categoryMapping[category] || 'top';
      
      const params = {
        apikey: this.apiKey,
        language: 'hi', // Hindi - NewsData.io supports Hindi news
        country: 'in', // India
        size: limit
      };
      
      // Add category if not 'top' or 'Home'
      if (newsDataCategory !== 'top') {
        params.category = newsDataCategory;
      }
      
      // Add search query for Religious category
      if (category === 'Religious') {
        params.q = 'religious OR temple OR festival OR spiritual OR hindu OR muslim OR christian OR sikh';
      }
      
      const https = require('https');
      const agent = new https.Agent({
        rejectUnauthorized: false // Allow self-signed certificates
      });
      
      const response = await axios.get(`${this.baseUrl}/news`, { 
        params,
        httpsAgent: agent
      });

      if (response.data && response.data.status === 'success' && response.data.results) {
        return response.data.results.slice(0, limit);
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching news for category ${category}:`, error.message);
      if (error.response) {
        console.error('API Response:', error.response.data);
      }
      return [];
    }
  }

  /**
   * Process and save news articles to PendingNews
   */
  async processAndSaveNews(articles, category) {
    const savedArticles = [];
    
    for (const article of articles) {
      try {
        // Check if article already exists (by title)
        const existing = await PendingNews.findOne({
          title: article.title,
          generatedBy: 'newsdata'
        });

        if (existing) {
          console.log(`Article already exists: ${article.title.substring(0, 50)}...`);
          continue;
        }

        // Helper function to filter out paid/premium text
        const filterPaidText = (text) => {
          if (!text) return '';
          const paidKeywords = [
            'only available in paid plans',
            'only available in paid version',
            'paid version',
            'premium version',
            'paid content',
            'members only',
            'only available in paid',
            'paid plans',
            'premium plans'
          ];
          let filtered = text;
          for (const keyword of paidKeywords) {
            const regex = new RegExp(keyword, 'gi');
            filtered = filtered.replace(regex, '');
          }
          return filtered.replace(/\s+/g, ' ').trim();
        };

        // Filter out paid text before processing
        // For Hindi news, content/description might be missing, so use title as fallback
        const rawContent = filterPaidText(article.content || article.description || article.title || '');
        const rawDescription = filterPaidText(article.description || article.content || article.title || '');
        
        // Ensure we have content - use title if everything else is empty
        const finalContent = rawContent || article.title || 'No content available';
        
        // Create summary (60 words) - ensure it's not empty
        const summary = this.createSummary(finalContent, 60) || article.title || 'Summary not available';
        
        // Create excerpt (first 150 characters) - ensure it's not empty
        // Excerpt is required field, so we must have something
        let excerpt = finalContent.substring(0, 150).trim();
        if (!excerpt || excerpt.length === 0) {
          // If excerpt is still empty, use title or a default message
          excerpt = article.title || 'News excerpt not available';
        }
        
        // Create details/content - ensure it's not empty
        const details = finalContent || article.title || 'Content not available';

        // Determine our category
        // NewsData.io returns category as an array, so check first element
        const newsDataCategory = Array.isArray(article.category) ? article.category[0] : article.category;
        let ourCategory = this.reverseCategoryMapping[newsDataCategory] || category;
        
        // Map "Home" to "National" since "Home" is not a valid enum value
        if (ourCategory === 'Home') {
          ourCategory = 'National';
        }

        // Create pending news document
        // Note: NewsData.io returns Hindi content when language='hi'
        // We'll use the Hindi content for title/excerpt/content fields
        // For English fields, we'll use the same content (can be translated later if needed)
        const pendingNews = new PendingNews({
          title: article.title, // Hindi title from NewsData.io
          titleEn: article.title, // Same for now, can be translated later
          excerpt: excerpt, // Hindi excerpt
          excerptEn: excerpt, // Same for now, can be translated later
          summary: summary, // Hindi summary
          summaryEn: summary, // Same for now, can be translated later
          content: details, // Hindi content
          contentEn: details, // Same for now, can be translated later
          image: article.image_url || article.source_icon || '',
          images: article.image_url ? [article.image_url] : [],
          category: ourCategory,
          tags: article.keywords || [],
          pages: this.getPagesForCategory(ourCategory),
          author: article.source_name || 'NewsData.io',
          isBreaking: false,
          isFeatured: false,
          isTrending: false,
          generatedBy: 'newsdata',
          generatedAt: new Date(),
          source: article.link || article.source_url || '',
          sourceName: article.source_name || 'NewsData.io'
        });

        const saved = await pendingNews.save();
        savedArticles.push(saved);
        console.log(`Saved article: ${article.title.substring(0, 50)}...`);
      } catch (error) {
        console.error(`Error processing article "${article.title}":`, error.message);
      }
    }

    return savedArticles;
  }

  /**
   * Create a summary of approximately 60 words
   */
  createSummary(text, targetWords = 60) {
    if (!text) return '';
    
    const words = text.split(/\s+/);
    if (words.length <= targetWords) {
      return text;
    }
    
    const summary = words.slice(0, targetWords).join(' ');
    // Ensure it ends with proper punctuation
    return summary.replace(/[.,;:!?]*$/, '.');
  }

  /**
   * Get pages array for a category
   */
  getPagesForCategory(category) {
    const pageMapping = {
      'National': ['home', 'national'],
      'International': ['home', 'international'],
      'Politics': ['home', 'politics'],
      'Health': ['home', 'health'],
      'Entertainment': ['home', 'entertainment'],
      'Sports': ['home', 'sports'],
      'Business': ['home', 'business'],
      'Religious': ['home', 'religious']
    };
    
    return pageMapping[category] || ['home'];
  }

  /**
   * Fetch and save news for all categories
   */
  async fetchAndSaveAllCategories() {
    const categories = ['Home', 'National', 'International', 'Religious', 'Politics', 'Health', 'Entertainment', 'Sports', 'Business'];
    const allSaved = [];
    
    console.log('Starting NewsData.io fetch for all categories...');
    
    for (const category of categories) {
      try {
        console.log(`Fetching news for category: ${category}`);
        const articles = await this.fetchNewsForCategory(category, 5); // Fetch 5 articles per category
        
        if (articles.length > 0) {
          const saved = await this.processAndSaveNews(articles, category);
          allSaved.push(...saved);
          console.log(`Saved ${saved.length} articles for ${category}`);
        } else {
          console.log(`No articles found for ${category}`);
        }
        
        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error processing category ${category}:`, error.message);
      }
    }
    
    console.log(`Total articles saved: ${allSaved.length}`);
    return allSaved;
  }

  /**
   * Start scheduled job to fetch news daily at 1 AM
   */
  startScheduledFetch() {
    // Schedule to run at 1 AM every day
    // Cron format: '0 1 * * *' = minute 0, hour 1, every day
    cron.schedule('0 1 * * *', async () => {
      console.log('[NewsDataService] Starting scheduled news fetch at 1 AM...');
      try {
        await this.fetchAndSaveAllCategories();
        console.log('[NewsDataService] Scheduled news fetch completed successfully');
      } catch (error) {
        console.error('[NewsDataService] Error in scheduled news fetch:', error);
      }
    }, {
      scheduled: true,
      timezone: 'Asia/Kolkata' // Indian Standard Time
    });
    
    console.log('[NewsDataService] Scheduled job initialized - will fetch news daily at 1 AM IST');
  }
}

module.exports = new NewsDataService();
