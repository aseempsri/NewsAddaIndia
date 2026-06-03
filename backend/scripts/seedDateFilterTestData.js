/**
 * Seeds newsaddaindia DB with published articles on several calendar days (IST)
 * so Social Screen / News Adda date-picker filtering can be tested locally.
 *
 * Usage: npm run seed:date-filter
 * URI:   MONGODB_URI or mongodb://localhost:27017/newsaddaindia
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const News = require('../models/News');
const Stats = require('../models/Stats');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/newsaddaindia';

/** Noon IST on YYYY-MM-DD */
function istDate(isoDay, hour = 12, minute = 0) {
  const h = String(hour).padStart(2, '0');
  const m = String(minute).padStart(2, '0');
  return new Date(`${isoDay}T${h}:${m}:00+05:30`);
}

const EXCERPT =
  'Sample story for local date-filter testing. Select this day in the Social Screen header to see only these articles.';

const CONTENT =
  'This is placeholder body copy for development. It is long enough to appear in article detail views when you open a card from the home page, category pages, or the news ticker.';

const IMAGE_BY_CATEGORY = {
  National: 'https://images.unsplash.com/photo-1524492412937-b5c8b89b81bd?w=800&q=80',
  International: 'https://images.unsplash.com/photo-1526778548025-fa2f5cdfcff4?w=800&q=80',
  Sports: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
  Business: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
  Entertainment: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80',
  Health: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80',
  Politics: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80',
  Religious: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
};

const PAGE_BY_CATEGORY = {
  National: 'national',
  International: 'international',
  Sports: 'sports',
  Business: 'business',
  Entertainment: 'entertainment',
  Health: 'health',
  Politics: 'politics',
  Religious: 'religious',
};

/** Relative to "today" in IST — adjust if you run this on another calendar day */
const TEST_DAYS = [
  { offset: 0, label: 'today' },
  { offset: 1, label: 'yesterday' },
  { offset: 2, label: 'two-days-ago' },
  { offset: 7, label: 'one-week-ago' },
  { offset: 14, label: 'two-weeks-ago' },
];

const CATEGORIES_PER_DAY = [
  'National',
  'International',
  'Sports',
  'Business',
  'Entertainment',
  'Health',
  'Politics',
  'Religious',
];

function formatIsoDayInIST(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const y = parts.find((p) => p.type === 'year').value;
  const m = parts.find((p) => p.type === 'month').value;
  const d = parts.find((p) => p.type === 'day').value;
  return `${y}-${m}-${d}`;
}

function addDaysInIST(base, daysBack) {
  const d = new Date(base);
  d.setDate(d.getDate() - daysBack);
  return formatIsoDayInIST(d);
}

function buildArticlesForDay(isoDay, dayMeta) {
  const when = istDate(isoDay, 10, 30);
  const articles = [];

  CATEGORIES_PER_DAY.forEach((category, index) => {
    const page = PAGE_BY_CATEGORY[category];
    const slug = `test-${isoDay}-${page}-${index + 1}`;
    const isToday = dayMeta.offset === 0;

    articles.push({
      title: `[${isoDay}] ${category} headline — Social Screen test`,
      titleEn: `[${isoDay}] ${category} headline — Social Screen test`,
      excerpt: EXCERPT,
      excerptEn: EXCERPT,
      summary: EXCERPT,
      summaryEn: EXCERPT,
      content: CONTENT,
      contentEn: CONTENT,
      category,
      tags: ['test', 'date-filter', category.toLowerCase(), dayMeta.label],
      pages: ['home', page],
      author: 'Social Screen Dev Seed',
      image: IMAGE_BY_CATEGORY[category],
      images: [IMAGE_BY_CATEGORY[category]],
      date: when,
      createdAt: istDate(isoDay, 9 + index, 15),
      updatedAt: istDate(isoDay, 9 + index, 15),
      published: true,
      isBreaking: isToday && category === 'National' && index === 0,
      isFeatured: isToday && category === 'International' && index === 1,
      isTrending: isToday && category === 'Politics' && index === 0,
      trendingTitle: isToday && category === 'Politics' ? `Trending ${isoDay}: Policy update` : undefined,
      trendingTitleEn: isToday && category === 'Politics' ? `Trending ${isoDay}: Policy update` : undefined,
      slug,
    });
  });

  // Extra home-only story per day (Latest Stories grid)
  articles.push({
    title: `[${isoDay}] Home feed extra — latest stories slot`,
    titleEn: `[${isoDay}] Home feed extra — latest stories slot`,
    excerpt: EXCERPT,
    excerptEn: EXCERPT,
    content: CONTENT,
    contentEn: CONTENT,
    category: 'National',
    tags: ['test', 'home', dayMeta.label],
    pages: ['home'],
    author: 'Social Screen Dev Seed',
    image: IMAGE_BY_CATEGORY.National,
    date: when,
    createdAt: istDate(isoDay, 18, 0),
    updatedAt: istDate(isoDay, 18, 0),
    published: true,
    isBreaking: false,
    isFeatured: false,
    isTrending: false,
    slug: `test-${isoDay}-home-extra`,
  });

  return articles;
}

async function seed() {
  console.log('Connecting to', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.\n');

  const todayIst = formatIsoDayInIST(new Date());
  const baseDate = new Date(`${todayIst}T12:00:00+05:30`);

  const allArticles = [];
  for (const dayMeta of TEST_DAYS) {
    const isoDay = addDaysInIST(baseDate, dayMeta.offset);
    const batch = buildArticlesForDay(isoDay, dayMeta);
    allArticles.push(...batch);
    console.log(`  ${isoDay} (${dayMeta.label}): ${batch.length} articles`);
  }

  const deleted = await News.deleteMany({ tags: 'date-filter' });
  console.log(`\nRemoved ${deleted.deletedCount} previous test articles (tag: date-filter).`);

  const inserted = await News.insertMany(allArticles, { ordered: true });
  console.log(`Inserted ${inserted.length} articles.\n`);

  await Stats.getStats();
  console.log('Stats document ready (reader count).\n');

  const summary = await News.aggregate([
    { $match: { published: true, tags: 'date-filter' } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
  ]);

  console.log('Published test articles by day (IST, from createdAt):');
  summary.forEach((row) => console.log(`  ${row._id}: ${row.count}`));

  console.log('\nDone. Start backend: cd backend && npm run dev');
  console.log('Then open Social Screen and use the header date picker.\n');

  await mongoose.connection.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
