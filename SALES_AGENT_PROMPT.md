# Sales Agent — Build Prompt for Claude Code

## What This Is

Copy this entire prompt into a new Claude Code session connected to a fresh GitHub repo (e.g. `skywaymediacode/sales-agent`). It contains everything needed to build the Sales Agent as a standalone service that plugs into BrandGen.

---

## System Overview

Build a **Sales Agent** — an AI-powered autonomous sales pipeline manager that integrates with the BrandGen platform as a plugin. The agent scrapes leads, enriches contact data, manages follow-up sequences, qualifies prospects, and progresses deals through the pipeline.

**This is NOT a standalone app.** It's a BrandGen agent plugin that:
1. Connects to BrandGen via REST API to read CRM data and brand context
2. Proposes actions (create contacts, update deals, send emails) through BrandGen's approval queue
3. Gets executed by BrandGen after human approval
4. Can also run in "assist" mode where it just surfaces suggestions

## Tech Stack

- **Runtime**: Node.js 20+ (ES modules)
- **AI**: Anthropic Claude API (primary), OpenAI GPT-4o (fallback)
- **Web Scraping**: Puppeteer or Playwright for lead scraping
- **Email**: Nodemailer + configurable SMTP
- **Structure**: Git submodule that lives at `BrandGen/server/agents/sales-agent/`

## Required Files

```
sales-agent/
├── manifest.json          # BrandGen plugin manifest
├── index.js               # Plugin entry point (extends AgentPlugin)
├── package.json
├── .env.example
├── src/
│   ├── agent.js           # Main agent logic
│   ├── scraper.js         # Lead scraping engine
│   ├── enricher.js        # Contact data enrichment
│   ├── qualifier.js       # Lead qualification scoring
│   ├── sequencer.js       # Follow-up sequence engine
│   ├── emailer.js         # Email composition + sending
│   ├── analyzer.js        # Pipeline analysis + suggestions
│   └── config.js          # Agent configuration
└── templates/
    ├── cold-outreach.json # Email sequence templates
    ├── follow-up.json
    ├── re-engagement.json
    └── closing.json
```

## manifest.json

```json
{
  "key": "sales_agent",
  "name": "Sales Agent",
  "version": "1.0.0",
  "description": "AI-powered sales pipeline manager — scrapes leads, enriches data, manages follow-ups, and qualifies prospects",
  "scopes": ["crm", "nurture", "brand", "analytics"],
  "actions": [
    "create_contact",
    "update_contact",
    "update_deal",
    "create_deal",
    "send_email",
    "send_sms",
    "log_note",
    "surface_insight"
  ],
  "triggers": [
    "new_contact",
    "deal_stage_change",
    "contact_inactive",
    "daily_digest",
    "weekly_report"
  ],
  "config": {
    "followUpDelayHours": 24,
    "maxEmailsPerDay": 50,
    "autoQualifyThreshold": 0.7,
    "scrapeTargets": [],
    "enrichmentSources": ["clearbit", "zoominfo", "linkedin"],
    "emailSmtp": {}
  }
}
```

## index.js — Plugin Entry Point

Must extend BrandGen's `AgentPlugin` class:

```javascript
import { AgentPlugin } from '../pluginInterface.js';
// Import your actual agent logic from src/

class SalesAgentPlugin extends AgentPlugin {
  constructor() {
    super(manifest);
  }

  async initialize(config) { /* load config, set up connections */ }

  async onEvent(event, context) {
    // React to: new_contact, deal_stage_change, contact_inactive, daily_digest
    // Return proposed actions
  }

  async propose(goal, context) {
    // Given a natural language goal + brand/CRM context, return actions
    // Examples:
    //   "Find 50 leads in the dental industry in Miami"
    //   "Follow up with all contacts who haven't responded in 3 days"
    //   "Qualify all new contacts from last week"
  }

  async execute(action, executor) {
    // After human approval, execute the action using BrandGen's executor
  }
}

export default new SalesAgentPlugin();
```

