import { analyzeCropDisease } from './geminiApi';

export async function detectCropDiseaseAI({
  base64Data,
  mimeType = 'image/jpeg',
}) {
  const analysis = await analyzeCropDisease({
    base64Data,
    mimeType,
  });

  return {
    ...analysis,
    confidenceScore: null,
    confidenceBand: analysis.confidence || 'Medium',
    topPredictions: [],
    modelVersion: 'gemini-only',
    needsRetake: analysis.confidence === 'Low',
  };
}
