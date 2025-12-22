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
  content: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    required: true,
    enum: ['National', 'International', 'Sports', 'Business', 'Entertainment', 'Health', 'Politics'],
    index: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  pages: [{
    type: String,
    enum: ['home', 'national', 'international', 'politics', 'health', 'entertainment', 'sports', 'business'],
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
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
newsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (!this.titleEn) {
    this.titleEn = this.title;
  }
  next();
});

// Index for efficient queries
newsSchema.index({ category: 1, published: 1, createdAt: -1 });
newsSchema.index({ pages: 1, published: 1, createdAt: -1 });
newsSchema.index({ isBreaking: 1, published: 1, createdAt: -1 });
newsSchema.index({ isFeatured: 1, published: 1, createdAt: -1 });

module.exports = mongoose.model('News', newsSchema);

