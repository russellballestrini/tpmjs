
## Monorepo Setup

This project uses a Turborepo monorepo architecture with the following structure:

### Packages

**Published to npm (@tpmjs scope):**
- `@tpmjs/ui` - React component library with .ts-only components
- `@tpmjs/utils` - Utility functions (cn, format, etc.)
- `@tpmjs/types` - Shared TypeScript types and Zod schemas
- `@tpmjs/env` - Environment variable validation with Zod

**Internal tooling (private):**
- `@tpmjs/config` - Shared configurations (Biome, ESLint, Tailwind, TypeScript)
- `@tpmjs/eslint-config` - ESLint configuration with module boundary rules
- `@tpmjs/tailwind-config` - Tailwind configuration with design tokens
- `@tpmjs/tsconfig` - TypeScript configurations (base, nextjs, react-library)
- `@tpmjs/test` - Vitest shared configuration
- `@tpmjs/mocks` - MSW mock server for testing
- `@tpmjs/storybook` - Component documentation and showcase

### Applications

- `@tpmjs/web` - Next.js 16 App Router application (main website)

### Architecture Principles



#### 2. No Barrel Exports

Components are imported directly without `index.ts` files:

```typescript
// Good
import { Button } from '@tpmjs/ui/Button/Button';

// Bad (not allowed)
import { Button } from '@tpmjs/ui';
```

**Benefits:**
- Clearer dependency graphs
- Better tree-shaking
- Prevents circular dependencies
- Explicit imports

#### 3. Module Boundaries

ESLint enforces strict module boundaries:
- Apps can only import from published packages
- Packages cannot import from apps
- UI package cannot import from utils (stays dependency-free)

#### 4. Shared Configurations

All configuration is centralized in `packages/config/`:
- **Biome** - Formatting + basic linting
- **ESLint** - Semantic rules and module boundaries
- **Tailwind** - Design tokens and shared theme
- **TypeScript** - Multiple configs for different contexts

### Development Workflow

```bash
# Install dependencies
pnpm install

# Run development servers
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint and format
pnpm lint
pnpm format
```

### Detailed Development Commands

This section documents the complete testing, building, and development workflow used in this monorepo.

#### Testing Individual Packages

Use the `--filter` flag to target specific packages:

```bash
# Type-check a single package
pnpm --filter=@tpmjs/npm-client type-check
pnpm --filter=@tpmjs/ui type-check
pnpm --filter=@tpmjs/web type-check

# Run tests in a single package
pnpm --filter=@tpmjs/ui test
pnpm --filter=@tpmjs/web test

# Lint a single package
pnpm --filter=@tpmjs/web lint
```

#### Testing All Packages

Commands from the root run across all packages via Turborepo:

```bash
# Type-check all packages (runs via Turborepo)
pnpm type-check

# Lint all packages (runs via Turborepo)
pnpm lint

# Format all files with Biome
pnpm format

# Test all packages (runs via Turborepo)
pnpm test
```

#### Building Packages

Build commands respect dependency order automatically:

```bash
# Build a single package (and its dependencies)
pnpm --filter=@tpmjs/ui build
pnpm --filter=@tpmjs/types build

# Build all packages
pnpm build

# Build and watch for changes
pnpm --filter=@tpmjs/ui dev
```

#### Database Commands (Prisma)

The `@tpmjs/db` package uses Prisma for database management:

```bash
# Generate Prisma client (required after schema changes)
pnpm --filter=@tpmjs/db db:generate

# Push schema changes to database (dev)
pnpm --filter=@tpmjs/db db:push

# Create and apply migrations (production)
pnpm --filter=@tpmjs/db db:migrate

# Open Prisma Studio (database GUI)
pnpm --filter=@tpmjs/db db:studio

# Seed the database
pnpm --filter=@tpmjs/db db:seed
```

**Important:** Always run `pnpm --filter=@tpmjs/db db:generate` after modifying `schema.prisma` to regenerate the Prisma client. Without this, TypeScript will show errors for database types.

#### Development Servers

```bash
# Run Next.js dev server for web app
pnpm dev --filter=@tpmjs/web

# Run all dev servers (if multiple apps)
pnpm dev

# Run Storybook for component development
pnpm --filter=@tpmjs/storybook dev
```

#### Pre-commit Hooks (Lefthook)

Git commits automatically trigger these checks via Lefthook:

