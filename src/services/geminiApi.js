let localGeminiKey = 'PASTE_GEMINI_API_KEY_HERE';
try {
  // Keep real keys in src/config/localSecrets.js (gitignored).
  // eslint-disable-next-line global-require, import/no-unresolved
  const localSecrets = require('../config/localSecrets');
  localGeminiKey = localSecrets.GEMINI_API_KEY || localGeminiKey;
} catch (error) {
  // Fall back to placeholder when local secret file is missing.
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

function normalizeDiseasePayload(payload) {
  return {
    diseaseName: payload?.diseaseName || 'Unknown issue',
    confidence: payload?.confidence || 'Medium',
    severity: payload?.severity || 'Moderate',
    summary:
      payload?.summary ||
      'The image was analyzed, but the response did not include a summary.',
    treatment:
      Array.isArray(payload?.treatment) && payload.treatment.length > 0
        ? payload.treatment
        : ['Consult a local agronomist for confirmation and treatment advice.'],
    prevention:
      Array.isArray(payload?.prevention) && payload.prevention.length > 0
        ? payload.prevention
        : ['Monitor nearby plants and isolate affected leaves if possible.'],
    crop: payload?.crop || 'Unknown crop',
    disclaimer:
      payload?.disclaimer ||
      'AI output is a quick screening tool and should be verified before spraying or disposal.',
  };
}

function resolveGeminiApiKey(overrideKey) {
  return overrideKey || GEMINI_API_KEY;
}

async function requestGeminiText(prompt, overrideKey) {
  const apiKey = resolveGeminiApiKey(overrideKey);

  if (!apiKey || apiKey === PLACEHOLDER_KEY) {
    throw new Error(
      'Add your Gemini API key in src/services/geminiApi.js before running disease detection.',
    );
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    const message =
      data?.error?.message || 'Gemini could not generate crop guidance.';
    throw new Error(message);
  }

  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map(part => part.text)
      .filter(Boolean)
      .join('\n') || '';

  if (!text) {
    throw new Error('Gemini returned an empty response.');
  }

  return text;
}

export async function generateDiseaseAdvice({
  crop,
  diseaseName,
  confidence,
  topPredictions = [],
  apiKey,
}) {
  const formattedPredictions = topPredictions
    .map(item => `${item.label} (${item.confidencePercent})`)
    .join(', ');

  const prompt = [
    'You are an agricultural crop disease advisor.',
    'A disease classifier has already produced the prediction below.',
    `Crop: ${crop || 'Unknown crop'}`,
    `Predicted disease: ${diseaseName || 'Unknown issue'}`,
    `Classifier confidence: ${confidence || 'Unknown'}`,
    `Top predictions: ${formattedPredictions || 'Not available'}`,
    'Return only valid JSON using this exact schema:',
    '{',
    '"summary": "short diagnosis explanation in simple language",',
    '"severity": "Low|Moderate|High",',
    '"treatment": ["step 1", "step 2", "step 3"],',
    '"prevention": ["tip 1", "tip 2"],',
    '"disclaimer": "short safety note"',
    '}',
    'Do not change the disease name. Keep treatment practical and safe.',
  ].join('\n');

  const text = await requestGeminiText(prompt, apiKey);

  try {
    const payload = JSON.parse(extractJsonBlock(text));

    return normalizeDiseasePayload({
      ...payload,
      crop,
      diseaseName,
      confidence,
    });
  } catch (error) {
    return normalizeDiseasePayload({
      crop,
      diseaseName,
      confidence,
      summary: text,
    });
  }
}

export async function analyzeCropDisease({
  base64Data,
  mimeType = 'image/jpeg',
  apiKey,
}) {
  if (!base64Data) {
    throw new Error('Image data is required for disease analysis.');
  }

  const prompt = [
    'You are an agricultural crop disease assistant.',
    'Analyze the plant image and return only valid JSON.',
    'Use this schema:',
    '{',
    '"crop": "string",',
    '"diseaseName": "string",',
    '"confidence": "Low|Medium|High",',
    '"severity": "Low|Moderate|High",',
    '"summary": "short diagnosis summary",',
    '"treatment": ["step 1", "step 2"],',
    '"prevention": ["tip 1", "tip 2"],',
    '"disclaimer": "short safety note"',
    '}',
    'If the image is unclear, say that clearly in the summary and lower confidence.',
  ].join('\n');

  const resolvedApiKey = resolveGeminiApiKey(apiKey);

  if (!resolvedApiKey || resolvedApiKey === PLACEHOLDER_KEY) {
    throw new Error(
      'Add your Gemini API key in src/services/geminiApi.js before running disease detection.',
    );
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${resolvedApiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data,
                },
              },
            ],
          },
        ],
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    const message =
      data?.error?.message || 'Gemini could not analyze the crop image.';
    throw new Error(message);
  }

  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map(part => part.text)
      .filter(Boolean)
      .join('\n') || '';

  if (!text) {
    throw new Error('Gemini returned an empty response.');
  }

  try {
    return normalizeDiseasePayload(JSON.parse(extractJsonBlock(text)));
  } catch (error) {
    return normalizeDiseasePayload({
      summary: text,
      diseaseName: 'Unstructured response',
    });
  }
}
