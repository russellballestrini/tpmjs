# TPMJS NPM Registry - Implementation Checklist

> **Reference:** See [NPM_MIRROR.md](./NPM_MIRROR.md) for complete architecture details

**Stack Decision:** Vercel + Neon + Vercel Cron (polling-based sync)

---

## 🎯 Implementation Strategy

### Architecture Simplification

**Original Plan (NPM_MIRROR.md):**
- Separate Node.js sync service with persistent changes feed connection
- Self-hosted PostgreSQL
- More complex deployment

**Revised Plan (This Checklist):**
- All-in-one Next.js app on Vercel
- Neon Postgres (serverless)
- Vercel Cron for sync jobs (polling-based, no persistent connections)
- Simpler, faster to ship

### Why This Approach?

✅ **Simpler Infrastructure**
- One deployment (Vercel)
- Managed database (Neon)
- Built-in cron (Vercel Cron)

✅ **Lower Cost**
- No separate sync service hosting
- Neon free tier generous
- Vercel free/hobby tier sufficient for MVP

✅ **Same Functionality**
- Poll NPM changes feed every 1-2 minutes (effectively real-time)
- All discovery features from NPM_MIRROR.md maintained
- Quality scoring, validation, etc. all work the same

---

## 📋 Phase 1: Foundation (Week 1)

**Goal:** Set up database, types, and NPM client

### 1.1 Database Setup

- [ ] **Create Neon project**
  - Go to https://neon.tech/
  - Create new project
  - Save connection string

- [ ] **Create `packages/db` package**
  ```bash
  mkdir -p packages/db
  cd packages/db
  pnpm init
  pnpm add prisma @prisma/client
  pnpm add -D typescript @types/node
  ```

- [ ] **Initialize Prisma**
  ```bash
  npx prisma init
  ```

- [ ] **Create Prisma schema**
  - Copy schema from NPM_MIRROR.md Database Design section
  - File: `packages/db/prisma/schema.prisma`
  - Include all three models: `Tool`, `SyncCheckpoint`, `SyncLog`

- [ ] **Add database URL to `.env`**
  ```env
  DATABASE_URL="postgresql://..."
  ```

- [ ] **Run first migration**
  ```bash
  npx prisma migrate dev --name init
  npx prisma generate
  ```

- [ ] **Create Prisma client singleton**
  - File: `packages/db/src/client.ts`
  ```typescript
  import { PrismaClient } from '@prisma/client';

  const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
  };

  export const prisma = globalForPrisma.prisma ?? new PrismaClient();

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
  }
  ```

- [ ] **Export from package**
  - File: `packages/db/src/index.ts`
  ```typescript
  export { prisma } from './client';
  export * from '@prisma/client';
  ```

- [ ] **Update package.json**
  ```json
  {
    "name": "@tpmjs/db",
    "main": "./src/index.ts",
    "types": "./src/index.ts"
  }
  ```

- [ ] **Seed initial sync state**
  ```sql
  INSERT INTO sync_checkpoints (source, checkpoint)
  VALUES
    ('changes-feed', '{"sequence": 0}'::jsonb),
    ('keyword-search', '{"lastRun": null}'::jsonb),
    ('metrics', '{"lastRun": null}'::jsonb)
  ON CONFLICT (source) DO NOTHING;
  ```

**Verification:**
```bash
cd packages/db
npx prisma studio  # Should open DB browser with empty tables
```

---

### 1.2 Types Package

**Reference:** See NPM_MIRROR.md "The 'tpmjs' Field Schema" section

- [ ] **Update `packages/types/src/tool.ts`**
  - Add `TpmjsMinimalSchema` with Zod
  - Add `TpmjsRichSchema` extending minimal
  - Export both schemas and inferred types

- [ ] **Create validation helper**
  - File: `packages/types/src/validator.ts`
  ```typescript
  export function validateTpmjsField(tpmjs: unknown): {
    valid: boolean;
    tier: 'minimal' | 'rich' | null;
    data?: unknown;
    errors?: ZodError[];
  }
  ```