1. **Format** - Biome formats all staged files
2. **Lint** - Runs `pnpm lint` across all packages
3. **Type-check** - Runs `pnpm type-check` across all packages

If any check fails, the commit is blocked. The hooks ensure code quality before changes reach CI.

**Note:** Pre-commit hooks run the same checks as CI, so if they pass locally, CI should pass too.

#### Turborepo Caching

Turborepo caches task outputs for faster rebuilds:

- **Cache hits**: Tasks show `cache hit, replaying logs` - no actual work done
- **Cache miss**: Tasks execute normally and outputs are cached
- **Invalidation**: Cache invalidates when inputs change (source files, dependencies, env vars)

```bash
# Clear Turborepo cache if needed
pnpm turbo clean

# Force rebuild without cache
pnpm build --force
```

#### Common Workflows

**After pulling new changes:**
```bash
pnpm install              # Install new dependencies
pnpm db:generate          # Regenerate Prisma client if schema changed
pnpm type-check           # Verify everything type-checks
pnpm dev --filter=@tpmjs/web  # Start dev server
```

**Creating a new package:**
```bash
# 1. Create package directory and files
mkdir -p packages/my-package/src
cd packages/my-package

# 2. Create package.json with proper name and workspace dependencies
# 3. Create tsconfig.json extending @tpmjs/tsconfig

# 4. Install dependencies from root
cd ../..
pnpm install

# 5. Type-check the new package
pnpm --filter=@tpmjs/my-package type-check
```

**Testing before committing:**
```bash
# Run the same checks that pre-commit hooks will run
pnpm format               # Format all files
pnpm lint                 # Lint all packages
pnpm type-check           # Type-check all packages

# Then commit - hooks should pass quickly
git add .
git commit -m "your message"
```

#### Troubleshooting

**"Cannot find module '@prisma/client'"**
- Run `pnpm --filter=@tpmjs/db db:generate` to generate the Prisma client
- The Prisma client must be generated after any schema changes or fresh installs

**"Type error in package that imports from another package"**
- Build the dependency first: `pnpm --filter=@tpmjs/types build`
- Or build all packages: `pnpm build`
- Turborepo handles this automatically when using `pnpm build`

**"Biome formatting errors in pre-commit"**
- Run `pnpm format` to auto-fix formatting issues
- Biome will format all files according to the config

**"ESLint warnings about module boundaries"**
- Check that you're not importing from apps in packages
- Check that imports follow the no-barrel-exports rule
- Example: Use `@tpmjs/ui/Button/Button` not `@tpmjs/ui`

**"Turborepo cache shows stale outputs"**
- Clear cache with `pnpm turbo clean`
- Force rebuild with `pnpm build --force`

**"Dev server won't start"**
- Check that all dependencies are installed: `pnpm install`
- Check that Prisma client is generated: `pnpm db:generate`
- Check for port conflicts (Next.js default: 3000)

### Publishing Flow

1. Make changes to packages
2. Create changeset: `pnpm changeset`
3. Version packages: `pnpm changeset:version`
4. Publish to npm: `pnpm changeset:publish`
5. Push with tags: `git push --follow-tags`

### Tech Stack

- **Build System:** Turborepo
- **Package Manager:** pnpm
- **TypeScript:** Strict mode, composite projects
- **React:** v19 
- **Next.js:** v16 App Router
- **Styling:** Tailwind CSS
- **Testing:** Vitest + Testing Library
- **Linting:** Biome + ESLint
- **Documentation:** Storybook
- **CI/CD:** GitHub Actions + Changesets
- **Git Hooks:** Lefthook

### Debugging CI/CD with CLI Tools

When debugging CI failures or deployment issues, use command-line tools for efficient investigation:

#### GitHub CLI (`gh`)

Debug GitHub Actions CI runs:

```bash
# List recent workflow runs
gh run list --limit 10

# View specific run details
gh run view <run-id>

# View failed job logs
gh run view <run-id> --log-failed

# View specific job logs
gh run view <run-id> --job <job-id> --log

# Rerun failed jobs
gh run rerun <run-id> --failed
```

**Common debugging workflow:**
1. `gh run list` - Find the failed run ID
2. `gh run view <run-id> --log-failed` - See what failed
3. Fix the issue locally
4. Push and monitor: `gh run watch`

#### Vercel CLI

