/**
 * PlayCompass Print Service
 *
 * Generates printable PDF activity kits
 */

// Dynamically import expo modules to handle cases where native modules aren't available
let Print = null;
let Sharing = null;
let FileSystem = null;

try {
  Print = require('expo-print');
} catch (e) {
  console.warn('[PrintService] expo-print not available');
}

try {
  Sharing = require('expo-sharing');
} catch (e) {
  console.warn('[PrintService] expo-sharing not available');
}

try {
  FileSystem = require('expo-file-system');
} catch (e) {
  console.warn('[PrintService] expo-file-system not available');
}

/**
 * Generate HTML for activity kit
 */
const generateActivityKitHTML = (activity, options = {}) => {
  const {
    includeInstructions = true,
    includeMaterials = true,
    includeVariations = true,
    includeTips = true,
    includeColoringPage = false,
  } = options;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${activity.name} - Activity Kit</title>
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          padding: 40px;
          color: #333;
          line-height: 1.6;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid #4F46E5;
        }
        .logo {
          font-size: 36px;
          margin-bottom: 10px;
        }
        .brand {
          font-size: 14px;
          color: #666;
          margin-bottom: 10px;
        }
        h1 {
          font-size: 28px;
          color: #1a1a1a;
          margin-bottom: 10px;
        }
        .meta {
          display: flex;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
          margin-top: 15px;
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: #666;
          background: #f5f5f5;
          padding: 5px 12px;
          border-radius: 20px;
        }
        .description {
          font-size: 16px;
          color: #555;
          text-align: center;
          max-width: 600px;
          margin: 0 auto 30px;
        }
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .section-title {
          font-size: 18px;
          color: #4F46E5;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e0e0e0;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .section-emoji {
          font-size: 22px;
        }
        ul {
          list-style-type: none;
          padding: 0;
        }
        li {
          padding: 8px 0 8px 28px;
          position: relative;
        }
        li:before {
          content: "•";
          color: #4F46E5;
          font-weight: bold;
          font-size: 18px;
          position: absolute;
          left: 8px;
        }
        .materials-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 15px;
        }
        .material-item {
          background: #f8f8f8;
          padding: 15px;
          border-radius: 10px;
          text-align: center;
        }
        .material-emoji {
          font-size: 28px;
          margin-bottom: 8px;
        }
        .steps {
          counter-reset: step-counter;
        }
        .step {
          display: flex;
          gap: 15px;
          padding: 15px 0;
          border-bottom: 1px solid #eee;
        }
        .step:last-child {
          border-bottom: none;
        }
        .step-number {
          width: 36px;
          height: 36px;
          background: #4F46E5;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          flex-shrink: 0;
        }
        .step-content {
          flex: 1;
        }
        .step-title {
          font-weight: 600;
          margin-bottom: 5px;
        }
        .step-description {
          color: #666;
          font-size: 14px;
        }
        .tip-box {
          background: #FFF8E1;
          border-left: 4px solid #FFA000;
          padding: 15px 20px;
          margin: 10px 0;
          border-radius: 0 8px 8px 0;
        }
        .tip-box h4 {
          color: #F57C00;
          margin-bottom: 5px;
        }
        .variation {
          background: #E8F5E9;
          padding: 15px;
          border-radius: 10px;
          margin: 10px 0;
        }
        .variation-title {
          font-weight: 600;
          color: #2E7D32;
          margin-bottom: 5px;
        }
        .checkbox-section {
          margin-top: 30px;
          padding: 20px;
          background: #fafafa;
          border-radius: 10px;
        }
        .checkbox-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 0;
        }
        .checkbox {
          width: 18px;
          height: 18px;
          border: 2px solid #666;
          border-radius: 3px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e0e0e0;
          text-align: center;
          color: #888;
          font-size: 12px;
        }
        .coloring-page {
          page-break-before: always;
          text-align: center;
          padding-top: 40px;
        }
        .coloring-title {
          font-size: 24px;
          margin-bottom: 20px;
          color: #333;
        }
        .coloring-frame {
          border: 3px dashed #ccc;
          min-height: 500px;
          margin: 20px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #aaa;
          font-size: 18px;
        }
        @media print {
          body {
            padding: 20px;
          }
          .section {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">🧭</div>
        <div class="brand">PlayCompass Activity Kit</div>
        <h1>${activity.name}</h1>
        <div class="meta">
          <span class="meta-item">⏱️ ${activity.duration || 30} min</span>
          <span class="meta-item">📁 ${activity.category || 'Activity'}</span>
          ${activity.ageRange ? `<span class="meta-item">👶 ${activity.ageRange}</span>` : ''}
          ${activity.location ? `<span class="meta-item">📍 ${activity.location}</span>` : ''}
        </div>
      </div>

      <p class="description">${activity.description || ''}</p>

      ${includeMaterials && activity.materials?.length > 0 ? `
        <div class="section">
          <h2 class="section-title">
            <span class="section-emoji">🎒</span>
            Materials Needed
          </h2>
          <div class="materials-grid">
            ${activity.materials.map(material => `
              <div class="material-item">
                <div class="material-emoji">${getMaterialEmoji(material)}</div>
                <div>${material}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${includeInstructions && activity.instructions?.length > 0 ? `
        <div class="section">
          <h2 class="section-title">
            <span class="section-emoji">📝</span>
            Step-by-Step Instructions
          </h2>
          <div class="steps">
            ${activity.instructions.map((step, index) => `
              <div class="step">
                <div class="step-number">${index + 1}</div>
                <div class="step-content">
                  <div class="step-title">${step.title || `Step ${index + 1}`}</div>
                  <div class="step-description">${step.description || step}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${includeTips && activity.tips?.length > 0 ? `
        <div class="section">
          <h2 class="section-title">
            <span class="section-emoji">💡</span>
            Pro Tips
          </h2>
          ${activity.tips.map(tip => `
            <div class="tip-box">
              <h4>💡 Tip</h4>
              <p>${tip}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${includeVariations && activity.variations?.length > 0 ? `
        <div class="section">
          <h2 class="section-title">
            <span class="section-emoji">🎨</span>
            Creative Variations
          </h2>
          ${activity.variations.map(variation => `
            <div class="variation">
              <div class="variation-title">${variation.name || 'Variation'}</div>
              <p>${variation.description || variation}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div class="checkbox-section">
        <h3>Activity Checklist</h3>
        <div class="checkbox-item">
          <div class="checkbox"></div>
          <span>Materials gathered</span>
        </div>
        <div class="checkbox-item">
          <div class="checkbox"></div>
          <span>Activity completed</span>
        </div>
        <div class="checkbox-item">
          <div class="checkbox"></div>
          <span>Had fun! ⭐</span>
        </div>
      </div>

      ${includeColoringPage ? `
        <div class="coloring-page">
          <h2 class="coloring-title">🎨 Color Your Adventure!</h2>
          <div class="coloring-frame">
            Draw or color your favorite part of the activity!
          </div>
        </div>
      ` : ''}

      <div class="footer">
        <p>Generated by PlayCompass • playcompass.app</p>
        <p>© ${new Date().getFullYear()} PlayCompass. Happy playing!</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Get emoji for material type
 */
const getMaterialEmoji = (material) => {
  const materialLower = material.toLowerCase();
  const emojiMap = {
    paper: '📄',
    pencil: '✏️',
    scissors: '✂️',
    glue: '🧴',
    paint: '🎨',
    brush: '🖌️',
    crayon: '🖍️',
    marker: '🖊️',
    tape: '📎',
    cardboard: '📦',
    string: '🧵',
    fabric: '🧵',
    water: '💧',
    sand: '🏖️',
    ball: '⚽',
    book: '📚',
    music: '🎵',
    phone: '📱',
    timer: '⏰',
  };

  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (materialLower.includes(key)) {
      return emoji;
    }
  }
  return '📌';
};

/**
 * Generate weekly plan PDF
 */
const generateWeeklyPlanHTML = (activities, weekStart) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Weekly Activity Plan</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 30px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo { font-size: 32px; }
        h1 { font-size: 24px; color: #4F46E5; margin: 10px 0; }
        .week-info { color: #666; font-size: 14px; }
        .calendar {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 10px;
          margin-top: 20px;
        }
        .day {
          border: 2px solid #e0e0e0;
          border-radius: 10px;
          padding: 15px 10px;
          min-height: 150px;
        }
        .day-name {
          font-weight: 600;
          color: #4F46E5;
          margin-bottom: 10px;
          text-align: center;
        }
        .activity-card {
          background: #f5f5f5;
          border-radius: 6px;
          padding: 8px;
          margin-bottom: 8px;
          font-size: 12px;
        }
        .activity-name { font-weight: 500; }
        .activity-time { color: #888; font-size: 10px; }
        .footer {
          margin-top: 30px;
          text-align: center;
          color: #888;
          font-size: 11px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">🧭</div>
        <h1>Weekly Activity Plan</h1>
        <div class="week-info">Week of ${weekStart}</div>
      </div>
      <div class="calendar">
        ${days.map((day, index) => {
          const dayActivities = activities.filter(a => a.dayIndex === index);
          return `
            <div class="day">
              <div class="day-name">${day}</div>
              ${dayActivities.length > 0 ? dayActivities.map(a => `
                <div class="activity-card">
                  <div class="activity-name">${a.name}</div>
                  <div class="activity-time">${a.time || ''}</div>
                </div>
              `).join('') : '<div style="color: #ccc; text-align: center; margin-top: 30px;">—</div>'}
            </div>
          `;
        }).join('')}
      </div>
      <div class="footer">Generated by PlayCompass</div>
    </body>
    </html>
  `;
};

/**
 * Generate and save PDF for activity kit
 */
export const generateActivityKitPDF = async (activity, options = {}) => {
  if (!Print || !FileSystem) {
    return { success: false, error: 'Print service not available. Rebuild the app to enable.' };
  }

  try {
    const html = generateActivityKitHTML(activity, options);
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    // Move to a more accessible location
    const fileName = `${activity.name.replace(/[^a-zA-Z0-9]/g, '_')}_activity_kit.pdf`;
    const newUri = `${FileSystem.documentDirectory}${fileName}`;
    await FileSystem.moveAsync({ from: uri, to: newUri });

    return { success: true, uri: newUri, fileName };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate and share PDF
 */
export const shareActivityKitPDF = async (activity, options = {}) => {
  if (!Sharing) {
    return { success: false, error: 'Sharing not available. Rebuild the app to enable.' };
  }

  try {
    const result = await generateActivityKitPDF(activity, options);
    if (!result.success) return result;

    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      return { success: false, error: 'Sharing is not available on this device' };
    }

    await Sharing.shareAsync(result.uri, {
      mimeType: 'application/pdf',
      dialogTitle: `${activity.name} - Activity Kit`,
      UTI: 'com.adobe.pdf',
    });

    return { success: true };
  } catch (error) {
    console.error('Error sharing PDF:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Print activity kit directly
 */
export const printActivityKit = async (activity, options = {}) => {
  if (!Print) {
    return { success: false, error: 'Print not available. Rebuild the app to enable.' };
  }

  try {
    const html = generateActivityKitHTML(activity, options);
    await Print.printAsync({ html });
    return { success: true };
  } catch (error) {
    console.error('Error printing:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate weekly plan PDF
 */
export const generateWeeklyPlanPDF = async (activities, weekStart) => {
  if (!Print || !FileSystem) {
    return { success: false, error: 'Print service not available. Rebuild the app to enable.' };
  }

  try {
    const html = generateWeeklyPlanHTML(activities, weekStart);
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    const fileName = `weekly_plan_${weekStart.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    const newUri = `${FileSystem.documentDirectory}${fileName}`;
    await FileSystem.moveAsync({ from: uri, to: newUri });

    return { success: true, uri: newUri, fileName };
  } catch (error) {
    console.error('Error generating weekly plan PDF:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Share weekly plan PDF
 */
export const shareWeeklyPlanPDF = async (activities, weekStart) => {
  if (!Sharing) {
    return { success: false, error: 'Sharing not available. Rebuild the app to enable.' };
  }

  try {
    const result = await generateWeeklyPlanPDF(activities, weekStart);
    if (!result.success) return result;

    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      return { success: false, error: 'Sharing is not available on this device' };
    }

    await Sharing.shareAsync(result.uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Weekly Activity Plan',
      UTI: 'com.adobe.pdf',
    });

    return { success: true };
  } catch (error) {
    console.error('Error sharing weekly plan PDF:', error);
    return { success: false, error: error.message };
  }
};

export default {
  generateActivityKitPDF,
  shareActivityKitPDF,
  printActivityKit,
  generateWeeklyPlanPDF,
  shareWeeklyPlanPDF,
};
