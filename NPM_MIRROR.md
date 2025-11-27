# TPMJS NPM-Integrated Registry Architecture

> **Automated tool discovery from NPM with zero-click submission**

## Vision

Transform TPMJS from a manual directory into an **automated NPM-integrated registry** where package authors simply publish to NPM with a `tpmjs` field in their `package.json` and their tools are discovered and listed within seconds—no manual submission, no forms, no waiting.

## Quick Start for Package Authors

```json
{
  "name": "my-awesome-tool",
  "version": "1.0.0",
  "keywords": ["tpmjs-tool"],
  "tpmjs": {
    "category": "web-scraping",
    "description": "Extract product data from e-commerce websites with ease",
    "example": "const data = await scraper.extract('https://shop.com')"
  }
}
```

```bash
npm publish
# ✨ Listed automatically within 15 minutes (keyword) or seconds (changes feed)
```

---

## Architecture Overview

```
NPM Ecosystem
    ↓
Changes Feed + Keyword Search
    ↓
Package Validator (Zod)
    ↓
PostgreSQL Database
    ↓
Next.js API Routes
    ↓
TPMJS Web App
```

### Core Components

1. **NPM Sync Service** (Node.js) - Monitors NPM registry for new packages
2. **PostgreSQL Database** - Stores validated tool metadata
3. **Next.js API** - Serves tool data with search/filtering
4. **Web Frontend** - Browse, search, and discover tools

---

## Discovery Mechanism: Hybrid Approach

### Method 1: Keyword Search (Official)
- Search NPM for packages with `tpmjs-tool` keyword
- Runs every 15 minutes via cron
- Packages marked as "Official"

### Method 2: Changes Feed (Automatic)
- Monitors `replicate.npmjs.com/registry/_changes` in real-time
- Detects packages with `tpmjs` field instantly
- Packages marked as "Community" (unless they also have keyword)

### Why Hybrid?
- **Keywords** = Clear opt-in, queryable, respects NPM conventions
- **Changes Feed** = Real-time, catches packages without keywords
- **Together** = Best discoverability with fallback

---

## The "tpmjs" Field: Tiered Schema

### Minimal Tier (Required)

```json
{
  "tpmjs": {
    "category": "web-scraping",
    "description": "Extract structured data from websites using CSS selectors",
    "example": "const data = await tool.scrape({ url: 'https://example.com', selector: '.price' })"
  }
}
```

**Categories:**
- web-scraping
- data-processing
- file-operations
- communication
- database
- api-integration
- image-processing
- text-analysis
- automation
- ai-ml
- security
- monitoring

### Rich Tier (Optional)

Extend with any of these optional fields:

```json
{
  "tpmjs": {
    // ... Required fields ...

    "parameters": [
      {
        "name": "url",
        "type": "string",
        "description": "Target URL to scrape",
        "required": true
      }
    ],
    "returns": {
      "type": "object",
      "description": "Extracted data matching the selector"
    },
    "authentication": {
      "required": false,
      "type": "api-key",
      "envVar": "SCRAPER_API_KEY",
      "docsUrl": "https://docs.example.com/auth"
    },
    "pricing": {
      "model": "freemium",
      "freeLimit": "100 requests/month",
      "paidUrl": "https://example.com/pricing"
    },
    "frameworks": ["vercel-ai", "langchain", "llamaindex"],
    "links": {
      "documentation": "https://docs.example.com",
      "playground": "https://example.com/try",
      "repository": "https://github.com/user/repo"
    },
    "tags": ["web", "scraping", "html", "css"],
    "status": "stable",
    "aiAgent": {
      "useCase": "Use when agent needs to extract data from websites",
      "limitations": "Cannot handle JavaScript-heavy SPAs"
    }
  }
}
```

---

## Database Schema

### Tools Table

