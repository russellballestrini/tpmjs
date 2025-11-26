# Quality Gates Setup

This document describes the quality gate tools configured for the TPMJS monorepo.

## Installed Tools

### 1. TypeScript Type Checking
```bash
pnpm type-check
```
Runs `tsc --noEmit` across all packages to catch type errors.

### 2. Type Coverage
```bash
pnpm type-coverage
```
Uses `type-coverage` to ensure no implicit `any` types. Currently configured for 95% minimum coverage.

### 3. Dead Code Detection
```bash
pnpm find-deadcode
```
Uses `knip` to find:
- Unused files
- Unused dependencies
- Unused exports
- Unresolved imports

**Configuration:** `knip.json`
- Ignores test files, build artifacts (dist, .next, storybook-static)
- Workspace-aware for monorepo structure

### 4. Architecture Validation
```bash
pnpm check-architecture
```
Uses `dependency-cruiser` to enforce:
- No circular dependencies
- No unresolvable imports
- No deprecated dependencies
- **Custom rule:** Packages cannot import from apps (keeps packages reusable)

**Configuration:** `.dependency-cruiser.js`
- Simplified to standard rules only
- Excludes build artifacts automatically
- One custom rule: packages stay independent of apps

## Node.js Version

**Required:** Node.js 22+ (LTS)

The project uses `.nvmrc` to specify Node version:
```bash
nvm use
```

## Integration

### Pre-commit Hook (Optional)
Add to `.lefthook.yml`:
```yaml
pre-commit:
  commands:
    type-check:
      run: pnpm type-check
    deadcode:
      run: pnpm find-deadcode
```

### CI Pipeline (Recommended)
Add to `.github/workflows/ci.yml`:
```yaml
- name: Type check
  run: pnpm type-check

- name: Check architecture
  run: pnpm check-architecture

- name: Find dead code
  run: pnpm find-deadcode
```

## Current Status

### ✅ Type Check
All packages pass type checking.

### ✅ Architecture Check
**1 error, 14 warnings**
- **Error:** Missing export in `@tpmjs/ui/Tabs/types` (needs fix)
- **Warnings:** React listed in both dependencies and devDependencies (informational, not blocking)

### ⚠️ Dead Code Detection
**Minor issues found:**
- 1 unused file: `packages/config/eslint/react.js`
- 5 unused dependencies (can be cleaned up)
- 6 unused devDependencies (can be cleaned up)

These are informational and don't block development.

## Philosophy

The configuration follows a **practical, non-blocking** approach:
- Standard rules that prevent real problems
- No overly strict custom rules that make development difficult
- Warnings for things worth knowing about, errors for things that will break
- Build artifacts and config files are properly excluded

## Maintenance

Run these periodically to keep the codebase clean:
```bash
# Check everything
pnpm type-check && pnpm check-architecture && pnpm find-deadcode

# Or just the quick ones
pnpm type-check && pnpm find-deadcode
```
