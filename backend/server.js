const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware

app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Allow all origins in development, set specific URL in production
  credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Increase JSON payload limit
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded images
// Note: routes/news.js uses path.join(__dirname, '../uploads') where __dirname is backend/routes
// So files are saved to backend/uploads/. Server.js is in backend/, so use 'uploads' (same directory)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/news', require('./routes/news'));
app.use('/api/pending-news', require('./routes/pendingNews'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/translation', require('./routes/translation'));
app.use('/api/cricket', require('./routes/cricket'));
app.use('/api/ads', require('./routes/ads'));

// Initialize scheduled translation job (runs daily at 1 AM)
const translationService = require('./services/translation.service');
translationService.startScheduledTranslation();

// Initialize scheduled NewsData.io fetch (runs daily at 1 AM)
const newsDataService = require('./services/newsdata.service');
newsDataService.startScheduledFetch();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Manual trigger for NewsData.io fetch (for testing)
app.post('/api/newsdata/fetch', async (req, res) => {
  try {
    const newsDataService = require('./services/newsdata.service');
    const saved = await newsDataService.fetchAndSaveAllCategories();
    res.json({ 
      success: true, 
      message: `Fetched and saved ${saved.length} articles`,
      count: saved.length
    });
  } catch (error) {
    console.error('Error in manual NewsData.io fetch:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/newsaddaindia')
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Initialize scheduled cricket data refresh (runs every 2 minutes)
    // Start only after MongoDB connection is established
    const cricketService = require('./services/cricket.service');
    cricketService.startScheduledRefresh();
    console.log('Cricket service initialized and scheduled refresh started');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please stop the other process or use a different port.`);
    console.error('To find and kill the process, run:');
    console.error(`  Windows: netstat -ano | findstr :${PORT}`);
    console.error(`  Then: taskkill /PID <PID> /F`);
  } else {
    console.error('Server error:', error);
  }
  process.exit(1);
});

