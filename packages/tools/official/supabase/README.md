# @tpmjs/tools-supabase

Supabase REST API tools for AI agents. Query, insert, update, delete rows, call RPC functions, and more using the PostgREST API.

## Installation

```bash
npm install @tpmjs/tools-supabase
```

## Setup

Set these environment variables:

```bash
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

The service role key bypasses Row Level Security (RLS) and grants full database access to AI agents.

## Usage

```typescript
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { queryRows, insertRows } from '@tpmjs/tools-supabase';

const result = await generateText({
  model: openai('gpt-4o'),
  prompt: 'Get the first 5 users from the database',
  tools: { queryRows, insertRows },
});
```

### Query Rows

```typescript
import { queryRows } from '@tpmjs/tools-supabase';

// Query with filtering and ordering
await queryRows.execute({
  table: 'users',
  select: 'id,name,email',
  filter: 'age=gte.18&status=eq.active',
  order: 'created_at.desc',
  limit: 10,
});
```

### Insert Rows

```typescript
import { insertRows } from '@tpmjs/tools-supabase';

// Insert a single row
await insertRows.execute({
  table: 'users',
  rows: [{ name: 'Alice', email: 'alice@example.com' }],
});

// Bulk insert
await insertRows.execute({
  table: 'users',
  rows: [
    { name: 'Bob', email: 'bob@example.com' },
    { name: 'Carol', email: 'carol@example.com' },
  ],
});
```

## Available Tools

| Tool | Description |
|------|-------------|
| `queryRows` | Query rows from a table with filtering, ordering, and pagination |
| `getRowById` | Get a single row by its primary key value |
| `insertRows` | Insert one or more rows into a table |
| `updateRows` | Update rows matching a filter condition |
| `deleteRows` | Delete rows matching a filter condition |
| `upsertRows` | Insert or update rows using merge-duplicates strategy |
| `callRpc` | Call a PostgreSQL function (RPC) with parameters |
| `countRows` | Count rows in a table with optional filtering |
| `listTables` | List all available tables in the database |
| `searchRows` | Search rows using case-insensitive pattern matching |

## PostgREST Filter Syntax

Supabase uses PostgREST filter syntax for queries:

- **Equality:** `status=eq.active`
- **Greater than:** `age=gt.18`
- **Greater than or equal:** `age=gte.18`
- **Less than:** `price=lt.100`
- **Pattern matching:** `name=like.*smith*`
- **Case-insensitive:** `email=ilike.*@gmail.com`
- **Multiple filters:** `age=gte.18&status=eq.active` (AND)

See [PostgREST documentation](https://postgrest.org/en/stable/references/api/tables_views.html#horizontal-filtering-rows) for more operators.

## Safety Features

**Important:** The `updateRows` and `deleteRows` tools require a non-empty filter to prevent accidental full-table operations. This is a safety requirement to protect your data.

```typescript
// ❌ This will throw an error
await deleteRows.execute({ table: 'users', filter: '' });

// ✅ This is safe
await deleteRows.execute({ table: 'users', filter: 'id=eq.123' });
```

## License

MIT