## Core Capabilities

### 1. Lead Scraping (`scraper.js`)

The agent needs to scrape the internet for leads based on:
- **Industry/niche** from brand profile (e.g. "dental practices in South Florida")
- **Google Maps** business listings
- **LinkedIn** company search (within legal limits)
- **Industry directories** (Yelp, Yellow Pages, niche directories)
- **Google search** for business websites with contact info

For each scraped lead, extract:
- Business name, website, phone, email
- Contact person (owner/manager) name and email if available
- Address, city, state
- Business category/tags
- Social media profiles

**Important**: Respect robots.txt, rate limit requests (2-5 second delays), rotate user agents. No aggressive scraping.

### 2. Contact Enrichment (`enricher.js`)

Take a basic contact (name + email or company) and enrich with:
- Full company info (size, revenue estimate, industry)
- Social profiles (LinkedIn, Facebook, Instagram)
- Tech stack (what tools they use — from BuiltWith or similar)
- Recent news/activity
- Decision maker identification

Sources (in priority order):
1. Company website scrape (about page, team page)
2. Social media profiles
3. ZoomInfo API (if configured)
4. Clearbit API (if configured)
5. AI-powered inference from available data

### 3. Lead Qualification (`qualifier.js`)

Score each lead 0-100 based on configurable criteria:
- **Fit score** (30%): Does this lead match the ideal customer profile from brand intake?
- **Intent score** (25%): Are there buying signals? (website visits, email opens, social engagement)
- **Budget score** (20%): Estimated company size/revenue vs. service pricing
- **Timing score** (15%): Urgency signals (new business, expanding, pain points)
- **Accessibility score** (10%): Can we reach a decision maker?

AI generates a qualification summary with:
- Overall score
- Breakdown by category
- Recommended next action
- Personalized talking points

### 4. Follow-up Sequences (`sequencer.js`)

Manage multi-step outreach sequences:

**Cold Outreach Sequence** (new lead, no prior contact):
1. Day 0: Personalized intro email
2. Day 3: Follow-up with value proposition
3. Day 7: Case study or social proof
4. Day 14: "Break-up" email (last chance)

**Warm Follow-up** (responded or engaged):
1. Immediate: Thank you + next steps
2. Day 2: Additional resources
3. Day 5: Meeting request

**Re-engagement** (went cold after initial contact):
1. Day 0: New value/offer
2. Day 7: Different angle
3. Day 21: Final re-engagement

**Closing Sequence** (proposal stage):
1. Day 0: Proposal delivery
2. Day 3: Check-in
3. Day 7: Address objections
4. Day 14: Final offer

Each email in the sequence is AI-generated based on:
- Brand voice and messaging from BrandGen profile
- Contact's specific business and pain points
- Previous interaction history
- What stage they're in

### 5. Email Composition (`emailer.js`)

AI-powered email writing that:
- Matches the brand's voice and tone
- Personalizes based on recipient's business
- Includes relevant case studies or social proof
- Has clear CTAs
- A/B test subject lines
- Tracks opens and clicks (via pixel or link wrapping)

Configuration:
- SMTP settings (host, port, auth)
- From name/email per brand
- Daily send limits
- Blacklist/unsubscribe handling

### 6. Pipeline Analysis (`analyzer.js`)

Periodic analysis that surfaces:
- Deals likely to close (high probability)
- Deals at risk (stalled, no activity)
- Revenue forecast for next 30/60/90 days
- Best performing lead sources
- Email sequence effectiveness
- Recommended actions per deal

## Communication with BrandGen

### Fetching Context

```javascript
// The agent calls BrandGen's API to get context
const response = await fetch(`${BRANDGEN_URL}/api/agents/${profileId}/context?scopes=brand,crm,nurture`, {
  headers: { Authorization: `Bearer ${token}` }
});
const context = await response.json();

// context = {
//   profileId: "abc-123",
//   brand: { name, mode, intake, facts },
//   crm: { contacts, deals, contactStats, dealStats },
// }
```