- [ ] **Update exports**
  - File: `packages/types/src/index.ts`
  - Export all schemas and validators

**Verification:**
```typescript
import { validateTpmjsField } from '@tpmjs/types';

const result = validateTpmjsField({
  category: 'web-scraping',
  description: 'Test description that is long enough',
  example: 'const x = await tool.test()'
});

console.log(result); // Should be { valid: true, tier: 'minimal', ... }
```

---

### 1.3 NPM Client Package

**Reference:** See NPM_MIRROR.md "NPM Integration Strategy" section

- [ ] **Create `packages/npm-client`**
  ```bash
  mkdir -p packages/npm-client/src
  cd packages/npm-client
  pnpm init
  pnpm add zod
  pnpm add -D typescript @types/node
  ```

- [ ] **Implement changes feed client**
  - File: `packages/npm-client/src/changes.ts`
  ```typescript
  export async function fetchChanges(since: string, limit = 100): Promise<{
    results: Array<{ id: string; seq: string }>;
    lastSeq: string;
  }>
  ```
  - Use endpoint: `https://replicate.npmjs.com/registry/_changes`
  - Poll-based (no EventSource needed)

- [ ] **Implement keyword search**
  - File: `packages/npm-client/src/search.ts`
  ```typescript
  export async function searchByKeyword(
    keyword: string,
    size = 250,
    from = 0
  ): Promise<Array<{ name: string }>>
  ```
  - Use endpoint: `/-/v1/search?text=keywords:${keyword}`

- [ ] **Implement package metadata fetcher**
  - File: `packages/npm-client/src/package.ts`
  ```typescript
  export async function fetchPackageMetadata(packageName: string): Promise<{
    name: string;
    'dist-tags': { latest: string };
    versions: Record<string, {
      version: string;
      description?: string;
      tpmjs?: unknown;
      // ... other fields
    }>;
    time: Record<string, string>;
  } | null>
  ```
  - Use endpoint: `https://registry.npmjs.org/${packageName}`

- [ ] **Implement download stats**
  - File: `packages/npm-client/src/stats.ts`
  ```typescript
  export async function fetchDownloadStats(
    packageName: string
  ): Promise<number>
  ```
  - Use endpoint: `https://api.npmjs.org/downloads/point/last-month/${packageName}`

- [ ] **Implement GitHub stats** (optional Phase 4)
  - File: `packages/npm-client/src/github.ts`
  ```typescript
  export async function fetchGithubStars(
    repoUrl: string
  ): Promise<number>
  ```

- [ ] **Add rate limiting helper**
  - File: `packages/npm-client/src/rate-limiter.ts`
  - Simple delay between requests
  - Exponential backoff on 429

- [ ] **Export all functions**
  - File: `packages/npm-client/src/index.ts`

**Verification:**
```typescript
import { fetchPackageMetadata } from '@tpmjs/npm-client';

const pkg = await fetchPackageMetadata('express');
console.log(pkg?.name); // Should print 'express'
```

---

## 📋 Phase 2: Core API Routes (Week 2)

**Goal:** Build public API for searching/listing tools

### 2.1 Tool Search/List API

**Reference:** See NPM_MIRROR.md "API Routes" section

- [ ] **Create `apps/web/src/app/api/tools/route.ts`**
  - Implement `GET` handler
  - Query params: `q`, `category`, `official`, `limit`, `offset`
  - Use Prisma to query `tools` table
  - Return paginated results with metadata

- [ ] **Add full-text search**
  - Use Postgres `ts_vector` for search
  - Or simple `ILIKE` for MVP
  - Search across: `npmPackageName`, `description`, `tags`

- [ ] **Add filtering**
  - By `category`
  - By `isOfficial`
  - By `tier` (optional)

- [ ] **Add sorting**
  - Default: `qualityScore DESC`, `npmDownloadsLastMonth DESC`
  - Optional: `createdAt DESC`, `npmPackageName ASC`

**Verification:**
```bash
curl "http://localhost:3001/api/tools?q=web&limit=5"
# Should return JSON with tools array and pagination
```

