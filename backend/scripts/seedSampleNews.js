const mongoose = require('mongoose');
require('dotenv').config();

// Import the News model
const News = require('../models/News');

// Lorem ipsum text (approximately 1000 words)
const loremIpsum = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.

Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur.

Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur. At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.

Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus.

Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat.

Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo.

Quisque sit amet est et sapien ullamcorper pharetra. Vestibulum erat wisi, condimentum sed, commodo vitae, ornare sit amet, wisi. Aenean fermentum, elit eget tincidunt condimentum, eros ipsum rutrum orci, sagittis tempus lacus enim ac dui. Donec non enim in turpis pulvinar facilisis. Ut felis.

Praesent dapibus, neque id cursus faucibus, tortor neque egestas augue, eu vulputate magna eros eu erat. Aliquam erat volutpat. Nam dui mi, tincidunt quis, accumsan porttitor, facilisis luctus, metus. Phasellus ultrices nulla quis nibh. Quisque a lectus. Donec consectetuer ligula vulputate sem tristique cursus.

Nam nulla quam, gravida non, commodo a, sodales sit amet, nisi. Pellentesque fermentum dolor. Aliquam quam lectus, facilisis auctor, ultrices ut, elementum vulputate, nunc. Sed adipiscing ornare risus. Morbi est est, blandit sit amet, sagittis vel, euismod vel, velit. Pellentesque egestas sem. Suspendisse commodo ullamcorper magna.

Nulla facilisi. Integer lacinia sollicitudin massa. Cras metus. Sed aliquet risus a tortor. Integer id quam. Morbi mi. Quisque nisl felis, venenatis tristique, dignissim in, ultrices sit amet, augue. Proin sodales libero eget ante. Nulla quam. Aenean laoreet. Vestibulum nisi lectus, commodo ac, facilisis ac, ultricies eu, pede.

Ut orci risus, accumsan porttitor, cursus quis, aliquet eget, justo. Sed pretium blandit orci. Ut eu diam at pede suscipit sodales. Aenean lectus elit, fermentum non, convallis id, sagittis at, neque. Nullam mauris orci, aliquet et, iaculis et, viverra vitae, ligula.

Nulla ut felis in purus aliquam imperdiet. Maecenas aliquet mollis lectus. Vivamus consectetuer risus et tortor. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet.

Duis sagittis ipsum. Praesent mauris. Fusce nec tellus sed augue semper porta. Mauris massa. Vestibulum lacinia arcu eget nulla. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Curabitur sodales ligula in libero.

Sed dignissim lacinia nunc. Curabitur tortor. Pellentesque nibh. Aenean quam. In scelerisque sem at dolor. Maecenas mattis. Sed convallis tristique sem. Proin ut ligula vel nunc egestas porttitor. Morbi lectus risus, iaculis vel, suscipit quis, luctus non, massa.

Fusce ac turpis quis ligula lacinia aliquet. Mauris ipsum. Nulla metus metus, ullamcorper vel, tincidunt sed, euismod in, nibh. Quisque volutpat condimentum velit. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.

Nam nec ante. Sed lacinia, urna non tincidunt mattis, tortor neque adipiscing diam, a cursus ipsum ante quis turpis. Nulla facilisi. Ut fringilla. Suspendisse potenti. Nunc feugiat mi a tellus consequat imperdiet. Vestibulum sapien. Proin quam. Etiam ultrices.

Suspendisse in justo eu magna luctus suscipit. Sed lectus. Integer euismod lacus luctus magna. Quisque cursus, metus vitae pharetra auctor, sem massa mattis sem, at interdum magna augue eget diam. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Morbi lacinia molestie dui.

Praesent blandit dolor. Sed non quam. In vel mi sit amet augue congue elementum. Morbi in ipsum sit amet pede facilisis laoreet. Donec lacus nunc, viverra nec, blandit vel, egestas et, augue. Vestibulum tincidunt malesuada tellus. Ut ultrices ultrices enim.

