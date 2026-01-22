import { Command, Flags } from '@oclif/core';

import { getApiKey, getApiUrl } from '../lib/config.js';
import { createOutput, type OutputFormatter } from '../lib/output.js';

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: {
    content?: Array<{ type: string; text: string }>;
    [key: string]: unknown;
  };
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

interface RunFlags {
  collection: string;
  tool: string;
  args: string;
  env?: string[];
  json: boolean;
  verbose: boolean;
  timeout: number;
}

/**
 * Parse and validate collection identifier
 */
function parseCollection(collection: string): { username: string; slug: string } | null {
  const parts = collection.split('/');
  if (parts.length !== 2) return null;
  const [username, slug] = parts;
  if (!username || !slug) return null;
  return { username, slug };
}

/**
 * Parse JSON tool arguments
 */
function parseToolArgs(argsStr: string): Record<string, unknown> | null {
  try {
    return JSON.parse(argsStr) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Build environment variables from process.env and explicit flags
 */
function buildEnvVars(
  envFlags: string[] | undefined,
  output: OutputFormatter
): Record<string, string> {
  const envVars: Record<string, string> = {};

  // Add process env vars that might be relevant
  for (const [key, value] of Object.entries(process.env)) {
    if (value && (key.endsWith('_API_KEY') || key.endsWith('_TOKEN') || key.endsWith('_SECRET'))) {
      envVars[key] = value;
    }
  }

  // Add explicitly passed env vars (override process env)
  if (envFlags) {
    for (const envPair of envFlags) {
      const [key, ...valueParts] = envPair.split('=');
      if (key && valueParts.length > 0) {
        envVars[key] = valueParts.join('=');
      } else {
        output.warning(`Invalid env var format: ${envPair}. Use: KEY=value`);
      }
    }
  }

  return envVars;
}

/**
 * Display verbose request info
 */
function displayVerboseInfo(
  output: OutputFormatter,
  mcpUrl: string,
  tool: string,
  toolArgs: Record<string, unknown>,
  envVars: Record<string, string>
): void {
  output.info(`MCP Endpoint: ${mcpUrl}`);
  output.info(`Tool: ${tool}`);
  output.info(`Arguments: ${JSON.stringify(toolArgs, null, 2)}`);
  if (Object.keys(envVars).length > 0) {
    output.info(`Environment: ${Object.keys(envVars).join(', ')}`);
  }
  output.divider();
}

/**
 * Handle HTTP error response
 */
async function handleHttpError(response: Response, output: OutputFormatter): Promise<void> {
  const errorText = await response.text();
  try {
    const errorJson = JSON.parse(errorText) as { error?: { message?: string }; message?: string };
    output.error(errorJson.error?.message || errorJson.message || `HTTP ${response.status}`);
  } catch {
    output.error(`HTTP ${response.status}: ${errorText}`);
  }
}

/**
 * Display MCP response content
 */
function displayContent(result: JsonRpcResponse['result'], output: OutputFormatter): void {
  if (!result) {
    output.text('(empty result)');
    return;
  }

  if (result.content && Array.isArray(result.content)) {
    for (const item of result.content) {
      displayContentItem(item, output);
    }
  } else {
    output.text(JSON.stringify(result, null, 2));
  }
}

/**
 * Display a single content item
 */
function displayContentItem(item: { type: string; text: string }, output: OutputFormatter): void {
  if (item.type === 'text') {
    try {
      const parsed = JSON.parse(item.text);
      output.text(JSON.stringify(parsed, null, 2));
    } catch {
      output.text(item.text);
    }
  } else if (item.type === 'image') {
    output.info('[Image content]');
  } else {
    output.text(JSON.stringify(item, null, 2));
  }
}

/**
 * Handle execution error
 */
function handleExecutionError(error: unknown, flags: RunFlags, output: OutputFormatter): void {
  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      output.error(`Request timed out after ${flags.timeout} seconds`);
    } else {
      output.error(error.message);
    }
  } else {
    output.error('Unknown error occurred');
  }

  if (flags.verbose) {
    output.info(`Full error: ${String(error)}`);
  }
}

export default class Run extends Command {
  static description = 'Execute a tool from a collection via MCP';

