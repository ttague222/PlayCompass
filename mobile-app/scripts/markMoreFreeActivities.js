/**
 * Script to mark additional activities as free
 * Run with: node scripts/markMoreFreeActivities.js
 */

const fs = require('fs');
const path = require('path');

// Additional activities to mark as free - getting to ~45 total
const MORE_FREE_ACTIVITY_IDS = [
  // More ACTIVE
  'act_003', // Bike Riding - 88
  'act_005', // Soccer - 85
  'act_016', // Scavenger Hunt - 88

  // More CREATIVE
  'cre_009', // Sidewalk Chalk Art - 85
  'cre_013', // Cardboard Box Creations - 85

  // More EDUCATIONAL
  'edu_004', // Counting Games - 75
  'edu_005', // Letter Learning - 78

  // More OUTDOOR
  'out_002', // Park Visit - ?
  'season_spring_001', // Garden Planting - 88
  'season_summer_001', // Water Balloon Fight - ?

  // More CALM
  'calm_009', // Quiet Puzzles
  'calm_010', // Drawing quietly

  // More SOCIAL
  'soc_007', // Birthday Party prep
  'bond_001', // Parent-child bonding
];

const activitiesFilePath = path.join(__dirname, '../src/data/activities.js');

let content = fs.readFileSync(activitiesFilePath, 'utf8');
let markedCount = 0;
let alreadyMarked = 0;

MORE_FREE_ACTIVITY_IDS.forEach(actId => {
  const alreadyHasIsFree = new RegExp(`id: '${actId}',[\\s\\S]*?isFree: true`).test(content);
  if (alreadyHasIsFree) {
    alreadyMarked++;
    console.log(`- ${actId} already marked as free`);
    return;
  }

  const pattern = new RegExp(
    `(id: '${actId}',[\\s\\S]*?)(popularityScore: \\d+,)`,
    'g'
  );

  const match = content.match(pattern);
  if (match) {
    content = content.replace(pattern, '$1isFree: true,\n    $2');
    markedCount++;
    console.log(`✓ Marked ${actId} as free`);
  } else {
    console.log(`✗ Could not find activity ${actId}`);
  }
});

fs.writeFileSync(activitiesFilePath, content, 'utf8');

console.log(`\n===================`);
console.log(`Newly marked: ${markedCount} activities`);
console.log(`Already free: ${alreadyMarked} activities`);
