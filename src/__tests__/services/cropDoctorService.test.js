jest.mock('../../services/geminiApi', () => ({
  analyzeCropDisease: jest.fn(),
}));

const { analyzeCropDisease } = require('../../services/geminiApi');
const { detectCropDiseaseAI } = require('../../services/cropDoctorService');

describe('cropDoctorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps Gemini response into Crop Doctor shape', async () => {
    analyzeCropDisease.mockResolvedValueOnce({
      crop: 'Tomato',
      diseaseName: 'Leaf Spot',
      confidence: 'High',
      severity: 'Moderate',
      summary: 'Likely fungal infection.',
      treatment: ['Remove damaged leaves'],
      prevention: ['Improve airflow'],
      disclaimer: 'Consult an agronomist',
    });

    const result = await detectCropDiseaseAI({
      base64Data: 'abcd',
      mimeType: 'image/jpeg',
    });

    expect(result.modelVersion).toBe('gemini-only');
    expect(result.topPredictions).toEqual([]);
    expect(result.diseaseName).toBe('Leaf Spot');
    expect(result.needsRetake).toBe(false);
  });

  it('sets needsRetake for low confidence output', async () => {
    analyzeCropDisease.mockResolvedValueOnce({
      crop: 'Tomato',
      diseaseName: 'Unknown issue',
      confidence: 'Low',
      severity: 'Low',
      summary: 'Image is unclear.',
      treatment: [],
      prevention: [],
      disclaimer: 'Retake needed',
    });

    const result = await detectCropDiseaseAI({
      base64Data: 'abcd',
      mimeType: 'image/jpeg',
    });

    expect(result.needsRetake).toBe(true);
    expect(result.confidenceBand).toBe('Low');
  });

  it('propagates Gemini errors', async () => {
    analyzeCropDisease.mockRejectedValueOnce(new Error('quota exceeded'));

    await expect(
      detectCropDiseaseAI({ base64Data: 'abcd', mimeType: 'image/jpeg' }),
    ).rejects.toThrow('quota exceeded');
  });
});