Debug deployments and preview environments:

```bash
# List deployments
vercel ls

# View deployment details
vercel inspect <deployment-url>

# View deployment logs
vercel logs <deployment-url>

# Pull environment variables
vercel env pull

# Link local project to Vercel project
vercel link
```

**Common debugging workflow:**
1. `vercel ls` - Find the deployment URL
2. `vercel inspect <url>` - Check deployment status and build logs
3. `vercel logs <url>` - View runtime logs
4. Compare env vars: `vercel env pull` and check `.env.local`

#### Tips

- Use `gh` and `vercel` CLIs to debug without leaving the terminal
- Check CI logs before making blind fixes
- Vercel deployments are blocked until GitHub Actions pass (configured in vercel.json)
- Pre-commit/pre-push hooks run the same checks as CI - if they pass locally, CI should pass too

---

## Case Study: Fixing API Route Timeouts on tpmjs.com

This is a detailed account of debugging and fixing API route timeouts in production. The investigation revealed critical insights about deploying Turborepo monorepos to Vercel with Prisma.

### The Problem

After deploying tpmjs.com to production, all API endpoints were timing out:

```bash
$ curl https://tpmjs.com/api/health
# Request timed out after 60 seconds

$ curl https://tpmjs.com/api/tools
# Request timed out after 60 seconds
```

The Next.js UI worked perfectly - pages loaded, navigation functioned - but every API route request resulted in a timeout. No errors appeared in Vercel logs, and the requests never even reached the serverless functions.

### Initial Investigation

**Step 1: Verify Build Output**

```bash
vercel inspect <deployment-url>
```

The build showed pages but **no API routes** listed as lambda functions:

```
Builds
  ├── ○ / (static page)
  ├── ○ /playground (static page)
  └── ○ /tool/[slug] (static page)

# Expected to see:
  ├── λ api/health
  ├── λ api/tools
  └── λ api/sync/changes
```

This confirmed Vercel wasn't treating the project as Next.js - it was using static site generation and dropping all API routes.

**Step 2: Check Vercel Configuration**

Examined `apps/web/vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "cd ../.. && turbo build --filter=@tpmjs/web",
  "installCommand": "pnpm install"
}
```

The build command looked correct, but the custom build command was bypassing Vercel's Next.js detection.

### Root Cause #1: Workspace Dependencies Not Built

Deployed the site and checked the build logs. Found this critical error:

```
Module not found: Can't resolve '@tpmjs/env'
Module not found: Can't resolve '@tpmjs/types/tpmjs'
Module not found: Can't resolve '@tpmjs/ui/Badge/Badge'
Package @prisma/client can't be external
```

**49 module resolution errors** - the workspace packages weren't being built before the web app tried to import them.

**The Fix:**

Changed the build command from:
```json
"buildCommand": "cd ../.. && turbo build --filter=@tpmjs/web"
```

To:
```json
"buildCommand": "cd ../.. && pnpm install && pnpm --filter=@tpmjs/web... build"
```

The `...` suffix in `--filter=@tpmjs/web...` tells pnpm to build ALL dependencies first:

1. Build `@tpmjs/env`
2. Build `@tpmjs/types`
3. Build `@tpmjs/ui`
4. Build `@tpmjs/utils`
5. Build `@tpmjs/db` (Prisma generate)
6. Finally build `@tpmjs/web`

After this change, the build succeeded and API routes appeared as lambda functions in `vercel inspect`.

### Root Cause #2: Prisma Cold Start Performance

With the build fixed, API routes were deployed but still timing out. Testing revealed:

```bash
# Health endpoint (no database) - WORKS
$ curl https://tpmjs.com/api/health
{"status":"ok","timestamp":"2025-11-28T11:32:29.295Z"}

# Tools endpoint (with database) - TIMEOUT
$ curl https://tpmjs.com/api/tools
# ...60 second timeout
```

**Local Database Performance Test:**

```javascript
// Test the exact queries used in production
const count = await prisma.tool.count();        // 3.244s ⚠️
const tools = await prisma.tool.findMany({
  orderBy: [
    { qualityScore: 'desc' },
    { npmDownloadsLastMonth: 'desc' },
    { createdAt: 'desc' },
  ],
  take: 20,
});                                             // 593ms ⚠️
```

The parallel `count()` + `findMany()` queries were taking **3.8 seconds** due to Prisma cold start in serverless environments.

