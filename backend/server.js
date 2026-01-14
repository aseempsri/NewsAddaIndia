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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Initialize scheduled translation job (runs daily at 1 AM)
const translationService = require('./services/translation.service');
translationService.startScheduledTranslation();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/newsaddaindia')
  .then(() => {
    console.log('Connected to MongoDB');
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

