const CROP_CLASSIFIER_API_URL = 'PASTE_CLASSIFIER_API_URL_HERE';
const CLASSIFIER_TIMEOUT_MS = 20000;

export const MIN_CONFIDENCE_THRESHOLD = 0.65;

function toFractionConfidence(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value > 1) {
      return Math.max(0, Math.min(1, value / 100));
    }

    return Math.max(0, Math.min(1, value));
  }

  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace('%', ''));

    if (!Number.isNaN(parsed)) {
      if (parsed > 1) {
        return Math.max(0, Math.min(1, parsed / 100));
      }

      return Math.max(0, Math.min(1, parsed));
    }
  }

  return 0;
}

function confidenceBand(score) {
  if (score >= 0.8) {
    return 'High';
  }

  if (score >= 0.65) {
    return 'Medium';
  }

  return 'Low';
}

function normalizePredictions(payload) {
  const sourceList =
    payload?.predictions || payload?.topPredictions || payload?.classes || [];

  if (!Array.isArray(sourceList)) {
    return [];
  }

  return sourceList
    .map(item => {
      const label =
        item?.label || item?.diseaseName || item?.class || item?.name || 'Unknown';
      const confidence = toFractionConfidence(
        item?.confidence ?? item?.score ?? item?.probability,
      );

      return {
        label,
        confidence,
        confidencePercent: `${Math.round(confidence * 100)}%`,
      };
    })
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
}

function withTimeout(promise, timeoutMs) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Disease classifier request timed out.'));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

export async function classifyCropDisease({
  base64Data,
  mimeType = 'image/jpeg',
  apiUrl,
}) {
  if (!base64Data) {
    throw new Error('Image data is required for disease classification.');
  }

  const resolvedApiUrl = apiUrl || CROP_CLASSIFIER_API_URL;

  if (
    !resolvedApiUrl ||
    resolvedApiUrl === 'AIzaSyDcCOuhQWnKCrNL3N8qb3Dkx7JvFnni634'
  ) {
    throw new Error(
      'Add your classifier endpoint in src/services/classifierApi.js before using Crop Doctor detection.',
    );
  }

  const response = await withTimeout(
    fetch(resolvedApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64: base64Data,
        mimeType,
        topK: 3,
      }),
    }),
    CLASSIFIER_TIMEOUT_MS,
  );

  const data = await response.json();

  if (!response.ok) {
    const message =
      data?.error?.message || data?.message || 'Classifier could not process this image.';
    throw new Error(message);
  }

  const predictions = normalizePredictions(data);

  if (!predictions.length) {
    throw new Error('Classifier returned no disease predictions.');
  }

  const top = predictions[0];

  return {
    crop: data?.crop || data?.cropName || 'Unknown crop',
    predictedLabel: top.label,
    confidenceScore: top.confidence,
    confidence: top.confidencePercent,
    confidenceBand: confidenceBand(top.confidence),
    topPredictions: predictions,
    modelVersion: data?.modelVersion || 'unknown',
    isLowConfidence: top.confidence < MIN_CONFIDENCE_THRESHOLD,
  };
}
