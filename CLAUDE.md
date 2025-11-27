
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
