/**
 * Script to mark a large number of activities as free
 *
 * Target: ~100-120 free activities (25-30% of 415 total)
 * This ensures users have enough variety for sustained daily engagement
 *
 * Run with: node scripts/markManyFreeActivities.js
 */

const fs = require('fs');
const path = require('path');

// Activities to mark as free - significantly expanded list
// Targeting ~12-15 per major category
const FREE_ACTIVITY_IDS = [
  // ============================================
  // ACTIVE (15 free out of ~97)
  // ============================================
  'act_001', // Dance Party
  'act_002', // Obstacle Course
  'act_003', // Bike Riding
  'act_004', // Hide and Seek
  'act_005', // Soccer in the Backyard
  'act_006', // Freeze Dance
  'act_007', // Jump Rope
  'act_008', // Tag Games
  'act_009', // Yoga for Kids
  'act_010', // Swimming
  'act_011', // Balloon Volleyball
  'act_012', // Nature Walk
  'act_016', // Scavenger Hunt
  'act_019', // Simon Says
  'act_020', // Playground Visit

  // ============================================
  // CREATIVE (15 free out of ~77)
  // ============================================
  'cre_001', // Drawing & Coloring
  'cre_002', // Playdough Creations
  'cre_003', // Painting
  'cre_004', // LEGO Building
  'cre_005', // Paper Crafts
  'cre_006', // Jewelry Making
  'cre_007', // Dress Up & Pretend Play
  'cre_008', // Puppet Show
  'cre_009', // Sidewalk Chalk Art
  'cre_010', // Build a Fort
  'cre_011', // Clay Sculpting
  'cre_012', // Tie-Dye
  'cre_013', // Cardboard Box Creations
  'cre_014', // Face Painting
  'cre_015', // Collage Making

  // ============================================
  // EDUCATIONAL (12 free out of ~53)
  // ============================================
  'edu_001', // Reading Time
  'edu_002', // Science Experiment
  'edu_003', // Puzzle Time
  'edu_004', // Counting Games
  'edu_005', // Letter Learning
  'edu_006', // Gardening
  'edu_007', // Coding for Kids
  'edu_009', // Bug Hunting
  'edu_010', // Sorting & Categorizing
  'edu_011', // Memory Games
  'edu_012', // Building Bridges
  'edu_013', // Story Writing

  // ============================================
  // GAMES (12 free out of ~47)
  // ============================================
  'gam_001', // Board Games
  'gam_002', // Card Games
  'gam_003', // Video Game Time
  'gam_004', // I Spy
  'gam_005', // 20 Questions
  'gam_006', // Charades
  'gam_007', // Dominoes
  'gam_008', // Tic-Tac-Toe
  'gam_009', // Connect Four
  'gam_010', // Jenga
  'gam_011', // Uno
  'gam_012', // Memory Match

  // ============================================
  // SOCIAL (10 free out of ~40)
  // ============================================
  'soc_001', // Playdate
  'soc_002', // Family Game Night
  'soc_003', // Tea Party
  'soc_004', // Video Call with Relatives
  'soc_005', // Show and Tell
  'soc_006', // Cooperative Building
  'soc_007', // Birthday Party Planning
  'soc_010', // Group Story Creation
  'soc_011', // Talent Show
  'soc_012', // Team Sports

  // ============================================
  // OUTDOOR (12 free out of ~37)
  // ============================================
  'out_001', // Nature Scavenger Hunt
  'out_002', // Park Visit
  'out_003', // Backyard Camping
  'out_004', // Kite Flying
  'out_005', // Fishing
  'new_021', // Stargazing
  'new_022', // Sidewalk Chalk Masterpiece
  'new_023', // Leaf Pile Fun
  'outdoor_001', // Hiking
  'outdoor_002', // Picnic
  'outdoor_003', // Beach Day
  'outdoor_004', // Zoo Visit

  // ============================================
  // CALM (10 free out of ~36)
  // ============================================
  'calm_001', // Storytime
  'calm_002', // Meditation for Kids
  'calm_003', // Quiet Reading
  'calm_004', // Journaling
  'calm_005', // Sensory Bins
  'calm_006', // Cloud Watching
  'calm_007', // Coloring Mandalas
  'calm_008', // Bubble Blowing
  'calm_009', // Quiet Puzzles
  'calm_010', // Drawing quietly

  // ============================================
  // MUSIC (8 free out of ~24)
  // ============================================
  'mus_001', // Sing-Along
  'mus_002', // Musical Instruments
  'mus_003', // Musical Chairs
  'mus_004', // Karaoke
  'mus_005', // Make Homemade Instruments
  'mus_006', // Rhythm Games
  'mus_008', // Dance Choreography
  'mus_009', // Lullaby Time

  // ============================================
  // TODDLER SPECIFIC (10 free)
  // ============================================
  'tod_001', // Peek-a-Boo
  'tod_002', // Stacking Blocks
  'tod_003', // Ball Play
  'tod_004', // Bubble Chasing
  'tod_005', // Sensory Play
  'tod_006', // Simple Songs
  'tod_007', // Finger Painting
  'tod_008', // Shape Sorting
  'tod_009', // Water Play
  'tod_010', // Animal Sounds

  // ============================================
  // SEASONAL (8 free - mix of seasons)
  // ============================================
  'season_spring_001', // Garden Planting Party
  'season_spring_002', // Puddle Jumping Adventure
  'season_summer_001', // Water Balloon Fight
  'season_summer_002', // Ice Cream Making
  'season_fall_001', // Pumpkin Decorating
  'season_fall_002', // Apple Picking
  'season_winter_001', // Snowman Building
  'season_winter_002', // Hot Cocoa Party

  // ============================================
  // BONDING / FAMILY (6 free)
  // ============================================
  'bond_001', // Parent-Child Reading
  'bond_002', // Cooking Together
  'bond_003', // Photo Album Time
  'bond_004', // Family Walk
  'bond_005', // Movie Night
  'bond_006', // Game Night

  // ============================================
  // QUICK ACTIVITIES (8 free)
  // ============================================
  'quick_001', // Quick Dance Break
  'quick_002', // Thumb Wrestling
  'quick_003', // Rock Paper Scissors
  'quick_004', // Silly Faces
  'quick_005', // High Five Games
  'quick_006', // Counting Challenge
  'quick_007', // Rhyming Game
  'quick_008', // Color Hunt

  // ============================================
  // NEW ACTIVITIES (10 free)
  // ============================================
  'new_001', // Building blocks
  'new_002', // Puppet making
  'new_003', // Treasure hunt
  'new_004', // Pillow fort
  'new_005', // Shadow puppets
  'new_006', // Obstacle race
  'new_007', // Animal charades
  'new_008', // Story telling
  'new_009', // Nature collage
  'new_010', // Simple science
];

