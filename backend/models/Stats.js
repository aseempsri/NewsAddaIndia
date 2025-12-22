const mongoose = require('mongoose');

const statsSchema = new mongoose.Schema({
    readerCount: {
        type: Number,
        default: 4320,
        min: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    collection: 'stats'
});

// Ensure only one document exists
statsSchema.statics.getStats = async function () {
    let stats = await this.findOne();
    if (!stats) {
        stats = await this.create({ readerCount: 4320 });
    }
    return stats;
};

statsSchema.statics.incrementReaders = async function () {
    const stats = await this.getStats();
    stats.readerCount += 1;
    stats.lastUpdated = Date.now();
    await stats.save();
    return stats;
};

module.exports = mongoose.model('Stats', statsSchema);

