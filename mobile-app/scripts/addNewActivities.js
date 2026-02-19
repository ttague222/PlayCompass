/**
 * Add New Activities to Smaller Packs
 *
 * Current counts:
 * - Music: 23 (need +27 to reach 50)
 * - Calm: 34 (need +16 to reach 50)
 * - Outdoor: 34 (need +16 to reach 50)
 * - Games: 36 (need +14 to reach 50)
 * - Social: 37 (need +13 to reach 50)
 *
 * Total new activities needed: 86
 */

const fs = require('fs');
const path = require('path');

const activitiesPath = path.join(__dirname, '../src/data/activities.js');
let content = fs.readFileSync(activitiesPath, 'utf8');

// New activities to add - organized by category
const newActivities = {
  music: [
    { id: 'mus_new_001', title: 'Dance Choreography', description: 'Learn or create dance moves to a favorite song', emoji: '🕺', ageGroups: ['early_elementary', 'late_elementary', 'middle_school', 'high_school'], energy: 'high', materials: 'tech' },
    { id: 'mus_new_002', title: 'Music Video Creation', description: 'Film a music video to a favorite song', emoji: '🎬', ageGroups: ['late_elementary', 'middle_school', 'high_school'], energy: 'high', materials: 'tech' },
    { id: 'mus_new_003', title: 'Songwriter Workshop', description: 'Write original song lyrics together', emoji: '✍️', ageGroups: ['early_elementary', 'late_elementary', 'middle_school', 'high_school'], energy: 'low', materials: 'basic' },
    { id: 'mus_new_004', title: 'Drum Circle', description: 'Make rhythms together using drums or household items', emoji: '🪘', ageGroups: ['toddler', 'preschool', 'early_elementary', 'late_elementary'], energy: 'medium', materials: 'basic' },
    { id: 'mus_new_005', title: 'Name That Tune', description: 'Guess songs from short clips or hummed melodies', emoji: '🎵', ageGroups: ['preschool', 'early_elementary', 'late_elementary', 'middle_school'], energy: 'low', materials: 'tech' },
    { id: 'mus_new_006', title: 'Action Song Time', description: 'Sing songs with movements like Head Shoulders Knees and Toes', emoji: '🙆', ageGroups: ['toddler', 'preschool', 'early_elementary'], energy: 'medium', materials: 'none' },
    { id: 'mus_new_007', title: 'Lullaby Hour', description: 'Sing or listen to calming lullabies together', emoji: '🌙', ageGroups: ['toddler', 'preschool'], energy: 'low', materials: 'none' },
    { id: 'mus_new_008', title: 'Sound Effects Story', description: 'Add sound effects and music to a story', emoji: '📖', ageGroups: ['preschool', 'early_elementary', 'late_elementary'], energy: 'low', materials: 'basic' },
    { id: 'mus_new_009', title: 'Musical Genre Exploration', description: 'Listen to and discuss different music styles', emoji: '🎧', ageGroups: ['early_elementary', 'late_elementary', 'middle_school', 'high_school'], energy: 'low', materials: 'tech' },
    { id: 'mus_new_010', title: 'Band Practice', description: 'Form a family band with real or pretend instruments', emoji: '🎸', ageGroups: ['preschool', 'early_elementary', 'late_elementary', 'middle_school'], energy: 'medium', materials: 'special' },
    { id: 'mus_new_011', title: 'Musical Freeze Tag', description: 'Play freeze tag with music - freeze when music stops', emoji: '🏃', ageGroups: ['toddler', 'preschool', 'early_elementary'], energy: 'high', materials: 'tech' },
    { id: 'mus_new_012', title: 'Sound Scavenger Hunt', description: 'Find objects that make different sounds', emoji: '🔍', ageGroups: ['toddler', 'preschool', 'early_elementary'], energy: 'medium', materials: 'none' },
    { id: 'mus_new_013', title: 'Air Guitar Contest', description: 'Rock out with imaginary instruments', emoji: '🎸', ageGroups: ['preschool', 'early_elementary', 'late_elementary', 'middle_school'], energy: 'high', materials: 'tech' },
    { id: 'mus_new_014', title: 'Music Appreciation Time', description: 'Listen to classical or world music and share thoughts', emoji: '🎻', ageGroups: ['early_elementary', 'late_elementary', 'middle_school', 'high_school'], energy: 'low', materials: 'tech' },
    { id: 'mus_new_015', title: 'Rap Battle Fun', description: 'Create silly family-friendly raps', emoji: '🎤', ageGroups: ['late_elementary', 'middle_school', 'high_school'], energy: 'medium', materials: 'none' },
    { id: 'mus_new_016', title: 'Music and Movement', description: 'Move freely expressing how the music makes you feel', emoji: '💫', ageGroups: ['toddler', 'preschool', 'early_elementary'], energy: 'medium', materials: 'tech' },
    { id: 'mus_new_017', title: 'Playlist Creation', description: 'Create themed playlists together', emoji: '📝', ageGroups: ['early_elementary', 'late_elementary', 'middle_school', 'high_school'], energy: 'low', materials: 'tech' },
    { id: 'mus_new_018', title: 'Nursery Rhyme Time', description: 'Sing classic nursery rhymes together', emoji: '🐑', ageGroups: ['toddler', 'preschool'], energy: 'low', materials: 'none' },
    { id: 'mus_new_019', title: 'Musical Story Time', description: 'Read books with musical themes or soundtracks', emoji: '📚', ageGroups: ['toddler', 'preschool', 'early_elementary'], energy: 'low', materials: 'basic' },
    { id: 'mus_new_020', title: 'Concert at Home', description: 'Put on a family concert with costumes and tickets', emoji: '🎪', ageGroups: ['preschool', 'early_elementary', 'late_elementary'], energy: 'medium', materials: 'basic' },
    { id: 'mus_new_021', title: 'Song Parody Creation', description: 'Rewrite lyrics to popular songs with silly words', emoji: '😂', ageGroups: ['early_elementary', 'late_elementary', 'middle_school'], energy: 'low', materials: 'none' },
    { id: 'mus_new_022', title: 'Music Bingo', description: 'Play bingo with song titles or instruments', emoji: '🎯', ageGroups: ['early_elementary', 'late_elementary', 'middle_school'], energy: 'low', materials: 'basic' },
    { id: 'mus_new_023', title: 'Body Percussion', description: 'Make music using only your body - claps, snaps, stomps', emoji: '👐', ageGroups: ['toddler', 'preschool', 'early_elementary', 'late_elementary'], energy: 'medium', materials: 'none' },
    { id: 'mus_new_024', title: 'Lip Sync Battle', description: 'Perform dramatic lip sync performances', emoji: '👄', ageGroups: ['early_elementary', 'late_elementary', 'middle_school', 'high_school'], energy: 'medium', materials: 'tech' },
    { id: 'mus_new_025', title: 'Musical Alphabet', description: 'Find songs that start with each letter of the alphabet', emoji: '🔤', ageGroups: ['early_elementary', 'late_elementary'], energy: 'low', materials: 'tech' },
    { id: 'mus_new_026', title: 'Tempo Games', description: 'Move fast or slow matching the music tempo', emoji: '⏱️', ageGroups: ['toddler', 'preschool', 'early_elementary'], energy: 'medium', materials: 'tech' },
    { id: 'mus_new_027', title: 'Music Memory Game', description: 'Match pairs of instrument sounds or song clips', emoji: '🧠', ageGroups: ['preschool', 'early_elementary', 'late_elementary'], energy: 'low', materials: 'tech' },
  ],
  calm: [
    { id: 'calm_new_001', title: 'Guided Meditation', description: 'Follow a kid-friendly guided meditation', emoji: '🧘', ageGroups: ['early_elementary', 'late_elementary', 'middle_school', 'high_school'], energy: 'low', materials: 'tech' },
    { id: 'calm_new_002', title: 'Gratitude Journal', description: 'Write or draw things you are thankful for', emoji: '📓', ageGroups: ['early_elementary', 'late_elementary', 'middle_school', 'high_school'], energy: 'low', materials: 'basic' },
    { id: 'calm_new_003', title: 'Cloud Watching', description: 'Lay back and find shapes in the clouds', emoji: '☁️', ageGroups: ['toddler', 'preschool', 'early_elementary', 'late_elementary'], energy: 'low', materials: 'none' },
    { id: 'calm_new_004', title: 'Gentle Stretching', description: 'Do simple stretches and yoga poses', emoji: '🤸', ageGroups: ['toddler', 'preschool', 'early_elementary', 'late_elementary', 'middle_school'], energy: 'low', materials: 'none' },
    { id: 'calm_new_005', title: 'Sensory Bin Play', description: 'Explore textures in a calming sensory bin', emoji: '🫧', ageGroups: ['toddler', 'preschool', 'early_elementary'], energy: 'low', materials: 'special' },
    { id: 'calm_new_006', title: 'Stargazing', description: 'Look at the night sky and find constellations', emoji: '⭐', ageGroups: ['preschool', 'early_elementary', 'late_elementary', 'middle_school', 'high_school'], energy: 'low', materials: 'none' },
    { id: 'calm_new_007', title: 'Breathing Exercises', description: 'Practice calming breathing techniques', emoji: '🌬️', ageGroups: ['preschool', 'early_elementary', 'late_elementary', 'middle_school', 'high_school'], energy: 'low', materials: 'none' },
    { id: 'calm_new_008', title: 'Worry Dolls', description: 'Make or use worry dolls to share concerns', emoji: '🪆', ageGroups: ['preschool', 'early_elementary', 'late_elementary'], energy: 'low', materials: 'basic' },
    { id: 'calm_new_009', title: 'Quiet Reading Corner', description: 'Set up a cozy reading nook and read together', emoji: '📖', ageGroups: ['toddler', 'preschool', 'early_elementary', 'late_elementary', 'middle_school'], energy: 'low', materials: 'basic' },
    { id: 'calm_new_010', title: 'Aromatherapy Play', description: 'Explore calming scents like lavender', emoji: '🌸', ageGroups: ['preschool', 'early_elementary', 'late_elementary'], energy: 'low', materials: 'special' },
    { id: 'calm_new_011', title: 'Mindful Coloring', description: 'Color intricate patterns mindfully', emoji: '🖍️', ageGroups: ['early_elementary', 'late_elementary', 'middle_school', 'high_school'], energy: 'low', materials: 'basic' },
    { id: 'calm_new_012', title: 'Nature Sounds Listening', description: 'Listen to and identify nature sounds', emoji: '🍃', ageGroups: ['toddler', 'preschool', 'early_elementary', 'late_elementary'], energy: 'low', materials: 'tech' },
    { id: 'calm_new_013', title: 'Gentle Hand Massage', description: 'Give each other relaxing hand massages', emoji: '🙌', ageGroups: ['toddler', 'preschool', 'early_elementary', 'late_elementary'], energy: 'low', materials: 'none' },
    { id: 'calm_new_014', title: 'Affirmation Cards', description: 'Read and discuss positive affirmations', emoji: '💝', ageGroups: ['preschool', 'early_elementary', 'late_elementary', 'middle_school'], energy: 'low', materials: 'basic' },
    { id: 'calm_new_015', title: 'Slow Motion Play', description: 'Do activities in exaggerated slow motion', emoji: '🐢', ageGroups: ['toddler', 'preschool', 'early_elementary'], energy: 'low', materials: 'none' },
    { id: 'calm_new_016', title: 'Tea Party', description: 'Have a calm tea party with real or pretend tea', emoji: '🍵', ageGroups: ['toddler', 'preschool', 'early_elementary', 'late_elementary'], energy: 'low', materials: 'basic' },
  ],
  outdoor: [
    { id: 'out_new_001', title: 'Leaf Collection', description: 'Collect and identify different leaves', emoji: '🍂', ageGroups: ['toddler', 'preschool', 'early_elementary', 'late_elementary'], energy: 'low', materials: 'none' },
    { id: 'out_new_002', title: 'Cloud Photography', description: 'Take photos of interesting cloud formations', emoji: '📷', ageGroups: ['early_elementary', 'late_elementary', 'middle_school', 'high_school'], energy: 'low', materials: 'tech' },
    { id: 'out_new_003', title: 'Mud Kitchen', description: 'Create a pretend kitchen with mud and natural materials', emoji: '🥧', ageGroups: ['toddler', 'preschool', 'early_elementary'], energy: 'medium', materials: 'none' },
    { id: 'out_new_004', title: 'Shadow Drawing', description: 'Trace shadows on paper as the sun moves', emoji: '👤', ageGroups: ['preschool', 'early_elementary', 'late_elementary'], energy: 'low', materials: 'basic' },
    { id: 'out_new_005', title: 'Nature Bingo', description: 'Find items on a nature bingo card', emoji: '🎯', ageGroups: ['preschool', 'early_elementary', 'late_elementary'], energy: 'medium', materials: 'basic' },
    { id: 'out_new_006', title: 'Backyard Camping', description: 'Set up a tent and camp in the backyard', emoji: '⛺', ageGroups: ['preschool', 'early_elementary', 'late_elementary', 'middle_school'], energy: 'medium', materials: 'special' },
    { id: 'out_new_007', title: 'Flower Pressing', description: 'Collect and press flowers in a book', emoji: '🌺', ageGroups: ['preschool', 'early_elementary', 'late_elementary', 'middle_school'], energy: 'low', materials: 'basic' },
    { id: 'out_new_008', title: 'Rock Stacking', description: 'Create balanced rock towers and sculptures', emoji: '🪨', ageGroups: ['preschool', 'early_elementary', 'late_elementary', 'middle_school'], energy: 'low', materials: 'none' },
    { id: 'out_new_009', title: 'Kite Flying', description: 'Fly a kite on a windy day', emoji: '🪁', ageGroups: ['preschool', 'early_elementary', 'late_elementary', 'middle_school'], energy: 'medium', materials: 'special' },
    { id: 'out_new_010', title: 'Sunrise/Sunset Watching', description: 'Watch and appreciate a sunrise or sunset', emoji: '🌅', ageGroups: ['toddler', 'preschool', 'early_elementary', 'late_elementary', 'middle_school', 'high_school'], energy: 'low', materials: 'none' },
    { id: 'out_new_011', title: 'Outdoor Art Gallery', description: 'Display artwork outside for a neighborhood show', emoji: '🎨', ageGroups: ['preschool', 'early_elementary', 'late_elementary'], energy: 'medium', materials: 'basic' },
    { id: 'out_new_012', title: 'Weather Station', description: 'Set up and monitor a simple weather station', emoji: '🌡️', ageGroups: ['early_elementary', 'late_elementary', 'middle_school'], energy: 'low', materials: 'special' },
    { id: 'out_new_013', title: 'Outdoor Movie Night', description: 'Watch a movie outside with blankets', emoji: '🎬', ageGroups: ['preschool', 'early_elementary', 'late_elementary', 'middle_school', 'high_school'], energy: 'low', materials: 'tech' },
    { id: 'out_new_014', title: 'Neighborhood Walk', description: 'Take a leisurely walk exploring the neighborhood', emoji: '🚶', ageGroups: ['toddler', 'preschool', 'early_elementary', 'late_elementary', 'middle_school'], energy: 'medium', materials: 'none' },
    { id: 'out_new_015', title: 'Picnic Planning', description: 'Plan and enjoy an outdoor picnic', emoji: '🧺', ageGroups: ['toddler', 'preschool', 'early_elementary', 'late_elementary', 'middle_school'], energy: 'low', materials: 'basic' },
    { id: 'out_new_016', title: 'Outdoor Yoga', description: 'Practice yoga poses in nature', emoji: '🧘', ageGroups: ['preschool', 'early_elementary', 'late_elementary', 'middle_school', 'high_school'], energy: 'low', materials: 'none' },
  ],
  games: [
    { id: 'game_new_001', title: 'Minute to Win It', description: 'Complete silly challenges in under a minute', emoji: '⏱️', ageGroups: ['early_elementary', 'late_elementary', 'middle_school', 'high_school'], energy: 'high', materials: 'basic' },
    { id: 'game_new_002', title: 'Would You Rather', description: 'Answer fun hypothetical questions', emoji: '🤔', ageGroups: ['early_elementary', 'late_elementary', 'middle_school', 'high_school'], energy: 'low', materials: 'none' },
    { id: 'game_new_003', title: 'Scavenger Hunt', description: 'Find items on a list around the house', emoji: '🔍', ageGroups: ['preschool', 'early_elementary', 'late_elementary', 'middle_school'], energy: 'medium', materials: 'basic' },
    { id: 'game_new_004', title: 'Memory Match', description: 'Play the classic memory matching game', emoji: '🃏', ageGroups: ['toddler', 'preschool', 'early_elementary', 'late_elementary'], energy: 'low', materials: 'basic' },
    { id: 'game_new_005', title: 'Hot Potato', description: 'Pass an object while music plays', emoji: '🥔', ageGroups: ['toddler', 'preschool', 'early_elementary', 'late_elementary'], energy: 'medium', materials: 'basic' },
    { id: 'game_new_006', title: 'Floor is Lava', description: 'Jump from furniture to furniture - the floor is lava!', emoji: '🌋', ageGroups: ['preschool', 'early_elementary', 'late_elementary'], energy: 'high', materials: 'none' },
    { id: 'game_new_007', title: 'Red Light Green Light', description: 'Classic movement game with stop and go', emoji: '🚦', ageGroups: ['toddler', 'preschool', 'early_elementary'], energy: 'medium', materials: 'none' },
    { id: 'game_new_008', title: 'Telephone Game', description: 'Whisper a message around a circle', emoji: '📞', ageGroups: ['preschool', 'early_elementary', 'late_elementary', 'middle_school'], energy: 'low', materials: 'none' },
    { id: 'game_new_009', title: 'Trivia Night', description: 'Answer trivia questions on various topics', emoji: '❓', ageGroups: ['early_elementary', 'late_elementary', 'middle_school', 'high_school'], energy: 'low', materials: 'basic' },
    { id: 'game_new_010', title: 'Building Block Challenge', description: 'Compete to build the tallest tower', emoji: '🏗️', ageGroups: ['toddler', 'preschool', 'early_elementary', 'late_elementary'], energy: 'low', materials: 'basic' },
    { id: 'game_new_011', title: 'Duck Duck Goose', description: 'Classic circle game with chasing', emoji: '🦆', ageGroups: ['toddler', 'preschool', 'early_elementary'], energy: 'high', materials: 'none' },
    { id: 'game_new_012', title: 'Bingo Night', description: 'Play bingo with fun prizes', emoji: '🎰', ageGroups: ['preschool', 'early_elementary', 'late_elementary', 'middle_school'], energy: 'low', materials: 'basic' },
    { id: 'game_new_013', title: 'Sardines', description: 'Reverse hide and seek - one hides, all seek', emoji: '🐟', ageGroups: ['early_elementary', 'late_elementary', 'middle_school'], energy: 'medium', materials: 'none' },
    { id: 'game_new_014', title: 'Story Dice', description: 'Roll dice and create stories from the images', emoji: '🎲', ageGroups: ['preschool', 'early_elementary', 'late_elementary'], energy: 'low', materials: 'special' },
  ],
  social: [
    { id: 'soc_new_001', title: 'Show and Tell', description: 'Share a favorite item and tell its story', emoji: '🎁', ageGroups: ['toddler', 'preschool', 'early_elementary', 'late_elementary'], energy: 'low', materials: 'none' },
    { id: 'soc_new_002', title: 'Compliment Circle', description: 'Take turns giving genuine compliments', emoji: '💬', ageGroups: ['preschool', 'early_elementary', 'late_elementary', 'middle_school'], energy: 'low', materials: 'none' },
    { id: 'soc_new_003', title: 'Family Meeting', description: 'Have a structured family discussion time', emoji: '👨‍👩‍👧‍👦', ageGroups: ['early_elementary', 'late_elementary', 'middle_school', 'high_school'], energy: 'low', materials: 'none' },
    { id: 'soc_new_004', title: 'Pen Pal Letters', description: 'Write letters to friends or family far away', emoji: '✉️', ageGroups: ['early_elementary', 'late_elementary', 'middle_school'], energy: 'low', materials: 'basic' },
    { id: 'soc_new_005', title: 'Interview Game', description: 'Interview family members about their lives', emoji: '🎙️', ageGroups: ['early_elementary', 'late_elementary', 'middle_school', 'high_school'], energy: 'low', materials: 'none' },
    { id: 'soc_new_006', title: 'Group Storytelling', description: 'Each person adds a sentence to create a story', emoji: '📖', ageGroups: ['preschool', 'early_elementary', 'late_elementary', 'middle_school'], energy: 'low', materials: 'none' },
    { id: 'soc_new_007', title: 'Friendship Bracelets Making', description: 'Make and exchange friendship bracelets', emoji: '📿', ageGroups: ['early_elementary', 'late_elementary', 'middle_school'], energy: 'low', materials: 'basic' },
    { id: 'soc_new_008', title: 'Family Talent Show', description: 'Everyone performs their special talent', emoji: '🌟', ageGroups: ['toddler', 'preschool', 'early_elementary', 'late_elementary', 'middle_school'], energy: 'medium', materials: 'none' },
    { id: 'soc_new_009', title: 'Kindness Jar', description: 'Write and share acts of kindness observed', emoji: '💝', ageGroups: ['preschool', 'early_elementary', 'late_elementary', 'middle_school'], energy: 'low', materials: 'basic' },
    { id: 'soc_new_010', title: 'Family Photo Album', description: 'Look through old photos and share memories', emoji: '📸', ageGroups: ['toddler', 'preschool', 'early_elementary', 'late_elementary', 'middle_school', 'high_school'], energy: 'low', materials: 'basic' },
    { id: 'soc_new_011', title: 'Two Truths and a Lie', description: 'Guess which statement is false', emoji: '🤥', ageGroups: ['early_elementary', 'late_elementary', 'middle_school', 'high_school'], energy: 'low', materials: 'none' },
    { id: 'soc_new_012', title: 'Secret Handshake', description: 'Create a unique secret handshake together', emoji: '🤝', ageGroups: ['preschool', 'early_elementary', 'late_elementary', 'middle_school'], energy: 'low', materials: 'none' },
    { id: 'soc_new_013', title: 'Family Recipe Sharing', description: 'Share and try family recipes together', emoji: '👨‍🍳', ageGroups: ['early_elementary', 'late_elementary', 'middle_school', 'high_school'], energy: 'medium', materials: 'basic' },
  ]
};

