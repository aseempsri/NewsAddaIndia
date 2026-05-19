/**
 * One-time migration: add site field to ads and drop legacy adId-only unique index.
 * Run from backend folder: node scripts/migrateAdsSiteField.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Ad = require('../models/Ad');

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const result = await Ad.migrateLegacySiteField();
  console.log('Tagged legacy ads as newsadda:', result.modifiedCount);

  try {
    await Ad.collection.dropIndex('adId_1');
    console.log('Dropped legacy index adId_1');
  } catch (e) {
    if (e.codeName === 'IndexNotFound') {
      console.log('No legacy adId_1 index to drop');
    } else {
      console.warn('Could not drop adId_1:', e.message);
    }
  }

  await Ad.syncIndexes();
  console.log('Synced indexes (adId + site unique)');

  await Ad.ensureAdsForSite('socialscreen');
  console.log('Ensured ad1–ad5 for site=socialscreen');

  const counts = await Ad.aggregate([
    { $group: { _id: '$site', count: { $sum: 1 } } }
  ]);
  console.log('Ad counts by site:', counts);

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
