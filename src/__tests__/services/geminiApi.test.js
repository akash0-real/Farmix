const { analyzeCropDisease } = require('../../services/geminiApi');

describe('geminiApi', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('throws if image data is missing', async () => {
    await expect(analyzeCropDisease({ base64Data: '' })).rejects.toThrow(
      'Image data is required for disease analysis.',
    );
  });

  it('throws if API key is placeholder', async () => {
    await expect(
      analyzeCropDisease({
        base64Data: 'abcd',
        apiKey: 'PASTE_GEMINI_API_KEY_HERE',
      }),
    ).rejects.toThrow('Add your Gemini API key');
  });

  it('returns normalized JSON payload', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: '{"crop":"Tomato","diseaseName":"Leaf Spot","confidence":"High","severity":"Moderate","summary":"Detected likely fungal infection.","treatment":["Remove affected leaves"],"prevention":["Avoid overhead watering"],"disclaimer":"Verify with agronomist"}',
                },
              ],
            },
          },
        ],
      }),
    });

    const result = await analyzeCropDisease({
      base64Data: 'abcd',
      apiKey: 'demo-key',
    });

    expect(result.crop).toBe('Tomato');
    expect(result.diseaseName).toBe('Leaf Spot');
    expect(result.treatment).toEqual(['Remove affected leaves']);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('returns fallback summary when model text is not valid JSON', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: 'The image appears infected with high uncertainty.' }],
            },
          },
        ],
      }),
    });

    const result = await analyzeCropDisease({
      base64Data: 'abcd',
      apiKey: 'demo-key',
    });

    expect(result.diseaseName).toBe('Unstructured response');
    expect(result.summary).toContain('infected');
  });

  it('throws API error message for non-200 response', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: { message: 'quota exceeded' },
      }),
    });

    await expect(
      analyzeCropDisease({ base64Data: 'abcd', apiKey: 'demo-key' }),
    ).rejects.toThrow('quota exceeded');
  });
});
