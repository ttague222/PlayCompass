/**
 * Script to mark selected activities as free
 *
 * Run with: node scripts/markFreeActivities.js
 *
 * This marks ~5-6 of the best activities per category as free
 * to ensure free users get value while premium remains attractive.
 */

const fs = require('fs');
const path = require('path');

// Activities to mark as free (by ID)
// Selected based on: high popularity, variety of age groups, different durations/locations
const FREE_ACTIVITY_IDS = [
  // ACTIVE (6 free) - Popular, versatile activities
  'act_001', // Dance Party - 95
  'act_002', // Obstacle Course - 90
  'act_004', // Hide and Seek - 92
  'act_006', // Freeze Dance - 88
  'act_008', // Tag Games - 90
  'act_019', // Simon Says - 85

  // CREATIVE (6 free) - Core crafts and play
  'cre_001', // Drawing & Coloring - 90
  'cre_002', // Playdough Creations - 92
  'cre_003', // Painting - 88
  'cre_004', // LEGO Building - 95
  'cre_007', // Dress Up & Pretend Play - 90
  'cre_010', // Build a Fort - 92

  // EDUCATIONAL (5 free) - Learning essentials
  'edu_001', // Reading Time - 90
  'edu_002', // Science Experiment - 88
  'edu_003', // Puzzle Time - 85
  'edu_006', // Gardening - 80
  'edu_011', // Memory Games - 82

  // GAMES (5 free) - Classic games
  'gam_001', // Board Games - 92
  'gam_002', // Card Games - 88
  'gam_003', // Video Game Time - 90
  'gam_004', // I Spy - 85
  'gam_006', // Charades - 85

  // SOCIAL (5 free) - Group activities
  'soc_001', // Playdate - 90
  'soc_002', // Family Game Night - 92
  'soc_003', // Tea Party - 78
  'soc_005', // Show and Tell - 72
  'soc_006', // Cooperative Building - 80

  // OUTDOOR (5 free) - Nature & exploration
  'out_001', // Nature Scavenger Hunt - 92
  'out_003', // Backyard Camping - 89
  'new_021', // Stargazing - 85
  'new_022', // Sidewalk Chalk Masterpiece - 88
  'new_023', // Leaf Pile Fun - 87

  // CALM (5 free) - Relaxation
  'calm_001', // Storytime - 88
  'calm_003', // Quiet Reading - 82
  'calm_005', // Sensory Bins - 85
  'calm_006', // Cloud Watching - 75
  'calm_008', // Bubble Blowing - 90

  // MUSIC (4 free) - Musical activities
  'mus_001', // Sing-Along - 88
  'mus_002', // Musical Instruments - 82
  'mus_003', // Musical Chairs - 85
  'mus_004', // Karaoke - 80
];

const activitiesFilePath = path.join(__dirname, '../src/data/activities.js');

// Read the file
let content = fs.readFileSync(activitiesFilePath, 'utf8');

// Count how many activities we're marking
let markedCount = 0;
let alreadyMarked = 0;

// For each free activity ID, add isFree: true to its createActivity call
FREE_ACTIVITY_IDS.forEach(actId => {
  // Check if already marked
  const alreadyHasIsFree = new RegExp(`id: '${actId}',[\\s\\S]*?isFree: true`).test(content);
  if (alreadyHasIsFree) {
    alreadyMarked++;
    console.log(`- ${actId} already marked as free`);
    return;
  }

  // Pattern to find the activity and add isFree: true before popularityScore
  const pattern = new RegExp(
    `(id: '${actId}',[\\s\\S]*?)(popularityScore: \\d+,)`,
    'g'
  );

  const match = content.match(pattern);
  if (match) {
    // Add isFree: true before popularityScore
    content = content.replace(pattern, '$1isFree: true,\n    $2');
    markedCount++;
    console.log(`✓ Marked ${actId} as free`);
  } else {
    console.log(`✗ Could not find activity ${actId}`);
  }
});

// Write the updated file
fs.writeFileSync(activitiesFilePath, content, 'utf8');

console.log(`\n===================`);
console.log(`Newly marked: ${markedCount} activities`);
console.log(`Already free: ${alreadyMarked} activities`);
console.log(`Total free: ${markedCount + alreadyMarked} activities`);
console.log(`\nFree activities will provide value to non-paying users`);
