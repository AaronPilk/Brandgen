import OpenAI from 'openai';

let openaiClient = null;

function getClient() {
  if (!openaiClient && process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

export function isMockMode() {
  return process.env.MOCK_IMAGES === 'true' || !process.env.OPENAI_API_KEY;
}

export async function generateImage(prompt) {
  if (isMockMode()) {
    return {
      url: null,
      mock: true,
      prompt,
      placeholder: `Image Preview — Connect DALL-E to generate.\n\nPrompt: ${prompt}`,
    };
  }

  const openai = getClient();
  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard',
  });

  return {
    url: response.data[0].url,
    mock: false,
    prompt,
    revisedPrompt: response.data[0].revised_prompt,
  };
}
