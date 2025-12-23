const mongoose = require('mongoose');

const pendingNewsSchema = new mongoose.Schema({
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
    // Metadata about when this was generated
    generatedBy: {
        type: String,
        default: 'openai',
        enum: ['openai', 'admin', 'manual']
    },
    generatedAt: {
        type: Date,
        default: Date.now
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
pendingNewsSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    if (!this.titleEn) {
        this.titleEn = this.title;
    }
    next();
});

// Index for efficient queries
pendingNewsSchema.index({ category: 1, createdAt: -1 });
pendingNewsSchema.index({ generatedAt: -1 });
pendingNewsSchema.index({ createdAt: -1 });

module.exports = mongoose.model('PendingNews', pendingNewsSchema);

