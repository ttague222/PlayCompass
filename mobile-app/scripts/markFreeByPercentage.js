/**
 * Script to mark ~30% of activities as free
 *
 * Run with: node scripts/markFreeByPercentage.js
 */

const fs = require('fs');
const path = require('path');

const activitiesFilePath = path.join(__dirname, '../src/data/activities.js');
let content = fs.readFileSync(activitiesFilePath, 'utf8');

// Count current free activities
const currentFree = (content.match(/isFree: true,/g) || []).length;
console.log(`Currently free: ${currentFree}`);

// Count total activities
const totalActivities = (content.match(/createActivity\(\{/g) || []).length;
console.log(`Total activities: ${totalActivities}`);

// Target: 30% = ~124 free
const targetFree = Math.floor(totalActivities * 0.30);
const needToMark = targetFree - currentFree;

console.log(`\nTarget: ${targetFree} free (30%)`);
console.log(`Need to mark: ${needToMark} more`);

if (needToMark <= 0) {
  console.log('Already have enough free activities!');
  process.exit(0);
}

// Get all activity blocks that DON'T have isFree: true
// Find activities by looking for id: 'xxx', ... popularityScore: without isFree in between
const activityBlockRegex = /createActivity\(\{[\s\S]*?id: '([^']+)'[\s\S]*?popularityScore: \d+,[\s\S]*?\}\),/g;
const allActivities = [];
let match;

const contentCopy = content;
while ((match = activityBlockRegex.exec(contentCopy)) !== null) {
  const block = match[0];
  const id = match[1];
  const hasFree = block.includes('isFree: true');
  allActivities.push({ id, hasFree, block });
}

console.log(`\nParsed ${allActivities.length} activities`);

const withoutFree = allActivities.filter(a => !a.hasFree);
console.log(`Activities without isFree: ${withoutFree.length}`);

// Shuffle and select
const shuffled = withoutFree.sort(() => Math.random() - 0.5);
const toMark = shuffled.slice(0, needToMark);

console.log(`\nMarking ${toMark.length} activities...`);

// Mark each one
let marked = 0;
toMark.forEach(({ id }) => {
  // Add isFree: true before popularityScore
  const pattern = new RegExp(
    `(id: '${id}',[\\s\\S]*?)(popularityScore: \\d+,)`,
    ''
  );

  if (content.match(pattern)) {
    content = content.replace(pattern, '$1isFree: true,\n    $2');
    marked++;
    if (marked % 10 === 0) {
      console.log(`  Marked ${marked}...`);
    }
  } else {
    console.log(`  Could not mark ${id}`);
  }
});

// Save
fs.writeFileSync(activitiesFilePath, content, 'utf8');

// Final count
const finalFree = (content.match(/isFree: true,/g) || []).length;
console.log(`\n===================`);
console.log(`Marked: ${marked}`);
console.log(`Total free now: ${finalFree}`);
console.log(`Percentage: ${((finalFree / totalActivities) * 100).toFixed(1)}%`);
