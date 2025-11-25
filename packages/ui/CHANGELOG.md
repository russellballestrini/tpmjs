# @tpmjs/ui

## 0.1.3

### Patch Changes

- refactor(ui): convert all components from createElement to JSX syntax

  All UI components now use JSX instead of createElement for better readability and maintainability.

## 0.1.2

### Patch Changes

- Fix test setup by adding @testing-library/jest-dom matchers for proper DOM assertions in Vitest

## 0.1.1

### Patch Changes

- Initial release of TPMJS packages

  - @tpmjs/ui: React component library with .ts-only components (Button, Card)
  - @tpmjs/utils: Utility functions (cn for Tailwind class merging, format functions)
  - @tpmjs/types: TypeScript types and Zod schemas for tools and registry
  - @tpmjs/env: Environment variable validation with Zod

  All packages follow strict TypeScript practices and use ESM format.

- Updated dependencies
  - @tpmjs/utils@0.1.1
