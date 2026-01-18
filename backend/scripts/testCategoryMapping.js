// Test script to verify category mapping logic
// This tests the mapCategory function with real XML examples

// Category mapping (same as in importMultipleWordPressXML.js)
const categoryMapping = {
  // Main categories
  'national': 'National',
  'international': 'International',
  'sports': 'Sports',
  'business': 'Business',
  'entertainment': 'Entertainment',
  'health': 'Health',
  'politics': 'Politics',
  'religious': 'Religious',
  'technology': 'Technology',
  
  // State/Region categories -> National
  'state': 'National',
  'bihar': 'National',
  'madhya pradesh': 'National',
  'uttar pradesh': 'National',
  'उत्तर प्रदेश': 'National',
  'उत्तराखंड': 'National',
  'वाराणसी': 'National',
  'desh': 'National',
  
  // Other mappings
  'crime': 'National',
  'poltics': 'Politics',
  'breaking news': 'National',
  'uncategorized': 'National',
  'न्यूज़ अड्डा स्पेशल': 'National',
  'खेल': 'Sports',
  
  'default': 'National'
};

function mapCategory(wordPressCategories) {
  if (!wordPressCategories || !Array.isArray(wordPressCategories)) {
    return categoryMapping['default'];
  }
  
  // CRITICAL FIX: Only look for main category (domain="category")
  // DO NOT use tags for category mapping - tags are separate
  for (const cat of wordPressCategories) {
    let domain, categoryName;
    
    if (cat.$ && cat.$.domain) {
      domain = cat.$.domain;
      categoryName = cat._ || (typeof cat === 'string' ? cat : '');
    } else if (cat.domain) {
      domain = cat.domain;
      categoryName = cat._ || cat.name || (typeof cat === 'string' ? cat : '');
    } else if (typeof cat === 'string') {
      categoryName = cat;
      domain = 'unknown';
    } else {
      continue;
    }
    
    // Only process categories, NOT tags
    if (domain === 'category' && categoryName) {
      const normalizedName = String(categoryName).trim().toLowerCase();
      const mapped = categoryMapping[normalizedName];
      if (mapped) {
        return mapped;
      }
    }
  }
  
  return categoryMapping['default'];
}

// Test cases based on real XML structure
console.log('🧪 Testing Category Mapping Logic\n');
console.log('='.repeat(60));

// Test 1: Religious category with Breaking news tag (should be Religious, NOT National)
const test1 = [
  { $: { domain: 'post_tag' }, _: 'Breaking news' },
  { $: { domain: 'post_tag' }, _: 'hindi news' },
  { $: { domain: 'category' }, _: 'Religious' }
];
const result1 = mapCategory(test1);
console.log('Test 1: Religious category + Breaking news tag');
console.log('  Expected: Religious');
console.log(`  Got: ${result1}`);
console.log(`  ${result1 === 'Religious' ? '✅ PASS' : '❌ FAIL'}\n`);

// Test 2: National category
const test2 = [
  { $: { domain: 'category' }, _: 'National' }
];
const result2 = mapCategory(test2);
console.log('Test 2: National category');
console.log('  Expected: National');
console.log(`  Got: ${result2}`);
console.log(`  ${result2 === 'National' ? '✅ PASS' : '❌ FAIL'}\n`);

// Test 3: Technology category
const test3 = [
  { $: { domain: 'category' }, _: 'Technology' }
];
const result3 = mapCategory(test3);
console.log('Test 3: Technology category');
console.log('  Expected: Technology');
console.log(`  Got: ${result3}`);
console.log(`  ${result3 === 'Technology' ? '✅ PASS' : '❌ FAIL'}\n`);

// Test 4: State category (should map to National)
const test4 = [
  { $: { domain: 'category' }, _: 'State' }
];
const result4 = mapCategory(test4);
console.log('Test 4: State category');
console.log('  Expected: National');
console.log(`  Got: ${result4}`);
console.log(`  ${result4 === 'National' ? '✅ PASS' : '❌ FAIL'}\n`);

// Test 5: Breaking news as category (should map to National)
const test5 = [
  { $: { domain: 'category' }, _: 'Breaking news' }
];
const result5 = mapCategory(test5);
console.log('Test 5: Breaking news as category');
console.log('  Expected: National');
console.log(`  Got: ${result5}`);
console.log(`  ${result5 === 'National' ? '✅ PASS' : '❌ FAIL'}\n`);

// Test 6: Breaking news as tag only (should default to National)
const test6 = [
  { $: { domain: 'post_tag' }, _: 'Breaking news' }
];
const result6 = mapCategory(test6);
console.log('Test 6: Breaking news as tag only (no category)');
console.log('  Expected: National (default)');
console.log(`  Got: ${result6}`);
console.log(`  ${result6 === 'National' ? '✅ PASS' : '❌ FAIL'}\n`);

// Test 7: Hindi category
const test7 = [
  { $: { domain: 'category' }, _: 'खेल' }
];
const result7 = mapCategory(test7);
console.log('Test 7: Hindi category (खेल = Sports)');
console.log('  Expected: Sports');
console.log(`  Got: ${result7}`);
console.log(`  ${result7 === 'Sports' ? '✅ PASS' : '❌ FAIL'}\n`);

// Test 8: Case sensitivity test
const test8 = [
  { $: { domain: 'category' }, _: '  RELIGIOUS  ' }
];
const result8 = mapCategory(test8);
console.log('Test 8: Category with whitespace and different case');
console.log('  Expected: Religious');
console.log(`  Got: ${result8}`);
console.log(`  ${result8 === 'Religious' ? '✅ PASS' : '❌ FAIL'}\n`);

console.log('='.repeat(60));
console.log('\n✅ Category mapping tests completed!');
