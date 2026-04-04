/**
 * Translation service for dynamic content using Gemini AI
 * Translates API responses (crop names, disease names, recommendations, etc.)
 * to the user's selected language with caching for performance
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

// In-memory cache for translations
const translationCache = new Map();

// Language codes for Gemini
const LANGUAGE_NAMES = {
  English: 'English',
  Hindi: 'Hindi',
  Kannada: 'Kannada',
  Tamil: 'Tamil',
  Telugu: 'Telugu',
  Punjabi: 'Punjabi',
  Malayalam: 'Malayalam',
  Marathi: 'Marathi',
  Bengali: 'Bengali',
  Gujarati: 'Gujarati',
  Odia: 'Odia',
  Assamese: 'Assamese',
  Urdu: 'Urdu',
};

function getCacheKey(text, language) {
  return `${language}:${text}`;
}

/**
 * Translate a single text string to target language
 */
export async function translateText(text, targetLanguage) {
  if (!text || targetLanguage === 'English') {
    return text;
  }

  const cacheKey = getCacheKey(text, targetLanguage);
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  const langName = LANGUAGE_NAMES[targetLanguage] || targetLanguage;

  try {
    const apiKey = GEMINI_API_KEY;
    if (!apiKey || apiKey === PLACEHOLDER_KEY) {
      return text; // Return original if no API key
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Translate the following text to ${langName}. Return ONLY the translated text, nothing else:\n\n${text}`,
            }],
          }],
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return text;
    }

    const translated = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || text;
    translationCache.set(cacheKey, translated);
    return translated;
  } catch (error) {
    return text;
  }
}

/**
 * Translate multiple texts in a batch (more efficient)
 */
export async function translateBatch(texts, targetLanguage) {
  if (!texts?.length || targetLanguage === 'English') {
    return texts;
  }

  const langName = LANGUAGE_NAMES[targetLanguage] || targetLanguage;
  const results = [...texts];
  const toTranslate = [];
  const indices = [];

  // Check cache first
  texts.forEach((text, i) => {
    if (!text) return;
    const cacheKey = getCacheKey(text, targetLanguage);
    if (translationCache.has(cacheKey)) {
      results[i] = translationCache.get(cacheKey);
    } else {
      toTranslate.push(text);
      indices.push(i);
    }
  });

  if (toTranslate.length === 0) {
    return results;
  }

  try {
    const apiKey = GEMINI_API_KEY;
    if (!apiKey || apiKey === PLACEHOLDER_KEY) {
      return results;
    }

    const numberedTexts = toTranslate.map((t, i) => `${i + 1}. ${t}`).join('\n');
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Translate each numbered line to ${langName}. Return ONLY the translations in the same numbered format:\n\n${numberedTexts}`,
            }],
          }],
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return results;
    }

    const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const lines = responseText.split('\n').filter(l => l.trim());

    lines.forEach(line => {
      const match = line.match(/^(\d+)\.\s*(.+)$/);
      if (match) {
        const idx = parseInt(match[1], 10) - 1;
        const translated = match[2].trim();
        if (idx >= 0 && idx < toTranslate.length) {
          const originalIdx = indices[idx];
          results[originalIdx] = translated;
          translationCache.set(getCacheKey(toTranslate[idx], targetLanguage), translated);
        }
      }
    });

    return results;
  } catch (error) {
    return results;
  }
}

/**
 * Translate a mandi price item
 */
export async function translateMandiItem(item, targetLanguage) {
  if (!item || targetLanguage === 'English') {
    return item;
  }

  const [crop, market, district] = await translateBatch(
    [item.crop, item.market, item.district],
    targetLanguage
  );

  return {
    ...item,
    crop,
    market,
    district,
  };
}

/**
 * Translate multiple mandi items
 */
export async function translateMandiItems(items, targetLanguage) {
  if (!items?.length || targetLanguage === 'English') {
    return items;
  }

  // Collect all unique texts
  const allTexts = [];
  items.forEach(item => {
    if (item.crop) allTexts.push(item.crop);
    if (item.market) allTexts.push(item.market);
    if (item.district) allTexts.push(item.district);
  });

  const uniqueTexts = [...new Set(allTexts)];
  const translated = await translateBatch(uniqueTexts, targetLanguage);
  
  // Build lookup map
  const translationMap = new Map();
  uniqueTexts.forEach((text, i) => {
    translationMap.set(text, translated[i]);
  });

  // Apply translations
  return items.map(item => ({
    ...item,
    crop: translationMap.get(item.crop) || item.crop,
    market: translationMap.get(item.market) || item.market,
    district: translationMap.get(item.district) || item.district,
  }));
}

