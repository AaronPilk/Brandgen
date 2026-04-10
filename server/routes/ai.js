import { Router } from 'express';
import { generateWithClaude } from '../services/claude.js';
import { generateImage, isMockMode } from '../services/imageGen.js';
import { recordSpend, estimateCost, canAfford } from '../services/tokenBudget.js';
import { logEvent } from '../services/activityFeed.js';

const router = Router();

// Middleware: check budget before AI calls
function checkBudget(action) {
  return (req, res, next) => {
    const sessionId = req.body.sessionId || 'default';
    const estimate = estimateCost(action);
    const budget = canAfford(sessionId, estimate.estimatedCost);
    if (!budget.canAfford) {
      return res.status(402).json({
        error: 'Daily budget exceeded',
        ...budget,
        estimate,
      });
    }
    req.budgetInfo = { sessionId, estimate };
    next();
  };
}

function trackSpend(sessionId, usage, action) {
  const inputCost = (usage.inputTokens / 1000) * 0.003;
  const outputCost = (usage.outputTokens / 1000) * 0.015;
  const totalCost = inputCost + outputCost;
  recordSpend(sessionId, totalCost, action);
  return totalCost;
}

// Market Research
router.post('/market-research', checkBudget('market-research'), async (req, res) => {
  try {
    const { profile } = req.body;
    const intake = profile.intake;

    const systemPrompt = `You are a senior market research analyst. Provide concise, actionable market research. Be specific with data points and recommendations. Output in JSON format with keys: targetAudience, competitors, marketSize, opportunities, positioning, messagingAngles.`;

    let userPrompt;
    if (profile.mode === 'lead-gen') {
      userPrompt = `Research the ${intake.industry} industry for a ${intake.businessType} business targeting ${intake.geoTargets}. Their goal is: ${intake.primaryGoal}. Budget: ${intake.adBudget}/mo. Customer LTV: ${intake.customerLTV}. Differentiator: ${intake.differentiator}. Pain point: ${intake.painPoint}. Sales cycle: ${intake.salesCycle}.${intake.businessStage === 'operating' ? ` Current revenue: ${intake.monthlyRevenue}. Current leads: ${intake.leadVolume}/mo. Website: ${intake.websiteUrl}.` : ''}`;
    } else {
      userPrompt = `Research the market for a brand: ${intake.brandName || 'New brand'}. They sell: ${intake.whatYouSell || intake.productCategory || 'TBD'}. Target customer: ${intake.targetCustomer || `Age ${intake.targetAge}, ${intake.geoMarket}`}. Brand vibe: ${intake.brandVibe || 'modern'}. Competitors: ${intake.competitorUrls || 'none listed'}.`;
    }

    const result = await generateWithClaude(systemPrompt, userPrompt, 800);
    const cost = trackSpend(req.budgetInfo.sessionId, result.usage, 'market-research');

    logEvent(profile.id, 'RESEARCH_COMPLETE', { industry: intake.industry || intake.brandName, cost, tokens: result.usage });
    res.json({ research: result.text, usage: result.usage, cost });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Landing Page
router.post('/landing-page', checkBudget('landing-page'), async (req, res) => {
  try {
    const { profile } = req.body;
    const intake = profile.intake;
    const research = profile.research;

    const systemPrompt = `You are an expert conversion-focused landing page copywriter. Generate complete landing page HTML with inline Tailwind CSS classes. The page must be mobile-responsive, have a clear hero section, benefits, social proof section, and a strong CTA. Include form with name, email, phone fields. Output valid HTML only.`;

    const userPrompt = `Create a high-converting landing page for: ${intake.industry || intake.brandName || 'this brand'}. Goal: ${intake.primaryGoal || 'conversions'}. Target: ${intake.geoTargets || intake.targetCustomer || 'general audience'}. Key differentiator: ${intake.differentiator || intake.brandVibe || 'quality service'}. ${research ? `Market research context: ${typeof research === 'string' ? research.substring(0, 300) : JSON.stringify(research).substring(0, 300)}` : ''}. Include UTM parameter capture in the form (read from URL params). Include placeholder comments for tracking pixels.`;

    const result = await generateWithClaude(systemPrompt, userPrompt, 800);
    const cost = trackSpend(req.budgetInfo.sessionId, result.usage, 'landing-page');

    // Inject tracking pixels if configured
    let html = result.text;
    const pixels = buildPixelSnippets();
    if (pixels) {
      html = html.replace('</head>', `${pixels}\n</head>`);
    }

    logEvent(profile.id, 'LANDING_PAGE_GENERATED', { cost, tokens: result.usage });
    res.json({ html, usage: result.usage, cost });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ad Creatives
router.post('/ad-creatives', checkBudget('ad-creatives'), async (req, res) => {
  try {
    const { profile } = req.body;
    const intake = profile.intake;

    const systemPrompt = `You are a performance marketing creative strategist specializing in Meta and TikTok ads. Generate 10 ad creative concepts. For each, provide: headline, primaryText, description, callToAction, platform (Meta or TikTok), format (image/video/carousel), visualDirection (what the image/video should show). Output as JSON array.`;

    const userPrompt = `Create 10 ad creatives for: ${intake.industry || intake.brandName}. Target audience: ${intake.geoTargets || intake.targetCustomer}. Goal: ${intake.primaryGoal || 'brand awareness and sales'}. Budget: ${intake.adBudget || 'moderate'}. Differentiator: ${intake.differentiator || intake.brandVibe || 'unique value'}.`;

    const result = await generateWithClaude(systemPrompt, userPrompt, 800);
    const cost = trackSpend(req.budgetInfo.sessionId, result.usage, 'ad-creatives');

    logEvent(profile.id, 'AD_CREATIVES_GENERATED', { cost, tokens: result.usage });
    res.json({ creatives: result.text, usage: result.usage, cost });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Email Sequences
router.post('/email-sequences', checkBudget('email-sequences'), async (req, res) => {
  try {
    const { profile } = req.body;
    const intake = profile.intake;

    const systemPrompt = `You are an email marketing expert. Create a 5-email nurture sequence. For each email provide: subject, preheader, body (with HTML formatting), sendDelay (days after signup), purpose. Output as JSON array. Emails should be industry-specific and conversion-focused.`;

    const userPrompt = `Create email sequences for: ${intake.industry || intake.brandName}. Sales cycle: ${intake.salesCycle || 'varies'}. Goal: ${intake.primaryGoal || 'nurture to purchase'}. Target: ${intake.geoTargets || intake.targetCustomer}. Differentiator: ${intake.differentiator || intake.brandVibe}.`;

    const result = await generateWithClaude(systemPrompt, userPrompt, 800);
    const cost = trackSpend(req.budgetInfo.sessionId, result.usage, 'email-sequences');

    logEvent(profile.id, 'EMAIL_SEQUENCES_GENERATED', { cost });
    res.json({ sequences: result.text, usage: result.usage, cost });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SMS Sequences
router.post('/sms-sequences', checkBudget('sms-sequences'), async (req, res) => {
  try {
    const { profile } = req.body;
    const intake = profile.intake;

    const systemPrompt = `You are an SMS marketing specialist. Create a 5-message SMS follow-up sequence. Each message must be under 160 characters. For each provide: message, sendDelay (hours/days after signup), purpose. Output as JSON array. Messages should feel personal, not spammy.`;

    const userPrompt = `Create SMS follow-up sequence for: ${intake.industry || intake.brandName}. Sales cycle: ${intake.salesCycle || 'varies'}. Goal: ${intake.primaryGoal || 'book appointment'}. Industry: ${intake.industry || 'general'}.`;

    const result = await generateWithClaude(systemPrompt, userPrompt, 800);
    const cost = trackSpend(req.budgetInfo.sessionId, result.usage, 'sms-sequences');

    logEvent(profile.id, 'SMS_SEQUENCES_GENERATED', { cost });
    res.json({ sequences: result.text, usage: result.usage, cost });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logo Concepts
router.post('/logo-concepts', checkBudget('logo-concepts'), async (req, res) => {
  try {
    const { profile } = req.body;
    const intake = profile.intake;

    // First generate logo descriptions with Claude
    const systemPrompt = `You are a brand identity designer. Generate 3 distinct logo concept descriptions for DALL-E image generation. Each should be different in style (minimalist, bold, artistic). Output as JSON array with keys: name, dallePrompt, style, colorPalette.`;

    const userPrompt = `Create 3 logo concepts for: ${intake.brandName || intake.industry}. Brand vibe: ${intake.brandVibe || 'modern and professional'}. Industry: ${intake.industry || intake.whatYouSell || 'general'}.`;

    const result = await generateWithClaude(systemPrompt, userPrompt, 600);
    const cost = trackSpend(req.budgetInfo.sessionId, result.usage, 'logo-concepts');

    // Generate images (mock or real)
    let concepts;
    try {
      concepts = JSON.parse(result.text);
    } catch {
      concepts = [
        { name: 'Concept 1', dallePrompt: `Modern minimalist logo for ${intake.brandName || 'brand'}`, style: 'minimalist' },
        { name: 'Concept 2', dallePrompt: `Bold typography logo for ${intake.brandName || 'brand'}`, style: 'bold' },
        { name: 'Concept 3', dallePrompt: `Artistic emblem logo for ${intake.brandName || 'brand'}`, style: 'artistic' },
      ];
    }

    const images = [];
    for (const concept of concepts.slice(0, 3)) {
      const image = await generateImage(concept.dallePrompt);
      images.push({ ...concept, image });
      if (!isMockMode()) {
        recordSpend(req.budgetInfo.sessionId, 0.04, 'dalle-logo');
      }
    }

    res.json({ concepts: images, usage: result.usage, cost });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Product Mockups
router.post('/product-mockups', checkBudget('product-mockups'), async (req, res) => {
  try {
    const { profile } = req.body;
    const intake = profile.intake;

    const systemPrompt = `You are a product visualization specialist. Generate 3 product mockup descriptions for DALL-E image generation. Include t-shirt mockups, packaging, and lifestyle shots. Output as JSON array with keys: name, dallePrompt, type.`;

    const userPrompt = `Create 3 product mockup descriptions for: ${intake.brandName || intake.industry}. Product: ${intake.whatYouSell || 'apparel/merch'}. Brand vibe: ${intake.brandVibe || 'modern'}.`;

    const result = await generateWithClaude(systemPrompt, userPrompt, 600);
    const cost = trackSpend(req.budgetInfo.sessionId, result.usage, 'product-mockups');

    let mockups;
    try {
      mockups = JSON.parse(result.text);
    } catch {
      mockups = [
        { name: 'T-Shirt Mockup', dallePrompt: `T-shirt product mockup for ${intake.brandName || 'brand'}`, type: 'apparel' },
        { name: 'Packaging', dallePrompt: `Product packaging mockup for ${intake.brandName || 'brand'}`, type: 'packaging' },
        { name: 'Lifestyle Shot', dallePrompt: `Lifestyle product photo for ${intake.brandName || 'brand'}`, type: 'lifestyle' },
      ];
    }

    const images = [];
    for (const mockup of mockups.slice(0, 3)) {
      const image = await generateImage(mockup.dallePrompt);
      images.push({ ...mockup, image });
      if (!isMockMode()) {
        recordSpend(req.budgetInfo.sessionId, 0.04, 'dalle-mockup');
      }
    }

    res.json({ mockups: images, usage: result.usage, cost });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Social Media Setup
router.post('/social-setup', checkBudget('social-setup'), async (req, res) => {
  try {
    const { profile, platform } = req.body;
    const intake = profile.intake;

    const systemPrompt = `You are a social media strategist. Generate a complete ${platform} profile setup guide with: bio, profileDescription, contentPillars (3-5 topics), firstWeekPosts (5 post ideas with captions), hashtagStrategy, visualStyle. Output as JSON.`;

    const userPrompt = `Set up ${platform} for: ${intake.brandName || intake.industry}. Target audience: ${intake.targetCustomer || intake.geoTargets}. Brand vibe: ${intake.brandVibe || 'professional'}. Industry: ${intake.industry || intake.whatYouSell}.`;

    const result = await generateWithClaude(systemPrompt, userPrompt, 800);
    const cost = trackSpend(req.budgetInfo.sessionId, result.usage, 'social-setup');

    res.json({ setup: result.text, platform, usage: result.usage, cost });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tracking Pixels Setup
router.post('/tracking-pixels', checkBudget('tracking-pixels'), async (req, res) => {
  try {
    const { profile } = req.body;

    const systemPrompt = `You are a digital marketing tracking specialist. Generate tracking pixel installation code and configuration guide. Include: Meta Pixel, TikTok Pixel, Google Analytics 4, and Pinterest Tag. For each, provide: setupInstructions, codeSnippet, conversionEvents, testingSteps. Output as JSON.`;

    const userPrompt = `Generate tracking pixel setup for a ${profile.mode === 'lead-gen' ? 'lead generation' : 'e-commerce brand'} business. Primary goal: ${profile.intake.primaryGoal || 'conversions'}. Platforms used: Meta, TikTok, Google, Pinterest.`;

    const result = await generateWithClaude(systemPrompt, userPrompt, 800);
    const cost = trackSpend(req.budgetInfo.sessionId, result.usage, 'tracking-pixels');

    res.json({
      setup: result.text,
      connectedPixels: {
        metaPixel: !!process.env.META_PIXEL_ID,
        tiktokPixel: !!process.env.TIKTOK_PIXEL_ID,
        googleAnalytics: !!process.env.GOOGLE_ANALYTICS_ID,
        pinterestTag: !!process.env.PINTEREST_TAG_ID,
      },
      usage: result.usage,
      cost,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Brand Strategy
router.post('/brand-strategy', checkBudget('brand-strategy'), async (req, res) => {
  try {
    const { profile } = req.body;
    const intake = profile.intake;

    const systemPrompt = `You are a brand strategist. Create a comprehensive brand strategy document. Include: brandPositioning, voiceAndTone, colorPsychology, targetPersonas (2-3), competitiveAdvantage, brandStory, taglineOptions (3). Output as JSON.`;

    const userPrompt = `Create brand strategy for: ${intake.brandName || intake.industry}. Sells: ${intake.whatYouSell || intake.industry}. Customer: ${intake.targetCustomer || 'general'}. Owner personality: ${intake.personalityWords || 'professional'}. Tone: ${intake.formalOrCasual || 'balanced'}. Brand vibe: ${intake.brandVibe || 'modern'}. Competitors: ${intake.competitorUrls || 'none listed'}.`;

    const result = await generateWithClaude(systemPrompt, userPrompt, 800);
    const cost = trackSpend(req.budgetInfo.sessionId, result.usage, 'brand-strategy');

    res.json({ strategy: result.text, usage: result.usage, cost });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function buildPixelSnippets() {
  const snippets = [];

  if (process.env.META_PIXEL_ID) {
    snippets.push(`<!-- Meta Pixel --><script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${process.env.META_PIXEL_ID}');fbq('track','PageView');</script>`);
  }
  if (process.env.TIKTOK_PIXEL_ID) {
    snippets.push(`<!-- TikTok Pixel --><script>!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{}};ttq.load('${process.env.TIKTOK_PIXEL_ID}');ttq.page();}(window,document,'ttq');</script>`);
  }
  if (process.env.GOOGLE_ANALYTICS_ID) {
    snippets.push(`<!-- Google Analytics --><script async src="https://www.googletagmanager.com/gtag/js?id=${process.env.GOOGLE_ANALYTICS_ID}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${process.env.GOOGLE_ANALYTICS_ID}');</script>`);
  }
  if (process.env.PINTEREST_TAG_ID) {
    snippets.push(`<!-- Pinterest Tag --><script>!function(e){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var n=window.pintrk;n.queue=[],n.version="3.0";var t=document.createElement("script");t.async=!0,t.src=e;var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");pintrk('load','${process.env.PINTEREST_TAG_ID}');pintrk('page');</script>`);
  }

  return snippets.length > 0 ? snippets.join('\n') : '';
}

export { router as aiRoutes };
