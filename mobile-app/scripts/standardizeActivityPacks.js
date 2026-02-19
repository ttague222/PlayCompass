/**
 * Standardize Activity Packs
 *
 * Goal: ~50 activities per pack (400 total for 8 packs)
 *
 * Current state:
 * - Active: 97 (need to reduce by ~47)
 * - Creative: 77 (need to reduce by ~27)
 * - Educational: 53 (close, reduce by ~3)
 * - Games: 47 (close, add ~3)
 * - Social: 40 (add ~10)
 * - Outdoor: 37 (add ~13)
 * - Calm: 36 (add ~14)
 * - Music: 24 (add ~26)
 * - Practical: 2 (move to other packs)
 * - Cooking: 1 (move to creative)
 *
 * Strategy:
 * 1. Move orphan categories (practical, cooking) to appropriate packs
 * 2. For oversized packs: identify lowest quality/most redundant activities
 * 3. Report what needs to be done
 */

const fs = require('fs');
const path = require('path');

const activitiesPath = path.join(__dirname, '../src/data/activities.js');
const content = fs.readFileSync(activitiesPath, 'utf8');

// Count activities by category
const categoryMatches = content.match(/category: '[^']+'/g) || [];
const counts = {};
categoryMatches.forEach(match => {
  const cat = match.replace("category: '", '').replace("'", '');
  counts[cat] = (counts[cat] || 0) + 1;
});

console.log('Current Activity Distribution:');
console.log('==============================');
Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
  const target = 50;
  const diff = count - target;
  const status = diff > 0 ? `REDUCE by ${diff}` : diff < 0 ? `ADD ${Math.abs(diff)}` : 'PERFECT';
  console.log(`${cat.padEnd(15)} ${String(count).padStart(3)} -> 50  (${status})`);
});

const total = Object.values(counts).reduce((a, b) => a + b, 0);
console.log('------------------------------');
console.log(`Total: ${total} -> Target: 400`);

// Find practical and cooking activities to remap
console.log('\n\nOrphan Activities to Remap:');
console.log('===========================');

// Extract activity blocks for practical and cooking
const activityBlockRegex = /\{[^{}]*category:\s*'(practical|cooking)'[^{}]*\}/gs;
let match;
const orphanActivities = [];

// Read activities to find orphans
const lines = content.split('\n');
let inActivity = false;
let currentActivity = [];
let bracketCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (line.includes('createActivity({') || (inActivity && line.trim().startsWith('{'))) {
    inActivity = true;
    bracketCount = 0;
  }

  if (inActivity) {
    currentActivity.push(line);
    bracketCount += (line.match(/\{/g) || []).length;
    bracketCount -= (line.match(/\}/g) || []).length;

    if (bracketCount <= 0 && currentActivity.length > 1) {
      const activityText = currentActivity.join('\n');
      if (activityText.includes("category: 'practical'") || activityText.includes("category: 'cooking'")) {
        // Extract id and title
        const idMatch = activityText.match(/id:\s*'([^']+)'/);
        const titleMatch = activityText.match(/title:\s*'([^']+)'/);
        const catMatch = activityText.match(/category:\s*'([^']+)'/);
        if (idMatch && titleMatch) {
          orphanActivities.push({
            id: idMatch[1],
            title: titleMatch[1],
            category: catMatch[1],
            suggestedCategory: catMatch[1] === 'cooking' ? 'creative' : 'educational'
          });
        }
      }
      currentActivity = [];
      inActivity = false;
    }
  }
}

orphanActivities.forEach(a => {
  console.log(`- ${a.id}: "${a.title}"`);
  console.log(`  Current: ${a.category} -> Suggested: ${a.suggestedCategory}`);
});

// Calculate what we need
console.log('\n\nAction Plan:');
console.log('============');
console.log('1. Move practical activities (2) -> educational');
console.log('2. Move cooking activity (1) -> creative');
console.log('');
console.log('After remapping:');
const remapped = { ...counts };
remapped.educational = (remapped.educational || 0) + (remapped.practical || 0);
remapped.creative = (remapped.creative || 0) + (remapped.cooking || 0);
delete remapped.practical;
delete remapped.cooking;

Object.entries(remapped).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
  const target = 50;
  const diff = count - target;
  const status = diff > 0 ? `REDUCE by ${diff}` : diff < 0 ? `ADD ${Math.abs(diff)}` : 'PERFECT';
  console.log(`${cat.padEnd(15)} ${String(count).padStart(3)} -> 50  (${status})`);
});

console.log('\n\nRecommendation:');
console.log('===============');
console.log('Option 1: Keep variety (current total: 414)');
console.log('  - Reduce Active from 97 to 50 (-47)');
console.log('  - Reduce Creative from 78 to 50 (-28)');
console.log('  - Keep others, add content to small packs later');
console.log('');
console.log('Option 2: Strict 50 per pack');
console.log('  - Would require creating ~63 new activities for small packs');
console.log('');
console.log('Suggested: Go with Option 1 for launch');
console.log('  - Trim oversized packs');
console.log('  - Launch with 350-400 activities');
console.log('  - Add to small packs in future updates');
