/**
 * @tpmjs/tools-supabase — Supabase REST API Tools for AI Agents
 *
 * Complete database management for AI agents: query, insert, update, delete rows,
 * call RPC functions, count records, and more using the PostgREST API.
 *
 * @requires SUPABASE_URL environment variable
 * @requires SUPABASE_SERVICE_ROLE_KEY environment variable
 */

import { jsonSchema, tool } from 'ai';

// ─── Client Infrastructure ──────────────────────────────────────────────────

interface SupabaseConfig {
  url: string;
  key: string;
}

function getConfig(): SupabaseConfig {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      'SUPABASE_URL environment variable is required. Get it from your Supabase project settings.'
    );
  }

  if (!key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY environment variable is required. Get it from your Supabase project settings.'
    );
  }

  return { url, key };
}

interface ApiRequestOptions {
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string>;
}

async function apiRequest<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'HEAD',
  path: string,
  options?: ApiRequestOptions
): Promise<T> {
  const config = getConfig();

  const headers: Record<string, string> = {
    apikey: config.key,
    Authorization: `Bearer ${config.key}`,
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  const url = new URL(`${config.url}${path}`);
  if (options?.params) {
    for (const [key, value] of Object.entries(options.params)) {
      url.searchParams.append(key, value);
    }
  }

  const requestOptions: RequestInit = {
    method,
    headers,
  };

  if (options?.body !== undefined) {
    requestOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(url.toString(), requestOptions);

  // Handle HEAD requests (used for counting)
  if (method === 'HEAD') {
    if (!response.ok) {
      throw new Error(`Supabase HTTP error ${response.status}: ${response.statusText}`);
    }
    // Return headers for HEAD requests
    return { headers: Object.fromEntries(response.headers.entries()) } as T;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Supabase HTTP error ${response.status}: ${response.statusText}${errorText ? ` - ${errorText}` : ''}`
    );
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return {} as T;
  }

  return (await response.json()) as T;
}

// ─── Output Types ────────────────────────────────────────────────────────────

export interface QueryResult {
  rows: Record<string, unknown>[];
  count: number;
}

export interface RowResult {
  row: Record<string, unknown> | null;
}

export interface InsertResult {
  rows: Record<string, unknown>[];
  count: number;
}

export interface UpdateResult {
  rows: Record<string, unknown>[];
  count: number;
}

export interface DeleteResult {
  rows: Record<string, unknown>[];
  count: number;
}

export interface UpsertResult {
  rows: Record<string, unknown>[];
  count: number;
}

export interface RpcResult {
  data: unknown;
}

export interface CountResult {
  count: number;
  table: string;
}

export interface ListTablesResult {
  tables: string[];
}

export interface SearchResult {
  rows: Record<string, unknown>[];
  count: number;
}

// ─── Query Rows ──────────────────────────────────────────────────────────────

export interface QueryRowsInput {
  table: string;
  select?: string;
  filter?: string;
  order?: string;
  limit?: number;
  offset?: number;
}

export const queryRows = tool({
  description:
    'Query rows from a Supabase table with filtering, ordering, and pagination using PostgREST syntax.',
  inputSchema: jsonSchema<QueryRowsInput>({
    type: 'object',
    properties: {
      table: {
        type: 'string',
        description: 'The table name to query.',
      },
      select: {
        type: 'string',
        description: 'Columns to select (default: "*"). Example: "id,name,email".',
      },
      filter: {
        type: 'string',
        description: 'PostgREST filter string. Example: "age=gte.18&status=eq.active".',
      },
      order: {
        type: 'string',
        description: 'Order by column(s). Example: "created_at.desc" or "name.asc".',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of rows to return (1-1000, default: 100).',
      },
      offset: {
        type: 'number',
        description: 'Number of rows to skip for pagination (default: 0).',
      },
    },
    required: ['table'],
    additionalProperties: false,
  }),
  async execute(input: QueryRowsInput): Promise<QueryResult> {
    try {
      if (!input.table || input.table.trim() === '') {
        throw new Error('table is required and must be non-empty');
      }

      if (input.limit !== undefined && (input.limit < 1 || input.limit > 1000)) {
        throw new Error('limit must be between 1 and 1000');
      }

      if (input.offset !== undefined && input.offset < 0) {
        throw new Error('offset must be non-negative');
      }

      const params = new URLSearchParams();
      params.append('select', input.select || '*');

      if (input.filter) {
        // Parse filter and add as individual params
        const filterParts = input.filter.split('&');
        for (const part of filterParts) {
          const [key, value] = part.split('=');
          if (key && value) {
            params.append(key, value);
          }
        }
      }

      if (input.order) {
        params.append('order', input.order);
      }

      if (input.limit !== undefined) {
        params.append('limit', String(input.limit));
      }

      if (input.offset !== undefined) {
        params.append('offset', String(input.offset));
      }

      const path = `/rest/v1/${encodeURIComponent(input.table)}?${params.toString()}`;
      const rows = await apiRequest<Record<string, unknown>[]>('GET', path);

      return {
        rows: rows || [],
        count: (rows || []).length,
      };
    } catch (error) {
      throw new Error(`Failed to query rows: ${(error as Error).message}`);
    }
  },
});

// ─── Get Row By ID ───────────────────────────────────────────────────────────

export interface GetRowByIdInput {
  table: string;
  column?: string;
  value: string;
  select?: string;
}

export const getRowById = tool({
  description: 'Get a single row from a Supabase table by its primary key value.',
  inputSchema: jsonSchema<GetRowByIdInput>({
    type: 'object',
    properties: {
      table: {
        type: 'string',
        description: 'The table name to query.',
      },
      column: {
        type: 'string',
        description: 'Primary key column name (default: "id").',
      },
      value: {
        type: 'string',
        description: 'The ID value to search for.',
      },
      select: {
        type: 'string',
        description: 'Columns to select (default: "*").',
      },
    },
    required: ['table', 'value'],
    additionalProperties: false,
  }),
  async execute(input: GetRowByIdInput): Promise<RowResult> {
    try {
      if (!input.table || input.table.trim() === '') {
        throw new Error('table is required and must be non-empty');
      }

      if (!input.value || input.value.trim() === '') {
        throw new Error('value is required and must be non-empty');
      }

      const column = input.column || 'id';
      const select = input.select || '*';

      const params = new URLSearchParams();
      params.append('select', select);
      params.append(column, `eq.${input.value}`);
      params.append('limit', '1');

      const path = `/rest/v1/${encodeURIComponent(input.table)}?${params.toString()}`;
      const rows = await apiRequest<Record<string, unknown>[]>('GET', path);

      return {
        row: rows && rows.length > 0 ? rows[0] || null : null,
      };
    } catch (error) {
      throw new Error(`Failed to get row by ID: ${(error as Error).message}`);
    }
  },
});

// ─── Insert Rows ─────────────────────────────────────────────────────────────

export interface InsertRowsInput {
  table: string;
  rows: Record<string, unknown>[];
  on_conflict?: string;
  returning?: string;
}

export const insertRows = tool({
  description: 'Insert one or more rows into a Supabase table and return the inserted data.',
  inputSchema: jsonSchema<InsertRowsInput>({
    type: 'object',
    properties: {
      table: {
        type: 'string',
        description: 'The table name to insert into.',
      },
      rows: {
        type: 'array',
        items: { type: 'object' },
        description: 'Array of row objects to insert (single or bulk).',
      },
      on_conflict: {
        type: 'string',
        description: 'Column name(s) for upsert conflict resolution.',
      },
      returning: {
        type: 'string',
        description: 'Columns to return (default: "*").',
      },
    },
    required: ['table', 'rows'],
    additionalProperties: false,
  }),
  async execute(input: InsertRowsInput): Promise<InsertResult> {
    try {
      if (!input.table || input.table.trim() === '') {
        throw new Error('table is required and must be non-empty');
      }

      if (!Array.isArray(input.rows) || input.rows.length === 0) {
        throw new Error('rows must be a non-empty array');
      }

      const params = new URLSearchParams();
      if (input.returning) {
        params.append('select', input.returning);
      }

      if (input.on_conflict) {
        params.append('on_conflict', input.on_conflict);
      }

      const queryString = params.toString();
      const path = queryString
        ? `/rest/v1/${encodeURIComponent(input.table)}?${queryString}`
        : `/rest/v1/${encodeURIComponent(input.table)}`;

      const rows = await apiRequest<Record<string, unknown>[]>('POST', path, {
        body: input.rows,
        headers: {
          Prefer: 'return=representation',
        },
      });

      return {
        rows: rows || [],
        count: (rows || []).length,
      };
    } catch (error) {
      throw new Error(`Failed to insert rows: ${(error as Error).message}`);
    }
  },
});

// ─── Update Rows ─────────────────────────────────────────────────────────────

export interface UpdateRowsInput {
  table: string;
  filter: string;
  data: Record<string, unknown>;
  returning?: string;
}

export const updateRows = tool({
  description:
    'Update rows in a Supabase table matching a filter condition. SAFETY: Filter is required to prevent full-table updates.',
  inputSchema: jsonSchema<UpdateRowsInput>({
    type: 'object',
    properties: {
      table: {
        type: 'string',
        description: 'The table name to update.',
      },
      filter: {
        type: 'string',
        description: 'PostgREST filter string (REQUIRED, must be non-empty). Example: "id=eq.123".',
      },
      data: {
        type: 'object',
        description: 'Object containing fields to update.',
      },
      returning: {
        type: 'string',
        description: 'Columns to return (default: "*").',
      },
    },
    required: ['table', 'filter', 'data'],
    additionalProperties: false,
  }),
  async execute(input: UpdateRowsInput): Promise<UpdateResult> {
    try {
      if (!input.table || input.table.trim() === '') {
        throw new Error('table is required and must be non-empty');
      }

      if (!input.filter || input.filter.trim() === '') {
        throw new Error(
          'filter is required and must be non-empty to prevent accidental full-table updates. Use a specific filter like "id=eq.123".'
        );
      }

      if (!input.data || typeof input.data !== 'object') {
        throw new Error('data is required and must be an object');
      }

      const params = new URLSearchParams();
      if (input.returning) {
        params.append('select', input.returning);
      }

      // Parse filter and add as individual params
      const filterParts = input.filter.split('&');
      for (const part of filterParts) {
        const [key, value] = part.split('=');
        if (key && value) {
          params.append(key, value);
        }
      }

      const path = `/rest/v1/${encodeURIComponent(input.table)}?${params.toString()}`;

      const rows = await apiRequest<Record<string, unknown>[]>('PATCH', path, {
        body: input.data,
        headers: {
          Prefer: 'return=representation',
        },
      });

      return {
        rows: rows || [],
        count: (rows || []).length,
      };
    } catch (error) {
      throw new Error(`Failed to update rows: ${(error as Error).message}`);
    }
  },
});

// ─── Delete Rows ─────────────────────────────────────────────────────────────

export interface DeleteRowsInput {
  table: string;
  filter: string;
  returning?: string;
}

export const deleteRows = tool({
  description:
    'Delete rows from a Supabase table matching a filter condition. SAFETY: Filter is required to prevent full-table deletion.',
  inputSchema: jsonSchema<DeleteRowsInput>({
    type: 'object',
    properties: {
      table: {
        type: 'string',
        description: 'The table name to delete from.',
      },
      filter: {
        type: 'string',
        description: 'PostgREST filter string (REQUIRED, must be non-empty). Example: "id=eq.123".',
      },
      returning: {
        type: 'string',
        description: 'Columns to return from deleted rows (default: "*").',
      },
    },
    required: ['table', 'filter'],
    additionalProperties: false,
  }),
  async execute(input: DeleteRowsInput): Promise<DeleteResult> {
    try {
      if (!input.table || input.table.trim() === '') {
        throw new Error('table is required and must be non-empty');
      }

      if (!input.filter || input.filter.trim() === '') {
        throw new Error(
          'filter is required and must be non-empty to prevent accidental full-table deletion. Use a specific filter like "id=eq.123".'
        );
      }

      const params = new URLSearchParams();
      if (input.returning) {
        params.append('select', input.returning);
      }

      // Parse filter and add as individual params
      const filterParts = input.filter.split('&');
      for (const part of filterParts) {
        const [key, value] = part.split('=');
        if (key && value) {
          params.append(key, value);
        }
      }

      const path = `/rest/v1/${encodeURIComponent(input.table)}?${params.toString()}`;

      const rows = await apiRequest<Record<string, unknown>[]>('DELETE', path, {
        headers: {
          Prefer: 'return=representation',
        },
      });

      return {
        rows: rows || [],
        count: (rows || []).length,
      };
    } catch (error) {
      throw new Error(`Failed to delete rows: ${(error as Error).message}`);
    }
  },
});

// ─── Upsert Rows ─────────────────────────────────────────────────────────────

export interface UpsertRowsInput {
  table: string;
  rows: Record<string, unknown>[];
  on_conflict?: string;
  returning?: string;
}

export const upsertRows = tool({
  description:
    'Insert or update rows in a Supabase table using merge-duplicates strategy for conflict resolution.',
  inputSchema: jsonSchema<UpsertRowsInput>({
    type: 'object',
    properties: {
      table: {
        type: 'string',
        description: 'The table name to upsert into.',
      },
      rows: {
        type: 'array',
        items: { type: 'object' },
        description: 'Array of row objects to upsert.',
      },
      on_conflict: {
        type: 'string',
        description: 'Column name(s) for conflict resolution.',
      },
      returning: {
        type: 'string',
        description: 'Columns to return (default: "*").',
      },
    },
    required: ['table', 'rows'],
    additionalProperties: false,
  }),
  async execute(input: UpsertRowsInput): Promise<UpsertResult> {
    if (!input.table || input.table.trim() === '') {
      throw new Error('table is required and must be non-empty');
    }

    if (!Array.isArray(input.rows) || input.rows.length === 0) {
      throw new Error('rows must be a non-empty array');
    }

    // Validate each row is a non-null object with at least one field
    for (let i = 0; i < input.rows.length; i++) {
      const row = input.rows[i];
      if (!row || typeof row !== 'object' || Array.isArray(row)) {
        throw new Error(`rows[${i}] must be a non-null object with column-value pairs`);
      }
      if (Object.keys(row).length === 0) {
        throw new Error(`rows[${i}] must have at least one column-value pair`);
      }
    }

    try {
      const params = new URLSearchParams();
      if (input.returning) {
        params.append('select', input.returning);
      }

      if (input.on_conflict) {
        params.append('on_conflict', input.on_conflict);
      }

      const queryString = params.toString();
      const path = queryString
        ? `/rest/v1/${encodeURIComponent(input.table)}?${queryString}`
        : `/rest/v1/${encodeURIComponent(input.table)}`;

      const rows = await apiRequest<Record<string, unknown>[]>('POST', path, {
        body: input.rows,
        headers: {
          Prefer: 'return=representation,resolution=merge-duplicates',
        },
      });

      return {
        rows: rows || [],
        count: (rows || []).length,
      };
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('rows')) {
        throw error;
      }
      throw new Error(`Failed to upsert rows in "${input.table}": ${(error as Error).message}`);
    }
  },
});

// ─── Call RPC ────────────────────────────────────────────────────────────────

export interface CallRpcInput {
  function_name: string;
  params?: Record<string, unknown>;
}

export const callRpc = tool({
  description: 'Call a Supabase PostgreSQL function (RPC) with parameters and return the result.',
  inputSchema: jsonSchema<CallRpcInput>({
    type: 'object',
    properties: {
      function_name: {
        type: 'string',
        description: 'The PostgreSQL function name to call.',
      },
      params: {
        type: 'object',
        description: 'Object containing function parameters.',
      },
    },
    required: ['function_name'],
    additionalProperties: false,
  }),
  async execute(input: CallRpcInput): Promise<RpcResult> {
    try {
      if (!input.function_name || input.function_name.trim() === '') {
        throw new Error('function_name is required and must be non-empty');
      }

      const path = `/rest/v1/rpc/${encodeURIComponent(input.function_name)}`;

      const data = await apiRequest<unknown>('POST', path, {
        body: input.params || {},
      });

      return { data };
    } catch (error) {
      throw new Error(`Failed to call RPC function: ${(error as Error).message}`);
    }
  },
});

// ─── Count Rows ──────────────────────────────────────────────────────────────

export interface CountRowsInput {
  table: string;
  filter?: string;
}

export const countRows = tool({
  description:
    'Count rows in a Supabase table, optionally filtered by conditions, using exact count.',
  inputSchema: jsonSchema<CountRowsInput>({
    type: 'object',
    properties: {
      table: {
        type: 'string',
        description: 'The table name to count rows in.',
      },
      filter: {
        type: 'string',
        description: 'Optional PostgREST filter string. Example: "age=gte.18&status=eq.active".',
      },
    },
    required: ['table'],
    additionalProperties: false,
  }),
  async execute(input: CountRowsInput): Promise<CountResult> {
    if (!input.table || input.table.trim() === '') {
      throw new Error('table is required and must be non-empty');
    }

    try {
      const params = new URLSearchParams();

      if (input.filter) {
        const filterParts = input.filter.split('&');
        for (const part of filterParts) {
          const eqIdx = part.indexOf('=');
          if (eqIdx === -1) {
            throw new Error(
              `Invalid filter segment "${part}". Expected format: "column=operator.value"`
            );
          }
          const key = part.substring(0, eqIdx);
          const value = part.substring(eqIdx + 1);
          if (key && value) {
            params.append(key, value);
          }
        }
      }

      const queryString = params.toString();
      const pathSuffix = queryString ? `?${queryString}` : '';
      const path = `/rest/v1/${encodeURIComponent(input.table)}${pathSuffix}`;

      const response = await apiRequest<{ headers: Record<string, string> }>('HEAD', path, {
        headers: {
          Prefer: 'count=exact',
        },
      });

      // Extract count from content-range header (format: "0-24/3573" or "*/0")
      const contentRange = response.headers['content-range'];
      let count = 0;

      if (contentRange) {
        const match = contentRange.match(/\/(\d+)$/);
        if (match && match[1]) {
          count = Number.parseInt(match[1], 10);
        }
      }

      return {
        count,
        table: input.table,
      };
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Invalid filter')) {
        throw error;
      }
      throw new Error(`Failed to count rows in "${input.table}": ${(error as Error).message}`);
    }
  },
});

// ─── List Tables ─────────────────────────────────────────────────────────────

export type ListTablesInput = {};

export const listTables = tool({
  description: 'List all available tables in the Supabase database via the OpenAPI schema.',
  inputSchema: jsonSchema<ListTablesInput>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute(_input: ListTablesInput): Promise<ListTablesResult> {
    try {
      const path = '/rest/v1/';

      // Fetch the OpenAPI spec from the root endpoint
      const spec = await apiRequest<{
        paths?: Record<string, unknown>;
      }>('GET', path);

      const tables: string[] = [];

      if (spec.paths) {
        for (const pathKey of Object.keys(spec.paths)) {
          // Path format: /{table_name} or /rpc/{function_name}
          // We want tables, not RPC functions
          if (pathKey.startsWith('/') && !pathKey.startsWith('/rpc/')) {
            const tableName = pathKey.substring(1); // Remove leading slash
            if (tableName && !tableName.includes('/')) {
              tables.push(tableName);
            }
          }
        }
      }

      return { tables: tables.sort() };
    } catch (error) {
      throw new Error(`Failed to list tables: ${(error as Error).message}`);
    }
  },
});

// ─── Search Rows ─────────────────────────────────────────────────────────────

export interface SearchRowsInput {
  table: string;
  column: string;
  query: string;
  select?: string;
  limit?: number;
  order?: string;
}

export const searchRows = tool({
  description:
    'Search rows in a Supabase table using case-insensitive pattern matching (ilike operator).',
  inputSchema: jsonSchema<SearchRowsInput>({
    type: 'object',
    properties: {
      table: {
        type: 'string',
        description: 'The table name to search in.',
      },
      column: {
        type: 'string',
        description: 'The column name to search in.',
      },
      query: {
        type: 'string',
        description: 'The search term to match (case-insensitive).',
      },
      select: {
        type: 'string',
        description: 'Columns to select (default: "*").',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of rows to return (1-1000, default: 100).',
      },
      order: {
        type: 'string',
        description: 'Order by column(s). Example: "created_at.desc".',
      },
    },
    required: ['table', 'column', 'query'],
    additionalProperties: false,
  }),
  async execute(input: SearchRowsInput): Promise<SearchResult> {
    if (!input.table || input.table.trim() === '') {
      throw new Error('table is required and must be non-empty');
    }

    if (!input.column || input.column.trim() === '') {
      throw new Error('column is required and must be non-empty');
    }

    // Validate column name contains only valid characters (letters, digits, underscores)
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(input.column)) {
      throw new Error(
        `Invalid column name "${input.column}". Column names must start with a letter or underscore and contain only letters, digits, and underscores.`
      );
    }

    if (!input.query || input.query.trim() === '') {
      throw new Error('query is required and must be non-empty');
    }

    if (input.limit !== undefined && (input.limit < 1 || input.limit > 1000)) {
      throw new Error('limit must be between 1 and 1000');
    }

    try {
      const params = new URLSearchParams();
      params.append('select', input.select || '*');
      // PostgREST handles ilike safely via parameterized queries on the server side
      params.append(input.column, `ilike.*${input.query}*`);

      if (input.order) {
        params.append('order', input.order);
      }

      if (input.limit !== undefined) {
        params.append('limit', String(input.limit));
      }

      const path = `/rest/v1/${encodeURIComponent(input.table)}?${params.toString()}`;
      const rows = await apiRequest<Record<string, unknown>[]>('GET', path);

      return {
        rows: rows || [],
        count: (rows || []).length,
      };
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.startsWith('Invalid column') ||
          error.message.startsWith('query') ||
          error.message.startsWith('column') ||
          error.message.startsWith('table') ||
          error.message.startsWith('limit'))
      ) {
        throw error;
      }
      throw new Error(`Failed to search rows in "${input.table}": ${(error as Error).message}`);
    }
  },
});

// ─── Default Export ─────────────────────────────────────────────────────────

export default {
  queryRows,
  getRowById,
  insertRows,
  updateRows,
  deleteRows,
  upsertRows,
  callRpc,
  countRows,
  listTables,
  searchRows,
};
