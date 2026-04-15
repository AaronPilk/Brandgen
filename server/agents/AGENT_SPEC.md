# BrandGen Agent Plugin Specification

## Overview

BrandGen agents are standalone services that connect to the BrandGen platform via a standardized plugin API. Each agent lives in its own repository and is added to BrandGen as a git submodule under `server/agents/<agent-name>/`.

## Architecture

```
BrandGen (host)
├── server/agents/
│   ├── pluginInterface.js    # Base class + types
│   ├── pluginLoader.js       # Discovery + action queue
│   ├── AGENT_SPEC.md         # This file
│   ├── sales-agent/          # Git submodule → separate repo
│   │   ├── manifest.json
│   │   ├── index.js
│   │   └── ...
│   └── social-media-agent/   # Git submodule → separate repo
│       ├── manifest.json
│       ├── index.js
│       └── ...
```

## Communication Flow

1. **Agent fetches context** via `GET /api/agents/:profileId/context?scopes=brand,crm,calendar`
2. **Agent proposes actions** via `POST /api/agents/:profileId/actions`
3. **Human reviews** in BrandGen UI (action queue)
4. **Human approves/rejects** via `POST /api/agents/actions/:id/approve`
5. **BrandGen executes** the approved action via `POST /api/agents/actions/:id/execute`

## Required Files

### manifest.json

```json
{
  "key": "sales_agent",
  "name": "Sales Agent",
  "version": "1.0.0",
  "description": "Manages leads, follow-ups, and deal progression",
  "scopes": ["crm", "nurture", "brand"],
  "actions": ["create_contact", "update_contact", "update_deal", "send_email", "log_note"],
  "triggers": ["new_contact", "deal_stage_change", "contact_inactive"],
  "config": {
    "followUpDelayHours": 24,
    "maxEmailsPerDay": 50
  }
}
```

### index.js

```javascript
import { AgentPlugin } from '../pluginInterface.js';
import manifest from './manifest.json' assert { type: 'json' };

class SalesAgent extends AgentPlugin {
  constructor() {
    super(manifest);
  }

  async initialize(config) {
    // Set up agent-specific config
    this.config = { ...manifest.config, ...config };
  }

  async onEvent(event, context) {
    // React to events like new_contact, deal_stage_change
    // Return proposed actions
  }

  async propose(goal, context) {
    // Given a goal and context, return proposed actions
    return [
      {
        type: 'update_deal',
        agentKey: 'sales_agent',
        profileId: context.profileId,
        payload: { id: 'deal-123', data: { stage: 'qualified' } },
        reasoning: 'Contact responded to 3 emails and visited pricing page',
        priority: 'medium',
        requiresApproval: true,
      }
    ];
  }

  async execute(action, executor) {
    // Called after approval — use executor to perform the action
    switch (action.type) {
      case 'update_deal':
        return executor.updateDeal(action.payload.id, action.payload.data);
      case 'create_contact':
        return executor.createContact(action.payload);
      default:
        throw new Error(`Unknown action: ${action.type}`);
    }
  }
}

export default new SalesAgent();
```

## Available Action Types

| Type | Payload | Description |
|------|---------|-------------|
| `create_post` | `{ title, content, type, platforms, scheduledAt, hashtags }` | Create a calendar post |
| `update_post` | `{ id, data: { ... } }` | Update an existing post |
| `schedule_post` | `{ id, scheduledAt }` | Schedule a post |
| `create_contact` | `{ firstName, lastName, email, phone, company, source, status }` | Add a CRM contact |
| `update_contact` | `{ id, data: { ... } }` | Update a contact |
| `create_deal` | `{ title, value, stage, contactId }` | Create a deal |
| `update_deal` | `{ id, data: { ... } }` | Update a deal |
| `send_email` | `{ to, subject, body, templateId }` | Queue an email |
| `send_sms` | `{ to, body }` | Queue an SMS |
| `prepare_campaign` | `{ name, objective, budget, targeting, creatives }` | Prepare a Meta campaign |
| `log_note` | `{ note }` | Log an activity note |

## Available Data Scopes

| Scope | Data Provided |
|-------|--------------|
| `brand` | Profile intake, brand facts, research, strategy |
| `crm` | Contacts, deals, pipeline stats |
| `calendar` | Content calendar posts, schedule, stats |
| `ads` | Meta campaigns, ad performance, creatives |
| `analytics` | Platform data, performance metrics |
| `nurture` | Email/SMS sequences |

## Context Response Shape

```json
{
  "profileId": "abc-123",
  "brand": {
    "name": "Acme Corp",
    "mode": "lead-gen",
    "intake": { ... },
    "facts": { ... }
  },
  "crm": {
    "contacts": [...],
    "deals": [...],
    "contactStats": { "total": 45, "new": 12, ... },
    "dealStats": { "total": 8, "totalValue": 50000, ... }
  },
  "calendar": {
    "posts": [...],
    "stats": { "total": 20, "scheduled": 5, ... }
  }
}
```

## Authentication

Agents authenticate with the same JWT token system as the BrandGen UI. Pass the token in the Authorization header:

```
Authorization: Bearer <token>
```

For automated agent processes, use a service account token (admin creates via the team management UI).

## Adding an Agent as Submodule

```bash
cd /path/to/Brandgen
git submodule add https://github.com/your-org/sales-agent.git server/agents/sales-agent
```

## Action Queue Priority

Actions are sorted by priority: `urgent` > `high` > `medium` > `low`, then by creation time.

## Safety

- All agent actions go through the approval queue by default
- `requiresApproval: false` is only respected for `log_note` type actions
- The `auto` execution mode is disabled in V1
- Agents cannot directly access the database — only through the executor functions
- Rate limits apply per-agent per-profile (configurable)