### Proposing Actions

```javascript
// Agent proposes actions through BrandGen's queue
await fetch(`${BRANDGEN_URL}/api/agents/${profileId}/actions`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentKey: 'sales_agent',
    type: 'create_contact',
    payload: {
      firstName: 'John',
      lastName: 'Smith',
      email: 'john@dentalclinic.com',
      company: 'Smith Dental',
      source: 'agent-scrape',
      tags: ['dental', 'south-florida', 'qualified'],
      notes: 'Found via Google Maps. 4.8 star rating, 200+ reviews. Decision maker: Dr. John Smith.',
      value: 5000,
    },
    reasoning: 'High-fit lead: dental practice in target market (South Florida), strong online presence, no current marketing agency detected.',
    priority: 'high',
    requiresApproval: true,
  })
});
```

### Action Types the Sales Agent Uses

| Action | When | Payload |
|--------|------|---------|
| `create_contact` | New lead scraped/found | Contact fields + qualification notes |
| `update_contact` | Enrichment data received, status change | Updated fields |
| `create_deal` | Qualified lead ready for pipeline | Deal title, value, stage |
| `update_deal` | Stage progression, notes added | Updated stage, notes |
| `send_email` | Sequence step due | To, subject, body, templateId |
| `log_note` | Any observation or insight | Note text |
| `surface_insight` | Pipeline analysis finding | Insight type, description, recommended action |

## Configuration (.env)

```
# BrandGen connection
BRANDGEN_URL=http://localhost:3001
BRANDGEN_TOKEN=<service-account-token>

# AI
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Email
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM_NAME=
SMTP_FROM_EMAIL=

# Enrichment (optional)
CLEARBIT_API_KEY=
ZOOMINFO_API_KEY=

# Scraping
SCRAPE_RATE_LIMIT_MS=3000
SCRAPE_MAX_PER_SESSION=100
```

## Key Design Principles

1. **All actions go through approval** — The agent NEVER directly modifies BrandGen data. It proposes, humans approve.
2. **Brand context aware** — Every email, every qualification uses the brand's voice and ICP from BrandGen.
3. **Rate limited** — Scraping is throttled, emails have daily caps, API calls are budgeted.
4. **Resumable** — Sequences survive restarts. State is persisted.
5. **Observable** — Every action is logged with reasoning. Humans can see why the agent did what it did.
6. **Modular** — Each capability (scrape, enrich, qualify, email) works independently.

## Running Modes

When enabled in BrandGen for a profile, the agent operates in one of these modes:

- **assist**: Agent analyzes data and surfaces suggestions. No automatic outreach. Human triggers everything.
- **semi_auto**: Agent automatically scrapes and enriches. Emails and deal changes require approval.
- **auto**: (Future, V2) Agent runs fully autonomous within configured guardrails.

## What to Build First (Priority Order)

1. `manifest.json` + `index.js` — Plugin structure so BrandGen can discover it
2. `src/agent.js` — Main agent loop (fetch context, analyze, propose)
3. `src/scraper.js` — Google Maps + website scraping for leads
4. `src/qualifier.js` — AI-powered lead scoring
5. `src/emailer.js` — Email composition with AI
6. `src/sequencer.js` — Follow-up sequence management
7. `src/enricher.js` — Contact enrichment
8. `src/analyzer.js` — Pipeline analysis
9. `templates/` — Email sequence templates

## Testing

- Create a test profile in BrandGen (e.g. "Test Dental Agency")
- Add some sample contacts and deals
- Run the agent against that profile
- Verify it proposes sensible actions
- Approve some actions and verify they execute correctly

The agent should be immediately useful even with just scraper + qualifier + basic email templates. Start lean, iterate.
