# 2025 Best Practices for TPMJS Monorepo

This document outlines recommendations to make TPMJS a cutting-edge 2025 monorepo optimized for both human and agentic development (Claude Code, Cursor, etc.).

## High-Impact Additions

### 1. Agent-First Documentation

```
packages/docs/
├── architecture-decisions/  # ADRs in markdown
├── patterns/               # Common patterns with examples
├── schemas/                # JSON schemas for all data structures
└── examples/               # Working code examples per feature
```

**Why:** Claude Code and other agents work better with:
- Explicit decision documentation (ADRs)
- Pattern libraries showing "the right way"
- Machine-readable schemas
- Real working examples to reference

### 2. Automated Testing Pyramid

```bash
# Add to package.json scripts
"test:unit": "vitest"           # ✅ Already have this
"test:integration": "vitest -c vitest.integration.config.ts"  # Add
"test:e2e": "playwright test"   # Add
"test:visual": "playwright test --grep @visual"  # Add
"test:contracts": "pactum"      # Add for API testing
```

**Packages to add:**
- `@playwright/test` - E2E testing
- `@playwright/experimental-ct-react` - Component testing
- `pactum` or `msw` integration tests (you have mocks setup)
- `chromatic` or `percy` - Visual regression

### 3. Type Coverage & Quality Gates

```json
// Add to root package.json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "type-coverage": "type-coverage --at-least 95",
    "find-deadcode": "knip",
    "check-architecture": "depcruiser --validate"
  }
}
```

**Add packages:**
- `type-coverage` - Ensure no implicit `any`
- `knip` - Find unused files/exports/dependencies
- `dependency-cruiser` - Enforce architecture rules
- `@total-typescript/ts-reset` - Better built-in types

### 4. Development Containers

```json
// .devcontainer/devcontainer.json
{
  "name": "TPMJS Dev",
  "dockerComposeFile": "docker-compose.yml",
  "service": "dev",
  "features": {
    "ghcr.io/devcontainers/features/node:1": {},
    "ghcr.io/devcontainers-contrib/features/pnpm:2": {}
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "biomejs.biome",
        "bradlc.vscode-tailwindcss",
        "lokalise.i18n-ally"
      ]
    }
  }
}
```

**Why:** Agents like Claude Code work better when environment is reproducible. This also helps human developers.

### 5. Code Generation & Scaffolding

```typescript
// packages/cli/ - Internal dev tool
import { scaffold } from '@tpmjs/cli';

// Commands:
pnpm gen:component ButtonGroup
pnpm gen:package @tpmjs/new-package
pnpm gen:app marketing-site
```

**Create:**
- `plop` or `hygen` templates
- Component scaffolding (with tests, stories, exports)
- Package scaffolding (with tsconfig, package.json, exports)
- Consistent file structure generation

**Why:** Agents can use these commands to create new code following your exact patterns.

### 6. Enhanced Strict Mode TypeScript

```json
// packages/tsconfig/base.json - Add these
{
  "compilerOptions": {
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noPropertyAccessFromIndexSignature": true,
    "allowUnusedLabels": false,
    "allowUnreachableCode": false,
    "noImplicitOverride": true
  }
}
```

### 7. Bundle Analysis & Performance

```json
{
  "scripts": {
    "analyze": "turbo run build --filter=@tpmjs/web -- --analyze",
    "lighthouse": "lhci autorun",
    "bundle-size": "size-limit"
  }
}
```

**Add:**
- `@next/bundle-analyzer`
- `@lhci/cli` - Lighthouse CI
- `size-limit` - Bundle size tracking in CI

### 8. Smart Dependency Management

```json
// .github/renovate.json
{
  "extends": ["config:base"],
  "packageRules": [
    {
      "matchPackagePatterns": ["*"],
      "matchUpdateTypes": ["minor", "patch"],
      "groupName": "all non-major dependencies",
      "groupSlug": "all-minor-patch"
    }
  ]
}
```

**Use:** Renovate or Dependabot with auto-merge for passing tests

### 9. API Documentation Generation

```bash
pnpm add -D -w typedoc typedoc-plugin-markdown
```

Auto-generate API docs from TSDoc comments that both humans and agents can read.

### 10. Schema-First Development

```typescript
// packages/schemas/ - Central schema definitions
export * from './tool-schema';
export * from './registry-api-schema';
export * from './event-schema';

// Use Zod for runtime + type generation
// Agents can read schemas to understand contracts
```

## Monorepo-Specific Improvements

### 11. Better Local Development

```typescript
// turbo.json
{
  "pipeline": {
    "dev": {
      "cache": false,
      "persistent": true,
      "dependsOn": ["^build"]
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    }
  }
}
```

### 12. Workspace Protocols & Constraints

```yaml
# .pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'

# Add constraints
pnpm-workspace-constraints:
  dependencies:
    '@tpmjs/ui': 'workspace:*'
    '@tpmjs/utils': 'workspace:*'
```

## Recommended Final Structure

```
.
├── .devcontainer/          # Dev containers config
├── .github/
│   ├── workflows/          # CI/CD
│   └── renovate.json       # Dependency automation
├── apps/
│   └── web/
├── packages/
│   ├── cli/               # ⭐ NEW: Dev tooling
│   ├── schemas/           # ⭐ NEW: Central schemas
│   └── ...existing
├── docs/
│   ├── adr/              # ⭐ NEW: Architecture decisions
│   ├── patterns/         # ⭐ NEW: Code patterns
│   └── examples/         # ⭐ NEW: Working examples
├── scripts/
│   ├── scaffold.ts       # ⭐ NEW: Code generation
│   └── validate-deps.ts  # ⭐ NEW: Architecture validation
├── playwright.config.ts   # ⭐ NEW: E2E testing
├── .lighthouserc.json    # ⭐ NEW: Performance
└── knip.json             # ⭐ NEW: Dead code detection
```

## Priority Order for Implementation

### Phase 1 (Foundation)
1. **Knip + type-coverage** - Catch issues early
2. **Code generation scripts** - Ensure consistency
3. **ADR documentation structure** - Decision tracking

### Phase 2 (Quality)
4. **E2E testing with Playwright** - Full user flow coverage
5. **Bundle analysis + performance budgets** - Keep app fast
6. **Stricter TypeScript settings** - Catch more bugs at compile time

### Phase 3 (DX)
7. **Dev containers** - Reproducible environments
8. **API documentation generation** - Auto-generated from code
9. **Renovate automation** - Keep dependencies fresh

## Benefits for Agent-Driven Development

1. **Explicit Patterns** - Agents can reference documented patterns instead of guessing
2. **Code Generation** - Consistent scaffolding commands agents can use
3. **Machine-Readable Schemas** - JSON schemas help agents understand data structures
4. **Quality Gates** - Automated checks catch agent mistakes early
5. **Working Examples** - Agents can copy-paste-adapt proven patterns
6. **Architecture Enforcement** - Dependency rules prevent agents from creating invalid imports

## Next Steps

Start with the highest ROI items:
1. Install Knip to find dead code
2. Set up code generation for components/packages
3. Create docs/patterns/ with common examples
4. Add stricter TypeScript compiler options
5. Set up Playwright for E2E testing

These changes will make the codebase more maintainable and significantly improve the experience of working with AI coding agents.