/**
 * Translate community alert
 */
export async function translateAlert(alert, targetLanguage) {
  if (!alert || targetLanguage === 'English') {
    return alert;
  }

  const [title, message, locationName] = await translateBatch(
    [alert.title, alert.message, alert.locationName],
    targetLanguage
  );

  return {
    ...alert,
    title,
    message,
    locationName,
  };
}

/**
 * Translate multiple alerts
 */
export async function translateAlerts(alerts, targetLanguage) {
  if (!alerts?.length || targetLanguage === 'English') {
    return alerts;
  }

  const allTexts = [];
  alerts.forEach(alert => {
    if (alert.title) allTexts.push(alert.title);
    if (alert.message) allTexts.push(alert.message);
    if (alert.locationName) allTexts.push(alert.locationName);
  });

  const uniqueTexts = [...new Set(allTexts)];
  const translated = await translateBatch(uniqueTexts, targetLanguage);

  const translationMap = new Map();
  uniqueTexts.forEach((text, i) => {
    translationMap.set(text, translated[i]);
  });

  return alerts.map(alert => ({
    ...alert,
    title: translationMap.get(alert.title) || alert.title,
    message: translationMap.get(alert.message) || alert.message,
    locationName: translationMap.get(alert.locationName) || alert.locationName,
  }));
}

/**
 * Translate government scheme content
 */
export async function translateGovtSchemes(schemes, targetLanguage) {
  if (!schemes?.length || targetLanguage === 'English') {
    return schemes;
  }

  const allTexts = [];
  schemes.forEach(scheme => {
    if (scheme.name) allTexts.push(scheme.name);
    if (scheme.fullName) allTexts.push(scheme.fullName);
    if (scheme.benefit) allTexts.push(scheme.benefit);
    (scheme.eligibility || []).forEach(item => {
      if (item) allTexts.push(item);
    });
    (scheme.documents || []).forEach(item => {
      if (item) allTexts.push(item);
    });
  });

  const uniqueTexts = [...new Set(allTexts)];
  const translated = await translateBatch(uniqueTexts, targetLanguage);
  const translationMap = new Map();

  uniqueTexts.forEach((text, i) => {
    translationMap.set(text, translated[i] || text);
  });

  return schemes.map(scheme => ({
    ...scheme,
    name: translationMap.get(scheme.name) || scheme.name,
    fullName: translationMap.get(scheme.fullName) || scheme.fullName,
    benefit: translationMap.get(scheme.benefit) || scheme.benefit,
    eligibility: (scheme.eligibility || []).map(item => translationMap.get(item) || item),
    documents: (scheme.documents || []).map(item => translationMap.get(item) || item),
  }));
}

/**
 * Translate crop doctor result
 */
export async function translateCropDoctorResult(result, targetLanguage) {
  if (!result || targetLanguage === 'English') {
    return result;
  }

  const textsToTranslate = [
    result.diseaseName,
    result.crop,
    result.summary,
    result.disclaimer,
    ...(result.treatment || []),
    ...(result.prevention || []),
  ].filter(Boolean);

  const translated = await translateBatch(textsToTranslate, targetLanguage);
  
  let idx = 0;
  const translatedResult = {
    ...result,
    diseaseName: translated[idx++] || result.diseaseName,
    crop: translated[idx++] || result.crop,
    summary: translated[idx++] || result.summary,
    disclaimer: translated[idx++] || result.disclaimer,
    treatment: result.treatment?.map(() => translated[idx++]) || [],
    prevention: result.prevention?.map(() => translated[idx++]) || [],
  };

  // Translate top predictions if present
  if (result.topPredictions?.length) {
    const predLabels = result.topPredictions.map(p => p.label);
    const translatedLabels = await translateBatch(predLabels, targetLanguage);
    translatedResult.topPredictions = result.topPredictions.map((p, i) => ({
      ...p,
      label: translatedLabels[i] || p.label,
    }));
  }

  return translatedResult;
}

/**
 * Translate weather condition
 */
export async function translateWeatherCondition(condition, targetLanguage) {
  if (!condition || targetLanguage === 'English') {
    return condition;
  }
  return translateText(condition, targetLanguage);
}

/**
 * Clear translation cache (useful for memory management)
 */
export function clearTranslationCache() {
  translationCache.clear();
}