  static examples = [
    {
      description: 'First, list all tools in a collection',
      command: '<%= config.bin %> collection info ajax/unsandbox',
    },
    {
      description: 'Execute Python code in the unsandbox collection',
      command:
        '<%= config.bin %> run -c ajax/unsandbox -t unsandbox--execute --args \'{"language":"python","code":"print(42)"}\'',
    },
    {
      description: 'Pass environment variables for tool authentication',
      command:
        '<%= config.bin %> run -c ajax/unsandbox -t unsandbox--execute -e UNSANDBOX_PUBLIC_KEY=xxx -e UNSANDBOX_SECRET_KEY=xxx --args \'{"language":"python","code":"print(1)"}\'',
    },
    {
      description: 'Output result as JSON',
      command: '<%= config.bin %> run -c ajax/tools -t search --args \'{"query":"test"}\' --json',
    },
    {
      description: 'Show verbose output for debugging',
      command: "<%= config.bin %> run -c ajax/unsandbox -t unsandbox--healthCheck --args '{}' -v",
    },
  ];

  static flags = {
    collection: Flags.string({
      char: 'c',
      description: 'Collection identifier (username/slug)',
      required: true,
    }),
    tool: Flags.string({
      char: 't',
      description: 'Tool name (MCP format: package--toolName)',
      required: true,
    }),
    args: Flags.string({
      char: 'a',
      description: 'Tool arguments as JSON string',
      default: '{}',
    }),
    env: Flags.string({
      char: 'e',
      description: 'Environment variables (key=value)',
      multiple: true,
    }),
    json: Flags.boolean({
      description: 'Output result as JSON',
      default: false,
    }),
    verbose: Flags.boolean({
      char: 'v',
      description: 'Show verbose output',
      default: false,
    }),
    timeout: Flags.integer({
      description: 'Request timeout in seconds',
      default: 60,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Run);
    const output = createOutput(flags);

    // Parse and validate inputs
    const collection = parseCollection(flags.collection);
    if (!collection) {
      output.error('Invalid collection format. Use: username/slug');
      return;
    }

    const toolArgs = parseToolArgs(flags.args);
    if (!toolArgs) {
      output.error('Invalid JSON in --args flag');
      return;
    }

    // Build request components
    const envVars = buildEnvVars(flags.env, output);
    const baseUrl = getApiUrl().replace(/\/api$/, '');
    const mcpUrl = `${baseUrl}/api/mcp/${collection.username}/${collection.slug}/http`;

    const apiKey = getApiKey();
    if (!apiKey) {
      output.warning('No API key configured. Some operations may fail.');
      output.warning('Run `tpm auth login` to authenticate.');
    }

    if (flags.verbose) {
      displayVerboseInfo(output, mcpUrl, flags.tool, toolArgs, envVars);
    }

    // Execute the request
    await this.executeToolCall(flags, output, mcpUrl, apiKey, toolArgs, envVars);
  }

  private async executeToolCall(
    flags: RunFlags,
    output: OutputFormatter,
    mcpUrl: string,
    apiKey: string | undefined,
    toolArgs: Record<string, unknown>,
    envVars: Record<string, string>
  ): Promise<void> {
    const jsonRpcRequest = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: flags.tool,
        arguments: toolArgs,
        ...(Object.keys(envVars).length > 0 ? { env: envVars } : {}),
      },
    };

    const spinner = output.spinner(`Executing ${flags.tool}...`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), flags.timeout * 1000);

      const response = await fetch(mcpUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify(jsonRpcRequest),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        spinner.fail('Request failed');
        await handleHttpError(response, output);
        return;
      }

      const result = (await response.json()) as JsonRpcResponse;
      spinner.stop();

      this.handleResult(flags, output, result);
    } catch (error) {
      spinner.fail('Execution failed');
      handleExecutionError(error, flags, output);
    }
  }

  private handleResult(flags: RunFlags, output: OutputFormatter, result: JsonRpcResponse): void {
    if (result.error) {
      output.error(`Tool execution failed: ${result.error.message}`);
      if (flags.verbose && result.error.data) {
        output.info(`Error data: ${JSON.stringify(result.error.data, null, 2)}`);
      }
      return;
    }

    if (flags.json) {
      output.json(result.result);
      return;
    }

    output.success('Tool execution complete');
    output.divider();
    displayContent(result.result, output);
  }
}
