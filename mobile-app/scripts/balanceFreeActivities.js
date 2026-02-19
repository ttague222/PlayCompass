/**
 * Script to balance free activities across categories
 * Ensures each category has roughly 30% free
 *
 * Run with: node scripts/balanceFreeActivities.js
 */

const fs = require('fs');
const path = require('path');

const activitiesFilePath = path.join(__dirname, '../src/data/activities.js');
let content = fs.readFileSync(activitiesFilePath, 'utf8');

// Parse activities
const activityBlockRegex = /createActivity\(\{[\s\S]*?id: '([^']+)'[\s\S]*?category: '([^']+)'[\s\S]*?popularityScore: \d+,[\s\S]*?\}\),/g;
const activities = [];
let match;

while ((match = activityBlockRegex.exec(content)) !== null) {
  const block = match[0];
  const id = match[1];
  const category = match[2];
  const hasFree = block.includes('isFree: true');
  activities.push({ id, category, hasFree });
}

// Group by category
const byCategory = {};
activities.forEach(a => {
  if (!byCategory[a.category]) {
    byCategory[a.category] = { free: [], notFree: [] };
  }
  if (a.hasFree) {
    byCategory[a.category].free.push(a.id);
  } else {
    byCategory[a.category].notFree.push(a.id);
  }
});

console.log('Current distribution:');
Object.entries(byCategory).forEach(([cat, { free, notFree }]) => {
  const total = free.length + notFree.length;
  const pct = ((free.length / total) * 100).toFixed(0);
  console.log(`  ${cat}: ${free.length}/${total} (${pct}%)`);
});

// Target: 30% free per category
const targetPct = 0.30;
let totalMarked = 0;

Object.entries(byCategory).forEach(([cat, { free, notFree }]) => {
  const total = free.length + notFree.length;
  const targetFree = Math.ceil(total * targetPct);
  const needMore = targetFree - free.length;

  if (needMore > 0) {
    console.log(`\n${cat}: Need ${needMore} more free`);

    // Shuffle and pick
    const shuffled = notFree.sort(() => Math.random() - 0.5);
    const toMark = shuffled.slice(0, needMore);

    toMark.forEach(id => {
      const pattern = new RegExp(
        `(id: '${id}',[\\s\\S]*?)(popularityScore: \\d+,)`,
        ''
      );
      if (content.match(pattern)) {
        content = content.replace(pattern, '$1isFree: true,\n    $2');
        totalMarked++;
      }
    });
  }
});

// Save
fs.writeFileSync(activitiesFilePath, content, 'utf8');

// Final count
console.log(`\n===================`);
console.log(`Marked ${totalMarked} more as free`);

// Recount
const finalFree = (content.match(/isFree: true,/g) || []).length;
const totalActivities = (content.match(/createActivity\(/g) || []).length;
console.log(`Total free: ${finalFree} / ${totalActivities} (${((finalFree/totalActivities)*100).toFixed(0)}%)`);
