const express = require('express');
const CricketMatch = require('../models/CricketMatch');

const router = express.Router();

// GET /api/cricket/matches - Get all cricket matches from single document
router.get('/matches', async (req, res) => {
  try {
    const doc = await CricketMatch.getCurrentMatches();
    
    // Transform to match frontend expected format
    const formattedMatches = doc.matches.map(match => ({
      id: match.matchId,
      name: match.name,
      matchType: match.matchType,
      status: match.status,
      venue: match.venue,
      date: match.date,
      dateTimeGMT: match.dateTimeGMT,
      teams: match.teams,
      teamInfo: match.teamInfo,
      score: match.score,
      matchStarted: match.matchStarted,
      matchEnded: match.matchEnded,
      series_id: match.seriesId,
      fantasyEnabled: match.fantasyEnabled,
      bbbEnabled: match.bbbEnabled,
      hasSquad: match.hasSquad
    }));

    res.json({
      status: 'success',
      data: formattedMatches,
      count: formattedMatches.length,
      lastUpdated: doc.lastUpdated,
      documentId: doc._id
    });
  } catch (error) {
    console.error('Error fetching cricket matches:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch cricket matches',
      message: error.message
    });
  }
});

// GET /api/cricket/matches/:matchId - Get single match by ID from single document
router.get('/matches/:matchId', async (req, res) => {
  try {
    const doc = await CricketMatch.getCurrentMatches();
    const match = doc.matches.find(m => m.matchId === req.params.matchId);
    
    if (!match) {
      return res.status(404).json({
        status: 'error',
        error: 'Match not found'
      });
    }

    const formattedMatch = {
      id: match.matchId,
      name: match.name,
      matchType: match.matchType,
      status: match.status,
      venue: match.venue,
      date: match.date,
      dateTimeGMT: match.dateTimeGMT,
      teams: match.teams,
      teamInfo: match.teamInfo,
      score: match.score,
      matchStarted: match.matchStarted,
      matchEnded: match.matchEnded,
      series_id: match.seriesId,
      fantasyEnabled: match.fantasyEnabled,
      bbbEnabled: match.bbbEnabled,
      hasSquad: match.hasSquad
    };

    res.json({
      status: 'success',
      data: formattedMatch
    });
  } catch (error) {
    console.error('Error fetching cricket match:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch cricket match',
      message: error.message
    });
  }
});

// GET /api/cricket/status - Get service status and last fetch time
router.get('/status', async (req, res) => {
  try {
    const cricketService = require('../services/cricket.service');
    const lastFetchTime = cricketService.getLastFetchTime();
    
    const doc = await CricketMatch.getCurrentMatches();
    const matchCount = doc.matches ? doc.matches.length : 0;
    
    res.json({
      status: 'success',
      data: {
        isRunning: cricketService.isRunning,
        lastFetchTime: lastFetchTime,
        matchCount: matchCount,
        documentId: doc._id,
        documentLastUpdated: doc.lastUpdated,
        serviceActive: cricketService.fetchInterval !== null
      }
    });
  } catch (error) {
    console.error('Error fetching cricket service status:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch service status',
      message: error.message
    });
  }
});

module.exports = router;
