# @tpmjs/registrySearch

## 0.1.3

### Patch Changes

- Update AI SDK dependency to v6.0.49

  - Upgraded `ai` package from 6.0.23 to 6.0.49 for compatibility improvements
  - All tools now use consistent AI SDK version across the monorepo

## 0.2.0

### Minor Changes

- Add @tpmjs/registrySearch and @tpmjs/registryExecute SDK packages

  These packages allow any AI SDK agent to dynamically discover and execute tools from the TPMJS registry:

  - `@tpmjs/registrySearch`: Search the registry for tools by query, category, etc.
  - `@tpmjs/registryExecute`: Execute any tool from the registry in a secure sandbox

  Features:

  - Works with AI SDK v4+ (Vercel AI SDK)
  - Self-hosted registry support via environment variables
  - Secure sandboxed execution via executor.tpmjs.com
