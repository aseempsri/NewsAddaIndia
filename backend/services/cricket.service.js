const axios = require('axios');
const CricketMatch = require('../models/CricketMatch');

class CricketService {
  constructor() {
    // API key hardcoded in the service
    this.cricApiKey = '1c07ab5a-5991-4f32-99c4-41c81b232b49';
    this.cricApiUrl = 'https://api.cricapi.com/v1/currentMatches';
    this.isRunning = false;
    this.lastFetchTime = null;
    this.fetchInterval = null; // Store interval reference
  }

  /**
   * Fetch cricket matches from CricAPI and update single document
   */
  async fetchCricketMatches() {
    if (this.isRunning) {
      console.log('[CricketService] Fetch already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log('[CricketService] Fetching cricket matches from API...');
      
      const response = await axios.get(this.cricApiUrl, {
        params: {
          apikey: this.cricApiKey,
          offset: 0
        },
        timeout: 10000 // 10 second timeout
      });

      if (response.data && response.data.status === 'success' && response.data.data) {
        const matches = response.data.data;
        console.log(`[CricketService] Received ${matches.length} matches from API`);

        // Update the single document with all matches
        const doc = await CricketMatch.updateAllMatches(matches);
        
        this.lastFetchTime = new Date();
        const duration = Date.now() - startTime;
        
        console.log(`[CricketService] Successfully updated single document with ${matches.length} matches in ${duration}ms`);
        console.log(`[CricketService] Document ID: ${doc._id}, Last Updated: ${doc.lastUpdated}`);

        this.isRunning = false;
        return { success: true, count: matches.length, documentId: doc._id };
      } else {
        throw new Error('Invalid API response structure');
      }
    } catch (error) {
      this.isRunning = false;
      const duration = Date.now() - startTime;
      
      console.error('[CricketService] Error fetching cricket matches:', error.message);
      if (error.response) {
        console.error('[CricketService] API Error Status:', error.response.status);
        console.error('[CricketService] API Error Data:', error.response.data);
      }
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Start scheduled cricket data refresh (every 2 minutes)
   */
  startScheduledRefresh() {
    if (this.fetchInterval) {
      console.log('[CricketService] Scheduled refresh already running');
      return;
    }

    console.log('[CricketService] Starting scheduled cricket data refresh (every 2 minutes)');

    // Initial fetch
    this.fetchCricketMatches();

    // Schedule refresh every 2 minutes using setInterval
    // Using setInterval instead of cron for more precise 2-minute intervals
    this.fetchInterval = setInterval(async () => {
      await this.fetchCricketMatches();
    }, 2 * 60 * 1000); // 2 minutes in milliseconds

    console.log('[CricketService] Scheduled refresh started successfully');
  }

  /**
   * Stop scheduled refresh
   */
  stopScheduledRefresh() {
    if (this.fetchInterval) {
      clearInterval(this.fetchInterval);
      this.fetchInterval = null;
      console.log('[CricketService] Scheduled refresh stopped');
    }
  }

  /**
   * Get last fetch time
   */
  getLastFetchTime() {
    return this.lastFetchTime;
  }
}

// Export singleton instance
const cricketService = new CricketService();

module.exports = cricketService;