---

### 2.2 Tool Detail API

- [ ] **Create `apps/web/src/app/api/tools/[id]/route.ts`**
  - Implement `GET` handler
  - Accept ID or package name
  - Return full tool details

**Verification:**
```bash
curl "http://localhost:3001/api/tools/1"
# Should return single tool object
```

---

### 2.3 Validation API

- [ ] **Create `apps/web/src/app/api/tools/validate/route.ts`**
  - Implement `POST` handler
  - Accept JSON body with `tpmjs` field
  - Use `@tpmjs/types` validator
  - Return validation result with errors

**Verification:**
```bash
curl -X POST http://localhost:3001/api/tools/validate \
  -H "Content-Type: application/json" \
  -d '{"category":"web-scraping","description":"Test tool for validation","example":"const x = await tool.test()"}'
# Should return { valid: true, tier: "minimal" }
```

---

### 2.4 Stats API

- [ ] **Create `apps/web/src/app/api/stats/route.ts`**
  - Implement `GET` handler
  - Aggregate counts by category
  - Total tools, official tools, etc.

**Verification:**
```bash
curl "http://localhost:3001/api/stats"
# Should return { totalTools: 0, officialTools: 0, categories: {} }
```

---

## 📋 Phase 3: Sync Workers (Week 2-3)

**Goal:** Implement automatic NPM package discovery

**Reference:** See NPM_MIRROR.md "NPM Integration Strategy" section

### 3.1 Changes Feed Sync

- [ ] **Create `apps/web/src/app/api/sync/changes/route.ts`**

- [ ] **Implement POST handler**
  ```typescript
  export async function POST(request: Request) {
    // 1. Verify CRON_SECRET header
    // 2. Get last sequence from sync_checkpoints
    // 3. Fetch changes from NPM (limit 100-500)
    // 4. For each change:
    //    - Fetch package metadata
    //    - Check for tpmjs field
    //    - Validate with @tpmjs/types
    //    - Upsert to tools table
    //    - Log to sync_logs
    // 5. Update checkpoint with new sequence
    // 6. Return summary (processed, skipped, errors)
  }
  ```

- [ ] **Add secret protection**
  ```typescript
  const secret = request.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }
  ```

- [ ] **Add timeout protection**
  - Limit processing to 50 packages per run
  - Or 50 seconds max execution time
  - Save checkpoint frequently

- [ ] **Add error handling**
  - Try/catch around each package
  - Log errors to `sync_logs`
  - Continue processing other packages

**Verification:**
```bash
curl -X POST http://localhost:3001/api/sync/changes \
  -H "x-cron-secret: your-secret"
# Should process changes and return summary
```

---

### 3.2 Keyword Search Sync

- [ ] **Create `apps/web/src/app/api/sync/keyword/route.ts`**

- [ ] **Implement POST handler**
  ```typescript
  export async function POST(request: Request) {
    // 1. Verify CRON_SECRET header
    // 2. Search NPM for keyword 'tpmjs-tool'
    // 3. For each result:
    //    - Fetch package metadata
    //    - Validate tpmjs field
    //    - Upsert with isOfficial=true
    //    - Log to sync_logs
    // 4. Update checkpoint
    // 5. Return summary
  }
  ```

- [ ] **Handle pagination**
  - NPM allows `size` up to 250
  - May need multiple requests for all results

**Verification:**
```bash
curl -X POST http://localhost:3001/api/sync/keyword \
  -H "x-cron-secret: your-secret"
# Should search and process keyword packages
```

---

### 3.3 Metrics Sync (Phase 4)

- [ ] **Create `apps/web/src/app/api/sync/metrics/route.ts`**

- [ ] **Implement POST handler**
  ```typescript
  export async function POST(request: Request) {
    // 1. Verify CRON_SECRET
    // 2. Select tools to update (recent, popular, or sample)
    // 3. For each tool:
    //    - Fetch NPM download stats
    //    - Fetch GitHub stars (if repo exists)
    //    - Calculate quality score
    //    - Update tools table
    // 4. Update checkpoint
    // 5. Return summary
  }
  ```

