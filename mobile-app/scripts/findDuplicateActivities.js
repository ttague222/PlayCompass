/**
 * Find duplicate/similar activities within packs
 *
 * Looks for:
 * 1. Similar titles (e.g., "Dance Party" and "Dance-a-thon")
 * 2. Same core concept with minor variations
 * 3. Activities that could be consolidated
 */

const fs = require('fs');
const path = require('path');

const activitiesPath = path.join(__dirname, '../src/data/activities.js');
const content = fs.readFileSync(activitiesPath, 'utf8');

// Extract all activities
const activities = [];
const activityRegex = /createActivity\(\{([^}]+(?:\{[^}]*\}[^}]*)*)\}\)/gs;

// Simpler approach: extract id, title, and category from each line group
const lines = content.split('\n');
let currentActivity = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();

  if (line.includes("id: '")) {
    const match = line.match(/id:\s*'([^']+)'/);
    if (match) {
      if (currentActivity && currentActivity.id && currentActivity.title && currentActivity.category) {
        activities.push(currentActivity);
      }
      currentActivity = { id: match[1], lineNum: i + 1 };
    }
  }

  if (currentActivity && line.includes("title: '")) {
    const match = line.match(/title:\s*'([^']+)'/);
    if (match) currentActivity.title = match[1];
  }

  if (currentActivity && line.includes("category: '")) {
    const match = line.match(/category:\s*'([^']+)'/);
    if (match) currentActivity.category = match[1];
  }

  if (currentActivity && line.includes("description: '")) {
    const match = line.match(/description:\s*'([^']+)'/);
    if (match) currentActivity.description = match[1];
  }
}

// Push last activity
if (currentActivity && currentActivity.id && currentActivity.title && currentActivity.category) {
  activities.push(currentActivity);
}

console.log(`Found ${activities.length} activities\n`);

// Group by category
const byCategory = {};
activities.forEach(a => {
  if (!byCategory[a.category]) byCategory[a.category] = [];
  byCategory[a.category].push(a);
});

// Function to find similar titles
function getSimilarityScore(title1, title2) {
  const words1 = title1.toLowerCase().split(/\s+/);
  const words2 = title2.toLowerCase().split(/\s+/);

  // Common words to ignore
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'with', 'for', 'to', 'in', 'on', 'at'];
  const filtered1 = words1.filter(w => !stopWords.includes(w) && w.length > 2);
  const filtered2 = words2.filter(w => !stopWords.includes(w) && w.length > 2);

  // Count common words
  const common = filtered1.filter(w => filtered2.some(w2 =>
    w2.includes(w) || w.includes(w2) || levenshtein(w, w2) <= 2
  ));

  const maxLen = Math.max(filtered1.length, filtered2.length);
  if (maxLen === 0) return 0;

  return common.length / maxLen;
}

// Levenshtein distance
function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Find similar activities in oversized categories
const oversized = ['active', 'creative', 'educational'];

oversized.forEach(category => {
  const catActivities = byCategory[category] || [];
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${category.toUpperCase()} (${catActivities.length} activities)`);
  console.log(`${'='.repeat(60)}`);

  const similar = [];
  const checked = new Set();

  for (let i = 0; i < catActivities.length; i++) {
    for (let j = i + 1; j < catActivities.length; j++) {
      const a1 = catActivities[i];
      const a2 = catActivities[j];
      const key = `${a1.id}-${a2.id}`;

      if (checked.has(key)) continue;
      checked.add(key);

      const score = getSimilarityScore(a1.title, a2.title);
      if (score >= 0.5) {
        similar.push({ a1, a2, score });
      }
    }
  }

  // Sort by similarity score
  similar.sort((a, b) => b.score - a.score);

  if (similar.length === 0) {
    console.log('No similar activities found by title.');
    console.log('\nGrouping by common keywords instead...\n');

    // Group by common keywords
    const keywords = {};
    catActivities.forEach(a => {
      const words = a.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      words.forEach(word => {
        // Stem common suffixes
        const stem = word.replace(/(ing|tion|ness|ment|ed|er|est|s)$/, '');
        if (stem.length > 3) {
          if (!keywords[stem]) keywords[stem] = [];
          keywords[stem].push(a);
        }
      });
    });

    // Find keywords with multiple activities
    Object.entries(keywords)
      .filter(([k, acts]) => acts.length >= 3)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 10)
      .forEach(([keyword, acts]) => {
        console.log(`\n"${keyword}" related activities (${acts.length}):`);
        acts.forEach(a => console.log(`  - ${a.id}: ${a.title}`));
      });
  } else {
    console.log(`\nFound ${similar.length} similar pairs:\n`);
    similar.slice(0, 20).forEach(({ a1, a2, score }) => {
      console.log(`[${Math.round(score * 100)}% similar]`);
      console.log(`  1. ${a1.id}: "${a1.title}"`);
      console.log(`  2. ${a2.id}: "${a2.title}"`);
      console.log('');
    });
  }
});

// List all activities by category for manual review
console.log('\n\n' + '='.repeat(60));
console.log('FULL ACTIVITY LIST BY CATEGORY');
console.log('='.repeat(60));

['active', 'creative'].forEach(category => {
  const catActivities = byCategory[category] || [];
  console.log(`\n${category.toUpperCase()} (${catActivities.length} - need to remove ${catActivities.length - 50}):`);
  console.log('-'.repeat(50));
  catActivities.forEach((a, i) => {
    console.log(`${String(i + 1).padStart(2)}. ${a.id}: ${a.title}`);
  });
});
