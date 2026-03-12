export async function getGeminiResponse(prompt) {
  if (!prompt) {
    throw new Error('Prompt is required');
  }

  // Replace this mock with real API integration and secure key handling.
  return {
    text: `Mock Gemini response for: ${prompt}`,
    source: 'gemini-mock',
  };
}
