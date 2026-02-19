/**
 * Script to set free activities to 60%
 * Simple approach: mark more activities as free
 */

const fs = require('fs');
const path = require('path');

const TARGET_PCT = 60;
const activitiesFilePath = path.join(__dirname, '../src/data/activities.js');
let content = fs.readFileSync(activitiesFilePath, 'utf8');

// Count current state
const currentFree = (content.match(/isFree: true,/g) || []).length;
const totalActivities = (content.match(/createActivity\(\{/g) || []).length;
const targetFree = Math.ceil(totalActivities * (TARGET_PCT / 100));
const needToMark = targetFree - currentFree;

console.log(`Current: ${currentFree}/${totalActivities} (${((currentFree/totalActivities)*100).toFixed(1)}%)`);
console.log(`Target: ${targetFree}/${totalActivities} (${TARGET_PCT}%)`);
console.log(`Need to mark: ${needToMark} more\n`);

if (needToMark <= 0) {
  console.log('Already at or above target!');
  process.exit(0);
}

// Find all activities without isFree: true
// Match: id: 'xxx', ... popularityScore: NN, (without isFree: true before popularityScore)
const allActivityIds = [];
const idRegex = /id: '([^']+)',/g;
let match;
while ((match = idRegex.exec(content)) !== null) {
  allActivityIds.push(match[1]);
}

// Check which don't have isFree
const withoutFree = allActivityIds.filter(id => {
  // Check if this ID's block has isFree: true
  const blockPattern = new RegExp(`id: '${id}',[\\s\\S]*?\\}\\),`);
  const blockMatch = content.match(blockPattern);
  if (blockMatch) {
    return !blockMatch[0].includes('isFree: true');
  }
  return false;
});

console.log(`Activities without isFree: ${withoutFree.length}`);

// Shuffle and pick
const shuffled = withoutFree.sort(() => Math.random() - 0.5);
const toMark = shuffled.slice(0, needToMark);

console.log(`Will mark: ${toMark.length}\n`);

// Mark each one
let marked = 0;
toMark.forEach(id => {
  // Add isFree: true before popularityScore
  const pattern = new RegExp(`(id: '${id}',[\\s\\S]*?)(popularityScore: \\d+,)`);
  const matchResult = content.match(pattern);

  if (matchResult && !matchResult[0].includes('isFree: true')) {
    content = content.replace(pattern, '$1isFree: true,\n    $2');
    marked++;
  }
});

console.log(`Actually marked: ${marked}`);

// Save
fs.writeFileSync(activitiesFilePath, content, 'utf8');

// Final count
const finalFree = (content.match(/isFree: true,/g) || []).length;
console.log(`\nFinal: ${finalFree}/${totalActivities} (${((finalFree/totalActivities)*100).toFixed(1)}%)`);
