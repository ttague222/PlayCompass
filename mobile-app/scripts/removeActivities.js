/**
 * Remove Duplicate/Redundant Activities
 *
 * Removes activities by ID to standardize pack sizes
 */

const fs = require('fs');
const path = require('path');

const activitiesPath = path.join(__dirname, '../src/data/activities.js');
let content = fs.readFileSync(activitiesPath, 'utf8');

// Activities to remove - carefully selected duplicates and redundant variations
const activitiesToRemove = [
  // ACTIVE - removing duplicates and redundant variations (47 removals: 97 -> 50)
  'both_001',        // "Dance Freeze" - duplicate of act_006
  'new_009',         // "Balloon Volleyball" - duplicate of act_011
  'both_004',        // "Balloon Volleyball" - duplicate of act_011
  'both_007',        // "Hula Hooping" - duplicate of act_015
  'both_019',        // "Balance Challenges" - duplicate of quick_008
  'out_006',         // "Puddle Jumping" - duplicate of new_012
  'outdoor_high_001', // "Capture the Flag" - duplicate of new_042
  'energy_009',      // "Kickball Game" - duplicate of new_045
  'outdoor_high_003', // "Kickball Game" - duplicate of new_045
  'out_028',         // "Outdoor Obstacle Course" - similar to act_002
  'new_044',         // "Bike Riding Adventure" - similar to act_003
  'both_008',        // "Jump Rope Games" - similar to act_007
  'outdoor_high_011', // "Jump Rope Marathon" - similar to act_007
  'outdoor_high_006', // "Tag Game Marathon" - similar to act_008
  'new_011',         // "Simon Says Workout" - similar to act_019
  // Remove "both_" prefixed duplicates (indoor/outdoor variations)
  'both_002', 'both_003', 'both_005', 'both_006', 'both_009', 'both_010',
  'both_011', 'both_012', 'both_013', 'both_014', 'both_015', 'both_016',
  'both_017', 'both_018', 'both_020',
  // Remove high-energy variations covered by main activities
  'outdoor_high_002', 'outdoor_high_004', 'outdoor_high_005', 'outdoor_high_007',
  'outdoor_high_008', 'outdoor_high_009', 'outdoor_high_010', 'outdoor_high_012',
  'outdoor_high_013', 'outdoor_high_014', 'outdoor_high_015',
  // Remove energy_ prefixed duplicates
  'energy_001', 'energy_002', 'energy_003', 'energy_004', 'energy_005',
  'energy_006', 'energy_007', 'energy_008', 'energy_010',
  // Remove quick_ active activities (quick activities are duplicates)
  'quick_001', 'quick_002', 'quick_003', 'quick_004', 'quick_005',
  'quick_006', 'quick_007', 'quick_008',

  // CREATIVE - removing duplicates (28 removals: 78 -> 50)
  'out_009',         // "Sidewalk Chalk Art" - duplicate of cre_009
  'cre_016',         // "Tie-Dye" - duplicate of cre_012
  'new_035',         // "Comic Book Creation" - duplicate of cre_017
  'teen_007',        // "Photography Walk" - duplicate of cre_018
  'new_032',         // "Rock Painting" - duplicate of cre_025
  'new_030',         // "Sock Puppet Show" - similar to cre_008
  'new_026',         // "Build a Blanket Fort" - similar to cre_010
  'tod_011',         // "Cardboard Box Play" - similar to cre_013
  'new_001',         // "Cardboard Box City" - similar to cre_013
  'new_034',         // "Friendship Bracelet Making" - similar to cre_021
  // Remove cook_ prefixed (duplicates now in creative)
  'cook_001', 'cook_002', 'cook_003', 'cook_004', 'cook_005',
  'cook_006', 'cook_007', 'cook_008', 'cook_009', 'cook_010',
  // Remove teen_ variations
  'teen_001', 'teen_002', 'teen_003', 'teen_004', 'teen_005',
  'teen_006', 'teen_008', 'teen_009', 'teen_010',

  // EDUCATIONAL - removing duplicates (5 removals: 55 -> 50)
  'quick_021',       // "Counting Game" - duplicate of edu_004
  'out_004',         // "Bug Hunt" - duplicate of edu_009
  'edu_021',         // "Sorting & Categorizing" - duplicate of edu_011
  'edu_010',         // "Bird Watching" - duplicate (keep out_012 in outdoor)
  'quick_022',       // Educational quick activity

  // GAMES - remove one to balance (keeping at ~46 after others adjust)
  'quick_013',       // Quick game variant
];

console.log('Removing duplicate/redundant activities...\n');

let removedCount = 0;
const notFound = [];

// Process each activity to remove
activitiesToRemove.forEach(id => {
  // Match createActivity block for this ID
  // Pattern: createActivity({ ... id: 'xxx', ... }),
  const patterns = [
    // Pattern 1: Standard createActivity block
    new RegExp(`\\s*createActivity\\(\\{[^}]*id:\\s*'${id}'[^}]*(?:\\{[^}]*\\}[^}]*)*\\}\\),?\\n?`, 'g'),
    // Pattern 2: Direct object in array with id
    new RegExp(`\\s*\\{[^{}]*id:\\s*'${id}'[^{}]*(?:\\{[^{}]*\\}[^{}]*)*\\},?\\n?`, 'g'),
  ];

  let found = false;
  for (const pattern of patterns) {
    if (pattern.test(content)) {
      content = content.replace(pattern, '\n');
      found = true;
      removedCount++;
      break;
    }
  }

  if (!found) {
    notFound.push(id);
  }
});

// Clean up any double newlines
content = content.replace(/\n{3,}/g, '\n\n');

// Write back
fs.writeFileSync(activitiesPath, content);

console.log(`Removed: ${removedCount} activities`);
if (notFound.length > 0) {
  console.log(`Not found: ${notFound.length}`);
  console.log('Missing IDs:', notFound.slice(0, 10).join(', ') + (notFound.length > 10 ? '...' : ''));
}

// Verify final counts
const categoryMatches = content.match(/category:\s*'[^']+'/g) || [];
const counts = {};
categoryMatches.forEach(match => {
  const cat = match.replace("category: '", '').replace("'", '');
  counts[cat] = (counts[cat] || 0) + 1;
});

console.log('\nFinal Activity Distribution:');
console.log('============================');
Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
  const target = 50;
  const diff = count - target;
  const status = diff > 5 ? '⚠️  HIGH' : diff < -5 ? '⚠️  LOW' : '✓';
  console.log(`${cat.padEnd(15)} ${String(count).padStart(3)} ${status}`);
});
console.log('----------------------------');
console.log(`Total: ${Object.values(counts).reduce((a, b) => a + b, 0)}`);
