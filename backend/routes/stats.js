const express = require('express');
const Stats = require('../models/Stats');

const router = express.Router();

// GET /api/stats - Get reader count
router.get('/', async (req, res) => {
  try {
    const stats = await Stats.getStats();
    res.json({
      success: true,
      data: {
        readerCount: stats.readerCount,
        lastUpdated: stats.lastUpdated
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats'
    });
  }
});

// POST /api/stats/increment - Increment reader count
router.post('/increment', async (req, res) => {
  try {
    const stats = await Stats.incrementReaders();
    res.json({
      success: true,
      data: {
        readerCount: stats.readerCount,
        lastUpdated: stats.lastUpdated
      }
    });
  } catch (error) {
    console.error('Error incrementing reader count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to increment reader count'
    });
  }
});

module.exports = router;