**The Fix:**

Optimized the endpoint in two ways:

1. **Removed expensive count query** - Using `count()` in every request is slow and usually unnecessary:

```typescript
// Before: Slow parallel queries
const [tools, totalCount] = await Promise.all([
  prisma.tool.findMany({ where, take: limit, skip: offset }),
  prisma.tool.count({ where }),  // ← 3+ seconds!
]);

// After: Fast single query with limit+1 technique
const tools = await prisma.tool.findMany({
  where,
  take: limit + 1,  // Fetch one extra to check if more exist
  skip: offset,
});

const hasMore = tools.length > limit;
const actualTools = hasMore ? tools.slice(0, limit) : tools;
```

2. **Reduced max page size** from 100 to 50 items for better performance

**Results:**

```bash
$ curl https://tpmjs.com/api/tools
{
  "success": true,
  "data": [...],  # Returns in <1 second
  "pagination": {
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

### Additional Optimizations Applied

**Added maxDuration to all API routes:**

```typescript
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;  // ← Prevent premature timeouts
```

**Verified database indexes exist:**

```prisma
model Tool {
  // ... fields ...

  @@index([category])
  @@index([isOfficial])
  @@index([qualityScore])
  @@index([npmDownloadsLastMonth])
  @@index([createdAt])
}
```

All necessary indexes were present - the issue was cold start latency, not missing indexes.

### Key Lessons Learned

**1. Monorepo Build Order Matters**

When deploying Turborepo monorepos to Vercel, workspace dependencies MUST be built first:

```bash
# ❌ Wrong - only builds the web app
pnpm --filter=@tpmjs/web build

# ✅ Correct - builds dependencies first
pnpm --filter=@tpmjs/web... build
```

**2. Prisma in Serverless = Slow First Request**

Prisma Client initialization in serverless environments adds 1-3 seconds of latency on cold starts. Strategies to mitigate:

- Use connection pooling (Neon, PlanetScale)
- Eliminate unnecessary queries (especially `count()`)
- Cache query results when possible
- Consider Prisma Accelerate for critical paths

**3. Progressive Debugging Approach**

Start simple and progressively add complexity:

```typescript
// Step 1: Does endpoint respond at all?
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}

// Step 2: Can we connect to database?
export async function GET() {
  return NextResponse.json({
    hasDatabase: !!process.env.DATABASE_URL,
  });
}

// Step 3: Can we query the database?
export async function GET() {
  const count = await prisma.tool.count();
  return NextResponse.json({ count });
}

// Step 4: Full implementation with optimizations
```

**4. Use Vercel CLI for Debugging**

```bash
# Check what's actually deployed
vercel inspect <deployment-url>

# Look for lambda functions (λ)
Builds
  ├── λ api/health ✅
  ├── λ api/tools ✅

# If you see only static pages (○), API routes aren't deployed
```

### Final Configuration

**`apps/web/vercel.json`:**
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "cd ../.. && pnpm install && pnpm --filter=@tpmjs/web... build",
  "installCommand": "pnpm install"
}
```

**API Route Template:**
```typescript
import { prisma } from '@tpmjs/db';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  try {
    // Avoid count() - use limit+1 technique instead
    const items = await prisma.tool.findMany({
      orderBy: { qualityScore: 'desc' },
      take: 21,  // Request 1 more than needed
    });

    const hasMore = items.length > 20;
    const data = hasMore ? items.slice(0, 20) : items;

    return NextResponse.json({
      success: true,
      data,
      pagination: { hasMore },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

### Performance Metrics

**Before Optimization:**
- `/api/health`: Timeout (60s+)
- `/api/tools`: Timeout (60s+)
- Build: Failed (module resolution errors)

**After Optimization:**
- `/api/health`: ~50ms ✅
- `/api/tools`: ~800ms ✅
- Build: Success (all deps built) ✅

### Conclusion

API timeouts in serverless environments often stem from build configuration issues or database cold starts. For Turborepo + Vercel + Prisma:

1. Use `pnpm --filter=package...` to build dependencies
2. Avoid `count()` queries in hot paths
3. Add `maxDuration` to API routes
4. Use `vercel inspect` to verify lambda deployment
5. Test database performance locally before deploying

The full working implementation is live at [tpmjs.com](https://tpmjs.com).