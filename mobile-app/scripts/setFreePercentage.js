/**
 * Script to set free activities to a target percentage
 * Balances across categories
 *
 * Run with: node scripts/setFreePercentage.js [percentage]
 * Example: node scripts/setFreePercentage.js 60
 */

const fs = require('fs');
const path = require('path');

const TARGET_PCT = parseInt(process.argv[2]) || 60; // Default 60%

const activitiesFilePath = path.join(__dirname, '../src/data/activities.js');
let content = fs.readFileSync(activitiesFilePath, 'utf8');

console.log(`Setting free activities to ${TARGET_PCT}%\n`);

// Parse activities
const activityBlockRegex = /createActivity\(\{[\s\S]*?id: '([^']+)'[\s\S]*?category: '([^']+)'[\s\S]*?popularityScore: (\d+),[\s\S]*?\}\),/g;
const activities = [];
let match;

while ((match = activityBlockRegex.exec(content)) !== null) {
  const block = match[0];
  const id = match[1];
  const category = match[2];
  const popularity = parseInt(match[3]);
  const hasFree = block.includes('isFree: true');
  activities.push({ id, category, popularity, hasFree });
}

console.log(`Total activities: ${activities.length}`);

// Group by category
const byCategory = {};
activities.forEach(a => {
  if (!byCategory[a.category]) {
    byCategory[a.category] = [];
  }
  byCategory[a.category].push(a);
});

// For each category, ensure TARGET_PCT% are free
// Prioritize by popularity (higher popularity = more likely to be free)
let totalMarked = 0;
let totalUnmarked = 0;

Object.entries(byCategory).forEach(([cat, catActivities]) => {
  const total = catActivities.length;
  const targetFree = Math.ceil(total * (TARGET_PCT / 100));
  const currentFree = catActivities.filter(a => a.hasFree).length;

  console.log(`\n${cat}: ${currentFree}/${total} free, target: ${targetFree}`);

  if (currentFree < targetFree) {
    // Need to mark more as free - sort by popularity desc
    const notFree = catActivities.filter(a => !a.hasFree).sort((a, b) => b.popularity - a.popularity);
    const toMark = notFree.slice(0, targetFree - currentFree);

    toMark.forEach(({ id }) => {
      const pattern = new RegExp(`(id: '${id}',[\\s\\S]*?)(popularityScore: \\d+,)`, '');
      if (content.match(pattern) && !content.match(new RegExp(`id: '${id}',[\\s\\S]*?isFree: true`))) {
        content = content.replace(pattern, '$1isFree: true,\n    $2');
        totalMarked++;
      }
    });
    console.log(`  Marked ${toMark.length} more as free`);

  } else if (currentFree > targetFree) {
    // Need to unmark some - sort by popularity asc (remove free from least popular)
    const isFree = catActivities.filter(a => a.hasFree).sort((a, b) => a.popularity - b.popularity);
    const toUnmark = isFree.slice(0, currentFree - targetFree);

    toUnmark.forEach(({ id }) => {
      // Remove isFree: true line
      const pattern = new RegExp(`(id: '${id}',[\\s\\S]*?)isFree: true,\\n    (popularityScore:)`, '');
      if (content.match(pattern)) {
        content = content.replace(pattern, '$1$2');
        totalUnmarked++;
      }
    });
    console.log(`  Unmarked ${toUnmark.length} (removed free status)`);
  } else {
    console.log(`  Already at target`);
  }
});

// Save
fs.writeFileSync(activitiesFilePath, content, 'utf8');

// Final count
const finalFree = (content.match(/isFree: true,/g) || []).length;
const totalActivities = (content.match(/createActivity\(/g) || []).length;

console.log(`\n${'='.repeat(40)}`);
console.log(`Marked as free: +${totalMarked}`);
console.log(`Unmarked (removed free): -${totalUnmarked}`);
console.log(`\nFinal: ${finalFree}/${totalActivities} free (${((finalFree/totalActivities)*100).toFixed(1)}%)`);
