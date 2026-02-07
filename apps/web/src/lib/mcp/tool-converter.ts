import type { Package, Tool } from '@prisma/client';

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

/**
 * Keywords that Claude's API does not support in tool input_schema.
 * These get stripped recursively from any schema before returning to clients.
 */
const UNSUPPORTED_KEYWORDS = new Set([
  // Numeric constraints
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'multipleOf',
  // String constraints
  'minLength',
  'maxLength',
  // Array constraints
  'maxItems',
  'uniqueItems',
  // Advanced schema features
  'patternProperties',
  'if',
  'then',
  'else',
  'dependentRequired',
  'dependentSchemas',
  'prefixItems',
  'unevaluatedProperties',
  'unevaluatedItems',
  'contentMediaType',
  'contentEncoding',
]);

/**
 * Sanitize a JSON Schema so it conforms to what Claude's API accepts
 * (JSON Schema draft 2020-12 subset). Strips unsupported keywords,
 * fixes array-style `type`, removes old `$schema` declarations, and
 * wraps top-level composition keywords in an object wrapper.
 */
export function sanitizeInputSchema(
  schema: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  const fallback = { type: 'object' as const, properties: {} };
  if (!schema || typeof schema !== 'object') return fallback;

  try {
    const cleaned = sanitizeSchemaNode(structuredClone(schema), true);
    // Ensure root is always type: object
    if (!cleaned.type) cleaned.type = 'object';
    return cleaned;
  } catch {
    // If sanitization itself fails, return safe fallback
    return fallback;
  }
}

function sanitizeSchemaNode(
  node: Record<string, unknown>,
  isRoot: boolean
): Record<string, unknown> {
  // Remove $schema declarations (old drafts cause rejection)
  delete node.$schema;

  // Strip unsupported keywords
  for (const key of UNSUPPORTED_KEYWORDS) {
    delete node[key];
  }

  // Fix minItems: only 0 and 1 are supported
  if ('minItems' in node && typeof node.minItems === 'number') {
    if (node.minItems > 1) delete node.minItems;
  }

  // Fix array-style type like ["string", "null"] → anyOf
  if (Array.isArray(node.type)) {
    const types = node.type as string[];
    if (types.length === 1) {
      node.type = types[0];
    } else {
      delete node.type;
      node.anyOf = types.map((t) => ({ type: t }));
    }
  }

  // Wrap top-level oneOf/allOf/anyOf inside an object property
  // Claude rejects these at the root level
  if (isRoot && !node.type && (node.oneOf || node.allOf || node.anyOf)) {
    return {
      type: 'object',
      properties: {},
    };
  }

  // Remove external $ref (keep internal ones like "#/$defs/Foo")
  if (typeof node.$ref === 'string' && /^https?:\/\//.test(node.$ref)) {
    delete node.$ref;
    if (!node.type) node.type = 'object';
  }

  // Recurse into properties
  if (node.properties && typeof node.properties === 'object') {
    for (const [key, value] of Object.entries(node.properties as Record<string, unknown>)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        (node.properties as Record<string, unknown>)[key] = sanitizeSchemaNode(
          value as Record<string, unknown>,
          false
        );
      }
    }
  }

  // Recurse into items (array items schema)
  if (node.items && typeof node.items === 'object' && !Array.isArray(node.items)) {
    node.items = sanitizeSchemaNode(node.items as Record<string, unknown>, false);
  }

  // Recurse into additionalProperties when it's a schema object
  if (
    node.additionalProperties &&
    typeof node.additionalProperties === 'object' &&
    !Array.isArray(node.additionalProperties)
  ) {
    node.additionalProperties = sanitizeSchemaNode(
      node.additionalProperties as Record<string, unknown>,
      false
    );
  }

  // Recurse into composition keywords
  for (const keyword of ['anyOf', 'oneOf', 'allOf'] as const) {
    if (Array.isArray(node[keyword])) {
      node[keyword] = (node[keyword] as Record<string, unknown>[]).map((item) =>
        typeof item === 'object' && item !== null && !Array.isArray(item)
          ? sanitizeSchemaNode(item as Record<string, unknown>, false)
          : item
      );
    }
  }

  // Recurse into $defs / definitions
  for (const defsKey of ['$defs', 'definitions'] as const) {
    if (node[defsKey] && typeof node[defsKey] === 'object') {
      for (const [key, value] of Object.entries(node[defsKey] as Record<string, unknown>)) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          (node[defsKey] as Record<string, unknown>)[key] = sanitizeSchemaNode(
            value as Record<string, unknown>,
            false
          );
        }
      }
    }
  }

  return node;
}

/**
 * Bridge tool definition from the BridgeConnection.tools JSON
 */
