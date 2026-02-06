---
name: tpmjs-tool-creator
description: Guide for creating official TPMJS tools using the blocks CLI. Use when a user wants to create a new tool for the TPMJS registry, add a tool to packages/tools/official/, implement an AI SDK v6 tool, define a block in blocks.yml, validate a tool with `pnpm blocks run`, or publish a tool to npm with the tpmjs keyword.
---

# TPMJS Tool Creator

Create production-ready tools for the TPMJS registry using the blocks CLI. Tools are npm packages following the AI SDK v6 pattern, validated by blocks, and automatically synced to tpmjs.com.

## Workflow

1. Define the tool block in `packages/tools/official/blocks.yml`
2. Create the tool package directory
3. Implement the tool using AI SDK v6 `tool()` + `jsonSchema()`
4. Validate with `pnpm blocks run <tool-name>`
5. Build and publish to npm

## Step 1: Define in blocks.yml

Add to the `blocks:` section of `packages/tools/official/blocks.yml`:

```yaml
blocks:
  category.toolName:
    type: utility
    description: "LLM-friendly description of what the tool does"
    path: "tool-directory-name"
    domain_rules:
      - id: rule_name
        description: "What this implementation must do"
    inputs:
      - name: inputName
        type: string
        description: "Description for LLMs"
      - name: optionalInput
        type: number
        optional: true
        description: "Optional parameter"
    outputs:
      - name: result
        type: ResultType
        description: "What the tool returns"
        measures: [working_implementation, valid_output_structure, proper_error_handling, ai_sdk_compliance]
```

**Category prefix** (before the dot): `research`, `web`, `data`, `documentation`, `engineering`, `security`, `statistics`, `ops`, `agent`, `sandbox`, `utilities`, `html`, `compliance`.

For domain entities and quality measures, see [references/domain.md](references/domain.md).

## Step 2: Create Package Directory

Create `packages/tools/official/<tool-name>/`:

```
<tool-name>/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── README.md
└── src/
    └── index.ts
```

**package.json:**
```json
{
  "name": "@tpmjs/official-<tool-name>",
  "version": "0.1.0",
  "description": "Short description",
  "type": "module",
  "keywords": ["tpmjs", "<category>", "ai"],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist .turbo"
  },
  "devDependencies": {
    "@tpmjs/tsconfig": "workspace:*",
    "tsup": "^8.5.1",
    "typescript": "^5.9.3"
  },
  "dependencies": {
    "ai": "6.0.49"
  },
  "publishConfig": { "access": "public" },
  "repository": {
    "type": "git",
    "url": "https://github.com/tpmjs/tpmjs.git",
    "directory": "packages/tools/official/<tool-name>"
  },
  "homepage": "https://tpmjs.com",
  "license": "MIT",
  "tpmjs": {
    "category": "<category>",
    "frameworks": ["vercel-ai"],
    "tools": [
      {
        "name": "toolName",
        "description": "Clear description (20+ chars)."
      }
    ]
  }
}
```

**tsconfig.json:**
```json
{
  "extends": "@tpmjs/tsconfig/react-library.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src" },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

**tsup.config.ts:**
```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'es2022',
});
```

## Step 3: Implement the Tool

Every tool follows this AI SDK v6 pattern in `src/index.ts`:

```typescript
import { jsonSchema, tool } from 'ai';

interface MyToolInput {
  param1: string;
  param2?: number;
}

export interface MyToolResult {
  data: string;
  metadata: { processedAt: string };
}

export const myTool = tool({
  description: 'Clear LLM-friendly description of what this tool does.',
  parameters: jsonSchema<MyToolInput>({
    type: 'object',
    properties: {
      param1: {
        type: 'string',
        description: 'What param1 is for',
      },
      param2: {
        type: 'number',
        description: 'Optional: what param2 is for',
      },
    },
    required: ['param1'],
    additionalProperties: false,
  }),
  execute: async (input): Promise<MyToolResult> => {
    if (!input.param1) {
      throw new Error('param1 is required and must be non-empty');
    }

    try {
      const result = await processData(input.param1);
      return {
        data: result,
        metadata: { processedAt: new Date().toISOString() },
      };
    } catch (error) {
      throw new Error(
        `Failed to process: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
});

export default myTool;
```

**Hard rules:**
- No stubs, TODOs, or placeholders — every tool must be fully working
- Single-shot: one call in, one structured result out
- Validate inputs before processing
- Try-catch with descriptive errors including context
- `additionalProperties: false` on jsonSchema
- Description on every schema property
- Export as both named and default export
- Output interface must be exported

### Multi-Tool Packages

For packages with multiple tools, add root-level files:

**block.ts:**
```typescript
import { toolA, toolB } from './src/index.js';
export const block = { name: 'package-name', tools: { toolA, toolB } };
export default block;
```

**index.ts (root):**
```typescript
export * from './src/index.js';
export { default } from './src/index.js';
```

Each tool gets its own entry in blocks.yml (same `path`) and in `tpmjs.tools` array.

## Step 4: Validate

```bash
cd packages/tools/official

pnpm blocks run <tool-name>            # Validate (schema → shape → domain)
pnpm blocks run <tool-name> --force    # Force full validation (skip cache)
pnpm blocks run <tool-name> --json     # JSON output for debugging
pnpm blocks run --all                  # Validate all tools
```

**Common errors:**
- `Tool "X" not found in exports` → Export name must match blocks.yml
- `Required file not found` → Check package root has all required files
- `invalid tpmjs field` → Category must be valid, tools array required

## Step 5: Build and Publish

```bash
pnpm --filter=@tpmjs/official-<tool-name> build
cd packages/tools/official/<tool-name> && npm publish --access public
```

The tool syncs to tpmjs.com automatically via the changes feed (every 2 min) and keyword search (every 15 min). To trigger immediately:

```bash
source apps/web/.env.local
curl -X POST https://tpmjs.com/api/sync/keyword \
  -H "Authorization: Bearer $CRON_SECRET"
```

## README Template

Every tool needs a README:

```markdown
# @tpmjs/official-<tool-name>

Short description.

## Installation

npm install @tpmjs/official-<tool-name>

## Usage

\`\`\`typescript
import { myTool } from '@tpmjs/official-<tool-name>';

const result = await myTool.execute({ param1: 'example' });
\`\`\`

## Parameters

| Name   | Type   | Required | Description        |
|--------|--------|----------|--------------------|
| param1 | string | Yes      | What param1 is for |

## Output

| Field | Type   | Description          |
|-------|--------|----------------------|
| data  | string | The processed result |

## License

MIT
```