const activitiesFilePath = path.join(__dirname, '../src/data/activities.js');

// Read the file
let content = fs.readFileSync(activitiesFilePath, 'utf8');

// Count results
let markedCount = 0;
let alreadyMarked = 0;
let notFound = 0;

// For each free activity ID, add isFree: true
FREE_ACTIVITY_IDS.forEach(actId => {
  // Check if already marked
  const alreadyHasIsFree = new RegExp(`id: '${actId}',[\\s\\S]*?isFree: true`).test(content);
  if (alreadyHasIsFree) {
    alreadyMarked++;
    return;
  }

  // Pattern to find the activity and add isFree: true before popularityScore
  const pattern = new RegExp(
    `(id: '${actId}',[\\s\\S]*?)(popularityScore: \\d+,)`,
    'g'
  );

  const match = content.match(pattern);
  if (match) {
    content = content.replace(pattern, '$1isFree: true,\n    $2');
    markedCount++;
    console.log(`✓ ${actId}`);
  } else {
    notFound++;
    console.log(`✗ ${actId} - not found`);
  }
});

// Write the updated file
fs.writeFileSync(activitiesFilePath, content, 'utf8');

console.log(`\n===================`);
console.log(`Newly marked: ${markedCount}`);
console.log(`Already free: ${alreadyMarked}`);
console.log(`Not found: ${notFound}`);
console.log(`Total attempted: ${FREE_ACTIVITY_IDS.length}`);

// Count total free in file
const totalFree = (content.match(/isFree: true/g) || []).length;
const totalActivities = (content.match(/createActivity\(/g) || []).length;
console.log(`\n===================`);
console.log(`Total free activities: ${totalFree}`);
console.log(`Total activities: ${totalActivities}`);
console.log(`Free percentage: ${((totalFree / totalActivities) * 100).toFixed(1)}%`);
