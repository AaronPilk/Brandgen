import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

let anthropicClient = null;
let openaiClient = null;

function getAnthropicClient() {
  if (!anthropicClient && process.env.ANTHROPIC_API_KEY) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

function getOpenAIClient() {
  if (!openaiClient && process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

// Retry with exponential backoff
async function withRetry(fn, maxRetries = 2) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      const isOverloaded = err?.status === 529 || err?.message?.includes('Overloaded');
      const isRateLimit = err?.status === 429;
      if ((isOverloaded || isRateLimit) && i < maxRetries) {
        const delay = Math.pow(2, i + 1) * 1000;
        console.log(`[AI] Retry in ${delay / 1000}s (attempt ${i + 2})`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
}

// Model tiers — use cheaper models for simple tasks
const ANTHROPIC_MODELS = {
  fast: 'claude-haiku-4-5-20251001',
  standard: 'claude-sonnet-4-20250514',
};

const OPENAI_MODELS = {
  fast: 'gpt-4o-mini',
  standard: 'gpt-4o',
};

// Call Anthropic
async function callAnthropic(systemPrompt, userPrompt, maxTokens, quality) {
  const anthropic = getAnthropicClient();
  if (!anthropic) return null;

  const model = ANTHROPIC_MODELS[quality] || ANTHROPIC_MODELS.standard;

  const result = await withRetry(async () => {
    return anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });
  });

  return {
    text: result.content.filter((b) => b.type === 'text').map((b) => b.text).join(''),
    usage: { inputTokens: result.usage.input_tokens, outputTokens: result.usage.output_tokens },
    provider: 'anthropic',
    model,
  };
}

// Call OpenAI as fallback
async function callOpenAI(systemPrompt, userPrompt, maxTokens, quality) {
  const openai = getOpenAIClient();
  if (!openai) return null;

  const model = OPENAI_MODELS[quality] || OPENAI_MODELS.standard;

  const result = await withRetry(async () => {
    return openai.chat.completions.create({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });
  });

  return {
    text: result.choices[0]?.message?.content || '',
    usage: {
      inputTokens: result.usage?.prompt_tokens || 0,
      outputTokens: result.usage?.completion_tokens || 0,
    },
    provider: 'openai',
    model,
  };
}

// Main function — tries Anthropic first, falls back to OpenAI
// Returns enriched metadata for normalized logging
export async function generateWithClaude(systemPrompt, userPrompt, maxTokens = 800, quality = 'standard') {
  const startTime = Date.now();
  let retryCount = 0;
  let lastError = null;

  // Try Anthropic first
  try {
    const result = await callAnthropic(systemPrompt, userPrompt, maxTokens, quality);
    if (result) {
      return {
        ...result,
        latencyMs: Date.now() - startTime,
        retryCount,
        success: true,
        quality,
      };
    }
  } catch (err) {
    lastError = err;
    retryCount++;
    console.log(`[AI] Anthropic failed: ${err.message}. Falling back to OpenAI...`);
  }

  // Fallback to OpenAI
  try {
    const result = await callOpenAI(systemPrompt, userPrompt, maxTokens, quality);
    if (result) {
      return {
        ...result,
        latencyMs: Date.now() - startTime,
        retryCount,
        success: true,
        quality,
        fallback: true,
      };
    }
  } catch (err) {
    lastError = err;
    console.log(`[AI] OpenAI also failed: ${err.message}`);
  }

  throw new Error(`All AI providers unavailable: ${lastError?.message || 'unknown error'}`);
}
