/**
 * Soil Analysis Service using Gemini Vision AI
 * Analyzes soil photos to determine soil type and provide recommendations
 */

let localGeminiKey = 'PASTE_GEMINI_API_KEY_HERE';
try {
  const localSecrets = require('../config/localSecrets');
  localGeminiKey = localSecrets.GEMINI_API_KEY || localGeminiKey;
} catch (error) {
  // Fall back to placeholder
}

const GEMINI_API_KEY = localGeminiKey;
const GEMINI_MODEL = 'gemini-2.5-flash';
const PLACEHOLDER_KEY = 'PASTE_GEMINI_API_KEY_HERE';

function extractJsonBlock(text) {
  const fencedMatch = text.match(/```json\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1];
  }
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch?.[0] || text;
}

function normalizeSoilPayload(payload) {
  return {
    soilType: payload?.soilType || 'Unknown',
    soilColor: payload?.soilColor || 'Unknown',
    texture: payload?.texture || 'Unknown',
    moisture: payload?.moisture || 'Unknown',
    phEstimate: payload?.phEstimate || 'Unknown',
    organicMatter: payload?.organicMatter || 'Unknown',
    confidence: payload?.confidence || 'Medium',
    summary: payload?.summary || 'Unable to analyze soil from this image.',
    bestCrops: Array.isArray(payload?.bestCrops) && payload.bestCrops.length > 0
      ? payload.bestCrops
      : ['Consult local agricultural extension for crop recommendations.'],
    avoidCrops: Array.isArray(payload?.avoidCrops) && payload.avoidCrops.length > 0
      ? payload.avoidCrops
      : [],
    improvements: Array.isArray(payload?.improvements) && payload.improvements.length > 0
      ? payload.improvements
      : ['Test soil pH and nutrient levels at a certified lab.'],
    seasonalTips: Array.isArray(payload?.seasonalTips) && payload.seasonalTips.length > 0
      ? payload.seasonalTips
      : ['Apply organic compost before planting season.'],
    disclaimer: payload?.disclaimer ||
      'AI soil analysis is a preliminary assessment. For accurate results, conduct laboratory soil testing.',
  };
}

/**
 * Analyze soil from photo using Gemini Vision
 * @param {Object} params
 * @param {string} params.base64Data - Base64 encoded image data
 * @param {string} params.mimeType - Image MIME type (default: image/jpeg)
 * @param {string} params.language - Target language for response
 * @returns {Promise<Object>} Soil analysis result
 */
export async function analyzeSoil({
  base64Data,
  mimeType = 'image/jpeg',
  language = 'English',
}) {
  if (!base64Data) {
    throw new Error('Image data is required for soil analysis.');
  }

  const apiKey = GEMINI_API_KEY;
  if (!apiKey || apiKey === PLACEHOLDER_KEY) {
    throw new Error(
      'Add your Gemini API key in src/config/localSecrets.js for soil analysis.'
    );
  }

  const languageInstruction = language !== 'English' 
    ? `Respond in ${language} language.` 
    : '';

  const prompt = [
    'You are an expert agricultural soil analyst.',
    'Analyze the soil in this image and provide detailed information.',
    languageInstruction,
    'Return ONLY valid JSON using this exact schema:',
    '{',
    '  "soilType": "Clay|Sandy|Loamy|Silt|Peat|Chalky|Laterite|Black Cotton|Red|Alluvial",',
    '  "soilColor": "description of soil color",',
    '  "texture": "Fine|Medium|Coarse|description",',
    '  "moisture": "Dry|Moist|Wet|Waterlogged",',
    '  "phEstimate": "Acidic (pH < 6)|Neutral (pH 6-7.5)|Alkaline (pH > 7.5)",',
    '  "organicMatter": "Low|Medium|High",',
    '  "confidence": "Low|Medium|High",',
    '  "summary": "Brief 2-3 sentence analysis of soil quality and condition",',
    '  "bestCrops": ["crop1", "crop2", "crop3", "crop4", "crop5"],',
    '  "avoidCrops": ["crop that won\'t grow well 1", "crop 2"],',
    '  "improvements": ["improvement suggestion 1", "improvement 2", "improvement 3"],',
    '  "seasonalTips": ["seasonal tip 1", "seasonal tip 2"]',
    '}',
    '',
    'Base your analysis on visible characteristics: color, texture, aggregation, presence of organic matter, moisture appearance.',
    'For crops, prioritize those suitable for Indian agriculture.',
    'If image is unclear or not showing soil, indicate low confidence and say so in summary.',
  ].filter(Boolean).join('\n');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data,
              },
            },
          ],
        }],
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const message = data?.error?.message || 'Gemini could not analyze the soil image.';
    throw new Error(message);
  }

  const text = data?.candidates?.[0]?.content?.parts
    ?.map(part => part.text)
    .filter(Boolean)
    .join('\n') || '';

  if (!text) {
    throw new Error('Gemini returned an empty response.');
  }

  try {
    return normalizeSoilPayload(JSON.parse(extractJsonBlock(text)));
  } catch (error) {
    return normalizeSoilPayload({
      summary: text,
      soilType: 'Analysis pending',
    });
  }
}

/**
 * Get soil type icon/emoji
 */
export function getSoilTypeIcon(soilType) {
  const type = String(soilType || '').toLowerCase();
  if (type.includes('clay')) return '🟤';
  if (type.includes('sandy')) return '🏖️';
  if (type.includes('loam')) return '🌱';
  if (type.includes('silt')) return '💧';
  if (type.includes('peat')) return '🍂';
  if (type.includes('chalk')) return '⚪';
  if (type.includes('laterite') || type.includes('red')) return '🔴';
  if (type.includes('black')) return '⚫';
  if (type.includes('alluvial')) return '🌊';
  return '🟫';
}

/**
 * Get moisture level color
 */
export function getMoistureColor(moisture) {
  const m = String(moisture || '').toLowerCase();
  if (m.includes('dry')) return '#f5a623';
  if (m.includes('moist')) return '#7eff8a';
  if (m.includes('wet')) return '#4dabf7';
  if (m.includes('waterlog')) return '#ff6b6b';
  return '#ffffff';
}

/**
 * Get pH level color
 */
export function getPhColor(phEstimate) {
  const ph = String(phEstimate || '').toLowerCase();
  if (ph.includes('acidic')) return '#ff6b6b';
  if (ph.includes('neutral')) return '#7eff8a';
  if (ph.includes('alkaline')) return '#4dabf7';
  return '#ffffff';
}
