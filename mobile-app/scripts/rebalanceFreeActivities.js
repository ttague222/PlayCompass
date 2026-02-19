/**
 * Rebalance Free Activities
 *
 * After removing duplicates, recalculate to maintain ~60% free per pack
 */

const fs = require('fs');
const path = require('path');

const activitiesPath = path.join(__dirname, '../src/data/activities.js');
let content = fs.readFileSync(activitiesPath, 'utf8');

// Extract activities and their current state
const activities = [];
const lines = content.split('\n');

let currentActivity = null;
let blockLines = [];
let blockStart = -1;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (line.includes("id: '")) {
    const match = line.match(/id:\s*'([^']+)'/);
    if (match) {
      if (currentActivity) {
        currentActivity.blockEnd = i - 1;
        activities.push(currentActivity);
      }
      currentActivity = {
        id: match[1],
        lineNum: i,
        blockStart: i,
        isFree: false
      };
    }
  }

  if (currentActivity) {
    if (line.includes("category: '")) {
      const match = line.match(/category:\s*'([^']+)'/);
      if (match) currentActivity.category = match[1];
    }
    if (line.includes("isFree: true")) {
      currentActivity.isFree = true;
      currentActivity.isFreeLineNum = i;
    }
    if (line.includes("title: '")) {
      const match = line.match(/title:\s*'([^']+)'/);
      if (match) currentActivity.title = match[1];
    }
  }
}

// Push last activity
if (currentActivity) {
  activities.push(currentActivity);
}

console.log(`Total activities: ${activities.length}`);
console.log(`Currently free: ${activities.filter(a => a.isFree).length}`);

// Group by category
const byCategory = {};
activities.forEach(a => {
  if (!byCategory[a.category]) byCategory[a.category] = [];
  byCategory[a.category].push(a);
});

console.log('\nCurrent Distribution:');
console.log('=====================');
Object.entries(byCategory).sort((a, b) => b[1].length - a[1].length).forEach(([cat, acts]) => {
  const freeCount = acts.filter(a => a.isFree).length;
  const pct = Math.round(freeCount / acts.length * 100);
  console.log(`${cat.padEnd(15)} ${acts.length} total, ${freeCount} free (${pct}%)`);
});

// Now set 60% free per category
console.log('\nSetting 60% free per category...');

const targetPct = 0.6;
let totalChanges = 0;

Object.entries(byCategory).forEach(([category, acts]) => {
  const targetFree = Math.round(acts.length * targetPct);
  const currentFree = acts.filter(a => a.isFree).length;

  if (currentFree === targetFree) {
    console.log(`${category}: Already at target (${currentFree}/${acts.length})`);
    return;
  }

  if (currentFree > targetFree) {
    // Remove some isFree flags
    const toRemove = currentFree - targetFree;
    const freeActs = acts.filter(a => a.isFree);
    // Remove from the end (arbitrary, could be randomized)
    for (let i = 0; i < toRemove && i < freeActs.length; i++) {
      const act = freeActs[freeActs.length - 1 - i];
      // Find and remove isFree: true from this activity
      const pattern = new RegExp(`(id:\\s*'${act.id}'[^}]*?)isFree:\\s*true,?\\s*\\n?`, 's');
      content = content.replace(pattern, '$1');
      totalChanges++;
    }
    console.log(`${category}: Removed ${toRemove} free flags (${currentFree} -> ${targetFree})`);
  } else {
    // Add some isFree flags
    const toAdd = targetFree - currentFree;
    const nonFreeActs = acts.filter(a => !a.isFree);
    // Add to activities that don't have isFree
    for (let i = 0; i < toAdd && i < nonFreeActs.length; i++) {
      const act = nonFreeActs[i];
      // Find the activity and add isFree: true after the id line
      const pattern = new RegExp(`(id:\\s*'${act.id}',)`, 's');
      content = content.replace(pattern, `$1\n    isFree: true,`);
      totalChanges++;
    }
    console.log(`${category}: Added ${toAdd} free flags (${currentFree} -> ${targetFree})`);
  }
});

// Write back
fs.writeFileSync(activitiesPath, content);

console.log(`\nTotal changes: ${totalChanges}`);

// Final verification
const finalContent = fs.readFileSync(activitiesPath, 'utf8');
const finalFreeCount = (finalContent.match(/isFree:\s*true/g) || []).length;
const finalTotal = (finalContent.match(/category:\s*'[^']+'/g) || []).length;

console.log(`\nFinal: ${finalFreeCount}/${finalTotal} free (${Math.round(finalFreeCount/finalTotal*100)}%)`);

// Breakdown by category
const catCounts = {};
const catFree = {};
const catMatches = finalContent.match(/category:\s*'([^']+)'/g) || [];
catMatches.forEach(m => {
  const cat = m.replace("category: '", '').replace("'", '');
  catCounts[cat] = (catCounts[cat] || 0) + 1;
});

// Count free per category (approximate - checks if isFree appears near category)
// This is a rough count
console.log('\nFinal Distribution:');
Object.entries(catCounts).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
  console.log(`${cat.padEnd(15)} ${count} activities`);
});