Curabitur sit amet mauris. Morbi in dui quis est pulvinar ullamcorper. Nulla facilisi. Integer lacinia sollicitudin massa. Cras metus. Sed aliquet risus a tortor. Integer id quam. Morbi mi. Quisque nisl felis, venenatis tristique, dignissim in, ultrices sit amet, augue.`;

// Sample news with detailed content
const sampleNews = [
  {
    title: 'Revolutionary Breakthrough in Quantum Computing',
    titleEn: 'Revolutionary Breakthrough in Quantum Computing',
    excerpt: 'Scientists achieve unprecedented milestone in quantum computing, opening new possibilities for solving complex problems.',
    content: loremIpsum,
    category: 'National',
    tags: ['Technology', 'Science', 'Innovation', 'Quantum Computing'],
    pages: ['home', 'national'],
    author: 'Dr. Sarah Johnson',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&q=80',
    isBreaking: true,
    isFeatured: true,
    published: true
  },
  {
    title: 'Global Climate Summit Reaches Historic Agreement',
    titleEn: 'Global Climate Summit Reaches Historic Agreement',
    excerpt: 'World leaders unite to combat climate change with ambitious new targets and funding commitments.',
    content: loremIpsum,
    category: 'International',
    tags: ['Climate', 'Environment', 'Politics', 'Global'],
    pages: ['home', 'international'],
    author: 'Michael Chen',
    image: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=1200&q=80',
    isBreaking: false,
    isFeatured: true,
    published: true
  },
  {
    title: 'New Medical Treatment Shows Promise for Cancer Patients',
    titleEn: 'New Medical Treatment Shows Promise for Cancer Patients',
    excerpt: 'Breakthrough immunotherapy treatment demonstrates remarkable results in clinical trials, offering hope to millions.',
    content: loremIpsum,
    category: 'Health',
    tags: ['Health', 'Medicine', 'Cancer', 'Research'],
    pages: ['home', 'health'],
    author: 'Dr. Emily Rodriguez',
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200&q=80',
    isBreaking: false,
    isFeatured: false,
    published: true
  },
  {
    title: 'Stock Market Reaches All-Time High Amid Economic Recovery',
    titleEn: 'Stock Market Reaches All-Time High Amid Economic Recovery',
    excerpt: 'Major indices surge as investors show confidence in economic growth and corporate earnings.',
    content: loremIpsum,
    category: 'Business',
    tags: ['Business', 'Finance', 'Economy', 'Stocks'],
    pages: ['home', 'business'],
    author: 'James Wilson',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80',
    isBreaking: false,
    isFeatured: false,
    published: true
  },
  {
    title: 'Championship Victory: Team Wins Historic Tournament',
    titleEn: 'Championship Victory: Team Wins Historic Tournament',
    excerpt: 'Underdog team defies expectations to claim championship title in dramatic final match.',
    content: loremIpsum,
    category: 'Sports',
    tags: ['Sports', 'Championship', 'Victory', 'Tournament'],
    pages: ['home', 'sports'],
    author: 'Alex Thompson',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=80',
    isBreaking: true,
    isFeatured: true,
    published: true
  },
  {
    title: 'Award-Winning Film Premieres to Critical Acclaim',
    titleEn: 'Award-Winning Film Premieres to Critical Acclaim',
    excerpt: 'Highly anticipated film receives standing ovation at international film festival, earning rave reviews.',
    content: loremIpsum,
    category: 'Entertainment',
    tags: ['Entertainment', 'Film', 'Awards', 'Cinema'],
    pages: ['home', 'entertainment'],
    author: 'Lisa Martinez',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&q=80',
    isBreaking: false,
    isFeatured: false,
    published: true
  },
  {
    title: 'Major Policy Reform Announced by Government',
    titleEn: 'Major Policy Reform Announced by Government',
    excerpt: 'New legislation aims to address key social and economic challenges facing the nation.',
    content: loremIpsum,
    category: 'Politics',
    tags: ['Politics', 'Policy', 'Government', 'Reform'],
    pages: ['home', 'politics'],
    author: 'Robert Anderson',
    image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&q=80',
    isBreaking: false,
    isFeatured: true,
    published: true
  },
  {
    title: 'Innovation in Renewable Energy Technology',
    titleEn: 'Innovation in Renewable Energy Technology',
    excerpt: 'New solar panel technology increases efficiency by 50%, making renewable energy more accessible.',
    content: loremIpsum,
    category: 'National',
    tags: ['Energy', 'Technology', 'Environment', 'Innovation'],
    pages: ['home', 'national'],
    author: 'Jennifer Lee',
    image: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=1200&q=80',
    isBreaking: false,
    isFeatured: false,
    published: true
  }
];

async function seedNews() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/newsadda');
    console.log('Connected to MongoDB');

    // Clear existing news
    await News.deleteMany({});
    console.log('Cleared existing news');

    // Insert sample news
    const insertedNews = await News.insertMany(sampleNews);
    console.log(`Successfully seeded ${insertedNews.length} news articles`);

    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding news:', error);
    process.exit(1);
  }
}

// Run the seed function
seedNews();

