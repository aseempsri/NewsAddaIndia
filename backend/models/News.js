const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  titleEn: {
    type: String,
    trim: true
  },
  excerpt: {
    type: String,
    required: true,
    trim: true
  },
  excerptEn: {
    type: String,
    trim: true
  },
  summary: {
    type: String,
    trim: true
  },
  summaryEn: {
    type: String,
    trim: true
  },
  content: {
    type: String,
    default: ''
  },
  contentEn: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  images: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    required: true,
    enum: ['National', 'International', 'Sports', 'Business', 'Entertainment', 'Health', 'Politics', 'Religious', 'Technology'],
    index: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  pages: [{
    type: String,
    enum: ['home', 'national', 'international', 'politics', 'health', 'entertainment', 'sports', 'business', 'religious', 'technology'],
    default: []
  }],
  author: {
    type: String,
    default: 'News Adda India'
  },
  date: {
    type: Date,
    default: Date.now
  },
  published: {
    type: Boolean,
    default: true
  },
  isBreaking: {
    type: Boolean,
    default: false,
    index: true
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  isTrending: {
    type: Boolean,
    default: false,
    index: true
  },
  trendingTitle: {
    type: String,
    trim: true
  },
  trendingTitleEn: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  slug: {
    type: String,
    trim: true,
    sparse: true,
    index: true
  }
});

// Update the updatedAt field before saving
newsSchema.pre('save', async function(next) {
  this.updatedAt = Date.now();
  // Only set titleEn default if it's truly undefined/null, NOT if it's empty string (which means user cleared it)
  if (this.titleEn === undefined || this.titleEn === null) {
    this.titleEn = this.title;
  }
  // Generate slug from titleEn for URL-friendly links (no id in URL)
  if (this.isModified('title') || this.isModified('titleEn') || !this.slug) {
    const titleForSlug = (this.titleEn || this.title || '').trim();
    if (titleForSlug) {
      // Prefer Latin slug (a-z0-9-) for English headlines; same URL style as first post for all cards
      let baseSlug = titleForSlug
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\-]/gi, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50);
      // Non-Latin headline: use Latin-only slug so link works like first post (no encoding issues)
      if (!baseSlug) {
        baseSlug = 'news-' + this._id.toString().slice(-8);
      }
      let slug = baseSlug;
      let n = 2;
      const NewsModel = this.constructor;
      while (true) {
        const existing = await NewsModel.findOne({ slug, _id: { $ne: this._id } }).select('_id').lean();
        if (!existing) break;
        slug = `${baseSlug}-${n}`;
        n++;
      }
      this.slug = slug;
    }
  }
  
  // Auto-sync pages with category
  // When category is set, ensure corresponding page is included
  if (this.category && this.isModified('category')) {
    const categoryToPageMap = {
      'National': 'national',
      'International': 'international',
      'Sports': 'sports',
      'Business': 'business',
      'Entertainment': 'entertainment',
      'Health': 'health',
      'Politics': 'politics',
      'Religious': 'religious',
      'Technology': 'technology'
    };
    
    const correspondingPage = categoryToPageMap[this.category];
    if (correspondingPage) {
      // Ensure 'home' and corresponding category page are included
      const defaultPages = ['home', correspondingPage];
      
      // Keep other pages that don't conflict with category pages
      const otherPages = (this.pages || []).filter(
        p => p !== 'home' && !Object.values(categoryToPageMap).includes(p)
      );
      
      // Combine default pages with other selected pages
      this.pages = [...defaultPages, ...otherPages];
    }
  }
  
  next();
});

// Index for efficient queries
newsSchema.index({ category: 1, published: 1, createdAt: -1 });
newsSchema.index({ pages: 1, published: 1, createdAt: -1 });
newsSchema.index({ isBreaking: 1, published: 1, createdAt: -1 });
newsSchema.index({ isFeatured: 1, published: 1, createdAt: -1 });
newsSchema.index({ isTrending: 1, published: 1, createdAt: -1 });

module.exports = mongoose.model('News', newsSchema);