// Generate createActivity code for each new activity
function generateActivityCode(activity, category, index) {
  const isFree = index < Math.ceil(Object.keys(newActivities[category]).length * 0.6);

  return `  createActivity({
    id: '${activity.id}',
    title: '${activity.title}',
    description: '${activity.description}',
    emoji: '${activity.emoji}',
    category: '${category}',
    ageGroups: [${activity.ageGroups.map(a => `'${a}'`).join(', ')}],
    location: 'indoor',
    duration: 'short',
    energy: '${activity.energy}',
    materials: '${activity.materials}',
    participants: 'any',
    interests: ['${category}'],
    tags: ['${category}', 'fun'],${isFree ? '\n    isFree: true,' : ''}
    popularityScore: 75,
  }),`;
}

// Find the end of the activities array and insert before it
let totalAdded = 0;

Object.entries(newActivities).forEach(([category, activities]) => {
  console.log(`Adding ${activities.length} activities to ${category}...`);

  // Generate code for all activities in this category
  const newCode = activities.map((a, i) => generateActivityCode(a, category, i)).join('\n');

  // Find a good insertion point - before the closing of activities array
  // We'll insert before the last ];
  const insertPoint = content.lastIndexOf('];');

  if (insertPoint !== -1) {
    content = content.slice(0, insertPoint) + '\n\n  // NEW ' + category.toUpperCase() + ' ACTIVITIES\n' + newCode + '\n' + content.slice(insertPoint);
    totalAdded += activities.length;
  }
});

// Write the updated file
fs.writeFileSync(activitiesPath, content);

console.log(`\nTotal activities added: ${totalAdded}`);

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
  console.log(`${cat.padEnd(15)} ${count}`);
});
console.log('----------------------------');
console.log(`Total: ${Object.values(counts).reduce((a, b) => a + b, 0)}`);