```sql
CREATE TABLE tools (
  -- NPM Metadata
  npm_package_name VARCHAR(214) UNIQUE NOT NULL,
  npm_version VARCHAR(50) NOT NULL,
  npm_published_at TIMESTAMP NOT NULL,
  npm_description TEXT,
  npm_repository JSONB,
  npm_homepage TEXT,
  npm_license VARCHAR(50),

  -- TPMJS Metadata
  category VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  example TEXT NOT NULL,
  parameters JSONB,
  authentication JSONB,
  pricing JSONB,
  frameworks TEXT[],
  links JSONB,
  tags TEXT[],
  status VARCHAR(20),

  -- Discovery
  discovery_method VARCHAR(20) NOT NULL, -- 'keyword' | 'changes-feed'
  is_official BOOLEAN DEFAULT false,
  tier VARCHAR(20) NOT NULL, -- 'minimal' | 'rich'

  -- Metrics
  npm_downloads_last_month INTEGER DEFAULT 0,
  github_stars INTEGER DEFAULT 0,
  quality_score DECIMAL(3,2), -- 0.00 to 1.00

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Sync Service Architecture

### Workers

**1. Changes Feed Worker**
- Connects to `replicate.npmjs.com/registry/_changes`
- Receives real-time change events
- Fetches package metadata for each change
- Checks for `tpmjs` field
- Validates and inserts to database

**2. Keyword Search Worker**
- Runs every 15 minutes (cron)
- Searches `/-/v1/search?text=keywords:tpmjs-tool`
- Processes all results
- Marks as "Official"

**3. Metrics Worker** (Optional Phase 4)
- Updates download counts from NPM API
- Fetches GitHub stars
- Calculates quality scores

### Package Processing Pipeline

```
1. Fetch package metadata from NPM
2. Extract `tpmjs` field from latest version
3. Validate against Zod schema
4. If valid → Insert/Update database
5. If invalid → Log error
6. If no field → Skip
```

---

## API Routes

### GET /api/tools
Search and list tools

**Query Parameters:**
- `q` - Search query
- `category` - Filter by category
- `official` - Only official tools (true/false)
- `limit` - Results per page (default 20)
- `offset` - Pagination offset

**Response:**
```json
{
  "tools": [...],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### GET /api/tools/[id]
Get tool details by ID

### POST /api/tools/validate
Validate a `tpmjs` field before publishing

**Request:**
```json
{
  "category": "web-scraping",
  "description": "...",
  "example": "..."
}
```

**Response:**
```json
{
  "valid": true,
  "tier": "minimal",
  "errors": []
}
```

### GET /api/stats
Registry statistics

```json
{
  "totalTools": 2847,
  "officialTools": 150,
  "categories": {
    "web-scraping": 320,
    "communication": 280,
    ...
  }
}
```

---

## Quality Scoring Algorithm

Tools are scored 0.00 to 1.00 based on:

- **Base validity** (0.3) - Has valid schema
- **Tier** (0.1-0.2) - Rich tier > Minimal tier
- **NPM downloads** (0.2) - Based on monthly downloads
- **GitHub stars** (0.15) - Repository popularity
- **Documentation** (0.1) - Has docs URL
- **Example quality** (0.05) - Example length > 100 chars

Score is used for default sorting and quality indicators.

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- Set up PostgreSQL + Prisma
- Create Zod schemas in `@tpmjs/types`
- Build sync service structure
- Implement NPM API client

### Phase 2: Discovery (Week 2-3)
- Implement changes feed worker
- Implement keyword search worker
- Deploy sync service (Railway/Fly.io)
- Test with real packages

### Phase 3: API & Frontend (Week 3-4)
- Build Next.js API routes
- Update tool listing page
- Update tool detail pages
- Add validation endpoint

### Phase 4: Polish (Week 4-5)
- Add metrics worker
- Create documentation
- Build CLI validator
- Launch to community

### Phase 5: Enhancements (Post-Launch)
- Semantic search (embeddings)
- Usage analytics
- Tool recommendations
- GitHub Actions integration

---

## Infrastructure Requirements

### Sync Service
- **Platform:** Railway or Fly.io
- **Runtime:** Node.js 22+
- **Resources:** 512MB RAM, 1 CPU
- **Cost:** ~$5-10/month

### Database
- **Platform:** Neon Postgres (serverless)
- **Size:** Free tier (start), scale as needed
- **Backups:** Automatic with Neon
- **Cost:** Free tier available, ~$10-20/month for production

### Web App
- **Platform:** Vercel (existing)
- **No changes required**

---

## Monitoring & Health

### Metrics to Track

1. **Sync Health**
   - Changes feed uptime
   - Packages processed per hour
   - Validation success rate

2. **Database**
   - Total tools
   - Official vs community ratio
   - Tier distribution

3. **API**
   - Request latency (p95 < 200ms)
   - Search performance
   - Error rates

### Alerts

- Sync service down > 5 minutes
- Database connection failures
- Validation error rate > 10%

---

## Developer Experience

### Validation Before Publishing

```bash
# Using TPMJS CLI (to be built)
npx tpmjs validate

# Or via API
curl -X POST https://tpmjs.com/api/tools/validate \
  -H "Content-Type: application/json" \
  -d '{"category":"web-scraping","description":"...","example":"..."}'
```

### Documentation Pages Needed

1. **Getting Started** - Adding TPMJS support
2. **Schema Reference** - Complete field docs
3. **Best Practices** - Tips for quality tools
4. **Examples** - Sample configurations
5. **FAQ** - Common questions

---

## Migration from Mock Data

### Current State
- 12 mock tools in `toolData.ts`
- Client-side search
- Hard-coded categories

### Migration Strategy

1. **Publish Real Packages**
   - Create NPM packages for mock tools
   - Add `tpmjs` fields
   - Publish with `tpmjs-tool` keyword

2. **Update Frontend**
   - Replace mock data with API calls
   - Keep existing UI components
   - Update types to match Prisma models

3. **Gradual Rollout**
   - Dual mode (mock + real)
   - Real data primary, mock fallback
   - Remove mock entirely

---

## Success Metrics

### Technical
- ✓ Discovery latency < 60 seconds
- ✓ API response time < 200ms p95
- ✓ Support 10,000+ tools
- ✓ 99.9% uptime

### User Experience
- ✓ 0-click submission (automatic)
- ✓ Instant validation feedback
- ✓ <100ms search speed
- ✓ 100% mobile features

### Business
- Week 1: 10 official tools
- Month 1: 50 official tools
- Month 3: 200+ tools
- Month 6: 1000+ tools
- 50+ active package authors

---

## Comparison to Vercel's Approach

| Feature | Vercel AI SDK | TPMJS |
|---------|---------------|-------|
| **Submission** | Manual file edit + PR | Automatic via NPM |
| **Discovery** | None | Real-time changes feed |
| **Validation** | Manual review | Automated Zod schema |
| **Updates** | New PR required | Automatic on publish |
| **Search** | Static array | Full-text + categories |
| **Scale** | 6 tools | 1000+ tools ready |

---

## Next Steps

1. Review this architecture plan
2. Approve database schema and API design
3. Set up infrastructure (Railway + Postgres)
4. Start Phase 1: Foundation
5. Launch MVP in 4-5 weeks

---

## References

- [NPM Registry API Docs](https://github.com/npm/registry/blob/main/docs/REGISTRY-API.md)
- [NPM Changes Feed](https://github.com/npm/registry/blob/main/docs/REPLICATE-API.md)
- [Vercel AI Tools Registry](https://github.com/vercel/ai/blob/main/content/tools-registry/registry.ts)
- [TPMJS Architecture Plan](/.claude/plans/goofy-inventing-stearns.md) (Full details)

---

**Built with ❤️ for the AI agent ecosystem**
