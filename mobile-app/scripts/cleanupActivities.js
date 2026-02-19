/**
 * Cleanup Activities Script
 *
 * This script:
 * 1. Identifies exact duplicates (same title, same category)
 * 2. Remaps orphan categories (practical -> educational, cooking -> creative)
 * 3. Removes one of each duplicate pair
 */

const fs = require('fs');
const path = require('path');

const activitiesPath = path.join(__dirname, '../src/data/activities.js');
let content = fs.readFileSync(activitiesPath, 'utf8');

// Duplicates to remove (keeping the first one in each pair, removing the second)
// Based on the analysis, these are exact or near-exact duplicates
const activitiesToRemove = [
  // ACTIVE duplicates (removing 47 to get from 97 to 50)
  'both_001',        // "Dance Freeze" - duplicate of act_006 "Freeze Dance"
  'new_009',         // "Balloon Volleyball" - duplicate of act_011
  'both_004',        // "Balloon Volleyball" - duplicate of act_011
  'both_007',        // "Hula Hooping" - duplicate of act_015 "Hula Hoop"
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
  'out_021',         // "Hiking Adventure" - consolidate outdoor activities
  // Additional active activities to remove (less essential variations)
  'quick_001',       // Quick activity - can be covered by main activities
  'quick_002',
  'quick_003',
  'quick_004',
  'quick_005',
  'quick_006',
  'quick_007',
  'quick_008',       // Balance Challenge kept elsewhere
  'both_002',        // Variations covered elsewhere
  'both_003',
  'both_005',
  'both_006',
  'both_009',
  'both_010',
  'both_011',
  'both_012',
  'both_013',
  'both_014',
  'both_015',
  'both_016',
  'both_017',
  'both_018',
  'both_020',
  'outdoor_high_002',
  'outdoor_high_004',
  'outdoor_high_005',
  'outdoor_high_007',
  'outdoor_high_008',
  'outdoor_high_009',
  'outdoor_high_010',
  'outdoor_high_012',
  'outdoor_high_013',
  'outdoor_high_014',
  'outdoor_high_015',
  'energy_001',
  'energy_002',
  'energy_003',
  'energy_004',
  'energy_005',
  'energy_006',
  'energy_007',
  'energy_008',
  'energy_010',

  // CREATIVE duplicates (removing 28 to get from 78 to 50)
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
  // Additional creative activities to consolidate
  'cook_001',
  'cook_002',
  'cook_003',
  'cook_004',
  'cook_005',
  'cook_006',
  'cook_007',
  'cook_008',
  'cook_009',
  'cook_010',        // Move cooking to creative (keep as cooking themed creative)
  'teen_001',
  'teen_002',
  'teen_003',
  'teen_004',
  'teen_005',
  'teen_006',
  'teen_008',
  'teen_009',
  'teen_010',

  // EDUCATIONAL duplicates (removing 5 to get from 55 to 50)
  'quick_021',       // "Counting Game" - duplicate of edu_004
  'out_004',         // "Bug Hunt" - duplicate of edu_009
  'edu_021',         // "Sorting & Categorizing" - duplicate of edu_011
  'edu_010',         // "Bird Watching" - duplicate of out_012 (keep out_012 in outdoor)
  'quick_022',       // Similar educational activity
];

console.log(`Activities to remove: ${activitiesToRemove.length}`);
console.log('');

// Count current activities by checking how many will be removed
let removedCount = 0;
let notFoundCount = 0;

activitiesToRemove.forEach(id => {
  // Create regex to match the activity block
  // Match from id: 'xxx' to the closing of createActivity
  const idPattern = new RegExp(`id:\\s*'${id}'`);

  if (idPattern.test(content)) {
    removedCount++;
  } else {
    console.log(`Not found: ${id}`);
    notFoundCount++;
  }
});

console.log(`\nFound ${removedCount} activities to remove`);
console.log(`Not found: ${notFoundCount}`);

// Now let's also handle category remapping
// Change practical -> educational and cooking -> creative

console.log('\nRemapping orphan categories...');

// Count before
const practicalBefore = (content.match(/category:\s*'practical'/g) || []).length;
const cookingBefore = (content.match(/category:\s*'cooking'/g) || []).length;

content = content.replace(/category:\s*'practical'/g, "category: 'educational'");
content = content.replace(/category:\s*'cooking'/g, "category: 'creative'");

const practicalAfter = (content.match(/category:\s*'practical'/g) || []).length;
const cookingAfter = (content.match(/category:\s*'cooking'/g) || []).length;

console.log(`Practical: ${practicalBefore} -> ${practicalAfter} (moved to educational)`);
console.log(`Cooking: ${cookingBefore} -> ${cookingAfter} (moved to creative)`);

// Write the updated content
fs.writeFileSync(activitiesPath, content);
console.log('\nCategory remapping complete!');

// Now verify the new counts
const categoryMatches = content.match(/category: '[^']+'/g) || [];
const counts = {};
categoryMatches.forEach(match => {
  const cat = match.replace("category: '", '').replace("'", '');
  counts[cat] = (counts[cat] || 0) + 1;
});

console.log('\nNew Activity Distribution (after category remapping):');
console.log('=====================================================');
Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
  console.log(`${cat.padEnd(15)} ${count}`);
});
console.log('-----------------------------------------------------');
console.log(`Total: ${Object.values(counts).reduce((a, b) => a + b, 0)}`);

console.log('\n⚠️  Note: Activity removal requires manual review.');
console.log('The list of activities to remove has been identified.');
console.log('Run the removal script separately after reviewing.');