**Verification:**
```bash
curl -X POST http://localhost:3001/api/sync/metrics \
  -H "x-cron-secret: your-secret"
# Should update metrics for tools
```

---

### 3.4 Vercel Cron Configuration

- [ ] **Add to `vercel.json`**
  ```json
  {
    "crons": [
      {
        "path": "/api/sync/changes",
        "schedule": "*/2 * * * *"
      },
      {
        "path": "/api/sync/keyword",
        "schedule": "*/15 * * * *"
      },
      {
        "path": "/api/sync/metrics",
        "schedule": "0 * * * *"
      }
    ]
  }
  ```

- [ ] **Set up environment variables in Vercel**
  - `DATABASE_URL` - Neon connection string
  - `CRON_SECRET` - Generate random secret
  - `NPM_REGISTRY_URL` - https://registry.npmjs.org
  - `NPM_CHANGES_URL` - https://replicate.npmjs.com/registry

---

## 📋 Phase 4: Frontend Integration (Week 3)

**Goal:** Replace mock data with real API calls

### 4.1 Update Tool Listing Page

- [ ] **Update `apps/web/src/app/tools/page.tsx`**
  - Remove mock data import
  - Fetch from `/api/tools`
  - Add loading state
  - Add error handling

- [ ] **Add search functionality**
  - Search input component
  - Debounced API calls
  - Update URL with search params

- [ ] **Add category filter**
  - Category dropdown/pills
  - Filter API calls by category

- [ ] **Add pagination**
  - Next/previous buttons
  - Or infinite scroll

**Verification:**
- Visit http://localhost:3001/tools
- Should show real tools from database
- Search should work
- Filters should work

---

### 4.2 Update Tool Detail Page

- [ ] **Update `apps/web/src/app/tools/[id]/page.tsx`**
  - Fetch from `/api/tools/[id]`
  - Display all tool metadata
  - Show rich tier fields if available

- [ ] **Add install instructions**
  - npm install command
  - Usage example from `tpmjs.example`

- [ ] **Add links**
  - NPM package page
  - GitHub repository
  - Documentation
  - Playground (if available)

**Verification:**
- Visit http://localhost:3001/tools/some-package
- Should show full tool details

---

### 4.3 Update Homepage

**Reference:** See NPM_MIRROR.md for stats display

- [ ] **Update stats in hero section**
  - Fetch from `/api/stats`
  - Show real tool count
  - Show category breakdown

- [ ] **Update live metrics**
  - Real download counts
  - Real tool counts
  - Update frequently (client-side polling or static)

**Verification:**
- Visit http://localhost:3001
- Stats should be real, not mock

---

## 📋 Phase 5: Testing & Polish (Week 4)

### 5.1 Create Test Packages

- [ ] **Publish 3-5 real NPM packages with `tpmjs` field**
  - At least one with minimal tier
  - At least one with rich tier
  - Use `tpmjs-tool` keyword for official listing

- [ ] **Verify automatic discovery**
  - Wait for next sync run
  - Check they appear in database
  - Check they appear on website

---

### 5.2 Documentation

- [ ] **Create docs section**
  - `apps/web/src/app/docs/page.tsx`
  - Getting started guide
  - Schema reference
  - Examples

- [ ] **Add validation playground**
  - `apps/web/src/app/docs/validate/page.tsx`
  - Form to test `tpmjs` field
  - Real-time validation feedback
  - Uses `/api/tools/validate`

---

### 5.3 CLI Tool (Optional)

- [ ] **Create `packages/cli`**
  - Command: `tpmjs validate`
  - Reads local `package.json`
  - Validates `tpmjs` field
  - Calls `/api/tools/validate`

---

### 5.4 Monitoring

- [ ] **Add health endpoint**
  - `apps/web/src/app/api/health/route.ts`
  - Check database connectivity
  - Check sync status (last run times)