export interface BridgeTool {
  serverId: string;
  serverName: string;
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

/**
 * Sanitize package name and tool name into a valid MCP tool name.
 * MCP tool names must match ^[a-zA-Z0-9_-]+ and be at most 64 characters.
 *
 * Example: @tpmjs/hello + helloWorldTool → tpmjs-hello--helloWorldTool
 * Example: @tpmjs/tools-sprites-foo + spritesBarTool → sprites-foo--spritesBar
 */
export function sanitizeMcpName(packageName: string, toolName: string): string {
  // Remove @ and convert / to -
  let sanitizedPkg = packageName.replace(/^@/, '').replace(/\//g, '-');

  // Remove common prefixes to shorten
  sanitizedPkg = sanitizedPkg.replace(/^tpmjs-tools-/, '');
  sanitizedPkg = sanitizedPkg.replace(/^tpmjs-/, '');

  // Remove 'Tool' suffix from tool name
  const sanitizedTool = toolName.replace(/Tool$/, '');

  const fullName = `${sanitizedPkg}--${sanitizedTool}`;

  // Ensure we stay under 64 character limit
  if (fullName.length <= 64) {
    return fullName;
  }

  // If still too long, truncate package name to fit
  const maxPkgLen = 64 - sanitizedTool.length - 2; // 2 for '--'
  if (maxPkgLen > 10) {
    return `${sanitizedPkg.slice(0, maxPkgLen)}--${sanitizedTool}`;
  }

  // Last resort: truncate both
  return fullName.slice(0, 64);
}

/**
 * Create MCP name for a bridge tool
 * Example: chrome-devtools + screenshot → bridge--chrome-devtools--screenshot
 */
export function sanitizeBridgeToolName(serverId: string, toolName: string): string {
  // Sanitize serverId and toolName to only allow valid MCP characters
  const sanitizedServer = serverId.replace(/[^a-zA-Z0-9_-]/g, '-');
  const sanitizedTool = toolName.replace(/[^a-zA-Z0-9_-]/g, '-');
  return `bridge--${sanitizedServer}--${sanitizedTool}`;
}

/**
 * Convert a TPMJS Tool to an MCP tool definition.
 * Sanitizes inputSchema to ensure it conforms to Claude's JSON Schema subset.
 */
export function convertToMcpTool(tool: Tool & { package: Package }): McpToolDefinition {
  return {
    name: sanitizeMcpName(tool.package.npmPackageName, tool.name),
    description: tool.description,
    inputSchema: sanitizeInputSchema(tool.inputSchema as Record<string, unknown>),
  };
}

/**
 * Parsed tool name result - either a registry tool or a bridge tool
 */
export type ParsedToolName =
  | {
      type: 'registry';
      packageName: string;
      literalPackageName: string;
      toolName: string;
      possiblePackages: string[];
      possibleToolNames: string[];
    }
  | { type: 'bridge'; serverId: string; toolName: string };

/**
 * Parse an MCP tool name back into its components.
 * Handles both registry tools and bridge tools.
 *
 * Registry: tpmjs-hello--helloWorldTool → { type: 'registry', packageName: "@tpmjs/hello", toolName: "helloWorldTool" }
 * Shortened: sprites-get--spritesGet → tries @tpmjs/tools-sprites-get, @tpmjs/sprites-get, sprites-get
 * Bridge: bridge--chrome-devtools--screenshot → { type: 'bridge', serverId: "chrome-devtools", toolName: "screenshot" }
 */
export function parseToolName(mcpName: string): ParsedToolName | null {
  // Check if it's a bridge tool
  const bridgeMatch = mcpName.match(/^bridge--([^-]+(?:-[^-]+)*)--(.+)$/);
  if (bridgeMatch?.[1] && bridgeMatch[2]) {
    return {
      type: 'bridge',
      serverId: bridgeMatch[1],
      toolName: bridgeMatch[2],
    };
  }

  // Otherwise parse as registry tool
  const match = mcpName.match(/^(.+)--(.+)$/);
  if (!match || !match[1] || !match[2]) return null;

  const pkg = match[1];
  const toolName = match[2];

  // Add back 'Tool' suffix if it was removed (try both with and without)
  // The handler will try to find the tool with both variants
  const toolNameWithSuffix = toolName.endsWith('Tool') ? toolName : `${toolName}Tool`;

  // Generate possible package names to try:
  // 1. @tpmjs/tools-{pkg} (shortened tpmjs-tools- prefix)
  // 2. @tpmjs/{pkg} (shortened tpmjs- prefix)
  // 3. @{scope}/{name} (standard scoped, first dash becomes /)
  // 4. {pkg} as literal (non-scoped packages)
  const possiblePackages = [
    `@tpmjs/tools-${pkg}`,
    `@tpmjs/${pkg}`,
    pkg.includes('-') ? `@${pkg.replace('-', '/')}` : `@${pkg}`,
    pkg,
  ];

  // Return the first scoped interpretation as primary, with literal as fallback
  return {
    type: 'registry',
    packageName: possiblePackages[0]!, // @tpmjs/tools-{pkg}
    literalPackageName: pkg,
    toolName: toolNameWithSuffix,
    // Additional candidates for the handler to try
    possiblePackages,
    possibleToolNames: [toolNameWithSuffix, toolName],
  } as ParsedToolName;
}

/**
 * Convert a bridge tool definition to an MCP tool definition.
 * Sanitizes inputSchema to ensure it conforms to Claude's JSON Schema subset.
 */
export function convertBridgeToolToMcp(
  tool: BridgeTool,
  displayName?: string | null
): McpToolDefinition {
  return {
    name: sanitizeBridgeToolName(tool.serverId, tool.name),
    description: displayName
      ? `[${tool.serverName}] ${displayName}`
      : tool.description || `${tool.name} from ${tool.serverName}`,
    inputSchema: sanitizeInputSchema(tool.inputSchema),
  };
}
