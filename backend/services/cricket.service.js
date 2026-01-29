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

      // Check response structure
      if (!response.data) {
        throw new Error('No data in API response');
      }

      // Handle API response
      if (response.data.status === 'success' && response.data.data && Array.isArray(response.data.data)) {
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
      } else if (response.data.status === 'failure') {
        // Handle API failures gracefully (rate limits, etc.)
        const reason = response.data.reason || 'Unknown error';
        const info = response.data.info || {};
        
        console.warn(`[CricketService] API failure: ${reason}`);
        if (info.hitsLimit && info.hitsToday) {
          console.warn(`[CricketService] Rate limit exceeded: ${info.hitsToday}/${info.hitsLimit} hits. Using cached data.`);
        }
        
        // Don't throw error - just log and return failure
        // The frontend will use cached data from database
        this.isRunning = false;
        return { 
          success: false, 
          error: reason,
          rateLimited: reason.includes('hits') || reason.includes('limit'),
          apiInfo: info
        };
      } else {
        // Unexpected response structure
        const errorMsg = `Invalid API response structure. Status: ${response.data?.status}, Has data: ${!!response.data?.data}, Data is array: ${Array.isArray(response.data?.data)}`;
        console.error('[CricketService]', errorMsg);
        console.error('[CricketService] Full response:', JSON.stringify(response.data, null, 2));
        
        this.isRunning = false;
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      this.isRunning = false;
      const duration = Date.now() - startTime;
      
      console.error('[CricketService] Error fetching cricket matches:', error.message);
      if (error.response) {
        console.error('[CricketService] API Error Status:', error.response.status);
        console.error('[CricketService] API Error Headers:', error.response.headers);
        console.error('[CricketService] API Error Data:', JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.error('[CricketService] No response received. Request details:', {
          url: error.config?.url,
          method: error.config?.method,
          params: error.config?.params
        });
      } else {
        console.error('[CricketService] Error setting up request:', error.message);
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
