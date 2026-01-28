const mongoose = require('mongoose');

const cricketMatchSchema = new mongoose.Schema({
  // Fixed identifier to ensure only one document exists
  dataType: {
    type: String,
    default: 'currentMatches',
    unique: true,
    index: true
  },
  // Array of all matches
  matches: {
    type: [{
      matchId: String,
      name: String,
      matchType: String,
      status: String,
      venue: String,
      date: String,
      dateTimeGMT: String,
      teams: [String],
      teamInfo: [{
        name: String,
        shortname: String,
        img: String
      }],
      score: [{
        r: Number,
        w: Number,
        o: Number,
        inning: String
      }],
      matchStarted: Boolean,
      matchEnded: Boolean,
      seriesId: String,
      fantasyEnabled: Boolean,
      bbbEnabled: Boolean,
      hasSquad: Boolean
    }],
    default: []
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  collection: 'cricketmatches',
  timestamps: true
});

// Index for faster queries
cricketMatchSchema.index({ dataType: 1 });
cricketMatchSchema.index({ lastUpdated: -1 });

// Static method to get the single document with all matches
cricketMatchSchema.statics.getCurrentMatches = async function () {
  let doc = await this.findOne({ dataType: 'currentMatches' });
  
  // If document doesn't exist, create it
  if (!doc) {
    doc = await this.create({
      dataType: 'currentMatches',
      matches: [],
      lastUpdated: new Date()
    });
  }
  
  return doc;
};

// Static method to update all matches in the single document
cricketMatchSchema.statics.updateAllMatches = async function (matchesData) {
  // Transform API data to match schema format
  const formattedMatches = matchesData.map(match => ({
    matchId: match.id || match.matchId,
    name: match.name || '',
    matchType: match.matchType || 'T20',
    status: match.status || '',
    venue: match.venue || '',
    date: match.date || '',
    dateTimeGMT: match.dateTimeGMT || '',
    teams: match.teams || [],
    teamInfo: match.teamInfo || [],
    score: match.score || [],
    matchStarted: match.matchStarted || false,
    matchEnded: match.matchEnded || false,
    seriesId: match.series_id || '',
    fantasyEnabled: match.fantasyEnabled || false,
    bbbEnabled: match.bbbEnabled || false,
    hasSquad: match.hasSquad || false
  }));

  // Find and update the single document, or create if it doesn't exist
  const doc = await this.findOneAndUpdate(
    { dataType: 'currentMatches' },
    {
      $set: {
        matches: formattedMatches,
        lastUpdated: new Date()
      }
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );

  return doc;
};

module.exports = mongoose.model('CricketMatch', cricketMatchSchema);