- [ ] **Set up uptime monitoring**
  - Use UptimeRobot or Better Stack
  - Monitor `/api/health`
  - Alert if down or sync stale

- [ ] **Add error tracking**
  - Set up Sentry for Next.js
  - Track API errors
  - Track sync errors

**Verification:**
```bash
curl http://localhost:3001/api/health
# Should return { status: "ok", db: "ok", sync: { ... } }
```

---

## 📋 Phase 6: Launch (Week 5)

### 6.1 Pre-Launch Checklist

- [ ] **Database**
  - ✓ Prisma schema deployed
  - ✓ Indexes created
  - ✓ Backups enabled in Neon

- [ ] **Environment Variables**
  - ✓ All secrets in Vercel
  - ✓ `CRON_SECRET` set
  - ✓ `DATABASE_URL` set

- [ ] **API Routes**
  - ✓ All endpoints working
  - ✓ Rate limiting added (optional)
  - ✓ Error handling complete

- [ ] **Sync Workers**
  - ✓ Changes feed running every 2 min
  - ✓ Keyword search running every 15 min
  - ✓ Checkpoints updating correctly

- [ ] **Frontend**
  - ✓ All pages loading real data
  - ✓ Search working
  - ✓ Mobile responsive

- [ ] **Monitoring**
  - ✓ Health check endpoint live
  - ✓ Uptime monitoring active
  - ✓ Error tracking active

---

### 6.2 Launch Steps

- [ ] **Deploy to production**
  ```bash
  git push origin main
  # Vercel auto-deploys
  ```

- [ ] **Verify deployment**
  - Check all pages load
  - Check API endpoints work
  - Check cron jobs run

- [ ] **Publish announcement**
  - Tweet/post about TPMJS
  - Explain how to add `tpmjs` field
  - Share validation endpoint

- [ ] **Monitor for 24 hours**
  - Watch error logs
  - Check sync is working
  - Fix any issues

---

## 📋 Phase 7: Post-Launch (Ongoing)

### Enhancements

- [ ] **Semantic search**
  - Add embeddings to tools table
  - Use OpenAI/Cohere for semantic search

- [ ] **Usage analytics**
  - Track tool views
  - Track search queries
  - Popular tools widget

- [ ] **Tool recommendations**
  - "Similar tools" section
  - "You might also like"

- [ ] **GitHub Actions**
  - Validate `tpmjs` field in CI
  - Auto-comment validation results

- [ ] **NPM webhooks**
  - Listen for package updates
  - Immediate sync (instead of polling)

---

## 🎯 Success Criteria

Check these metrics after launch:

### Week 1
- [ ] 10+ official tools listed
- [ ] All sync jobs running successfully
- [ ] Zero API errors

### Month 1
- [ ] 50+ official tools
- [ ] 5+ package authors using TPMJS
- [ ] <200ms API response time (p95)

### Month 3
- [ ] 200+ tools
- [ ] 20+ package authors
- [ ] Community contributions

### Month 6
- [ ] 1000+ tools
- [ ] 50+ active package authors
- [ ] Established as go-to AI tool registry

---

## 🔄 Ongoing Maintenance

Weekly:
- [ ] Check sync logs for errors
- [ ] Review new tools for quality
- [ ] Update documentation

Monthly:
- [ ] Database optimization (indexes, vacuum)
- [ ] Review and adjust quality scoring
- [ ] Update NPM_MIRROR.md with learnings

---

## 📚 Key Documents

**Read frequently during implementation:**

1. **NPM_MIRROR.md** - Complete architecture reference
   - Database schema
   - API specifications
   - Validation rules
   - Quality scoring
   - All examples

2. **This checklist** - Implementation order and verification steps

3. **Plan file** - `.claude/plans/goofy-inventing-stearns.md` - Detailed planning notes

---

## 🚀 Ready to Build

This checklist is your complete implementation guide. Work through it phase by phase, checking off items as you go.

**Start with Phase 1, Step 1.1** and work sequentially. Each step has verification instructions to ensure it's working before moving on.

Good luck! 🎉
