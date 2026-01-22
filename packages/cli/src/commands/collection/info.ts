import { Args, Command, Flags } from '@oclif/core';

import { getApiKey, getApiUrl } from '../../lib/config.js';
import { createOutput } from '../../lib/output.js';

interface McpTool {
  name: string;
  description: string;
  inputSchema?: {
    type: string;
    required?: string[];
    properties?: Record<string, { type: string; description?: string }>;
  };
}

interface McpListToolsResponse {
  jsonrpc: '2.0';
  id: number;
  result?: {
    tools: McpTool[];
  };
  error?: {
    code: number;
    message: string;
  };
}

export default class CollectionInfo extends Command {
  static description = 'Show collection details and list all available tools';

  static examples = [
    '<%= config.bin %> collection info ajax/unsandbox',
    '<%= config.bin %> collection info ajax/unsandbox --json',
    '<%= config.bin %> collection info ajax/unsandbox --verbose',
  ];

  static args = {
    collection: Args.string({
      description: 'Collection identifier (username/slug)',
      required: true,
    }),
  };

  static flags = {
    json: Flags.boolean({
      description: 'Output in JSON format',
      default: false,
    }),
    verbose: Flags.boolean({
      char: 'v',
      description: 'Show tool input schemas',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CollectionInfo);
    const output = createOutput(flags);

    // Parse collection identifier
    const parts = args.collection.split('/');
    if (parts.length !== 2) {
      output.error('Invalid collection format. Use: username/slug');
      return;
    }

    const [username, slug] = parts;
    const baseUrl = getApiUrl().replace(/\/api$/, '');
    const mcpUrl = `${baseUrl}/api/mcp/${username}/${slug}/http`;

    const spinner = output.spinner(`Fetching tools from ${args.collection}...`);

    try {
      // Get API key for authentication
      const apiKey = getApiKey();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      // Call MCP tools/list to get all tools
      const response = await fetch(mcpUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
        }),
      });

      if (!response.ok) {
        spinner.fail('Failed to fetch collection');
        output.error(`HTTP ${response.status}: ${await response.text()}`);
        return;
      }

      const data = (await response.json()) as McpListToolsResponse;

      if (data.error) {
        spinner.fail('Failed to fetch tools');
        output.error(data.error.message);
        return;
      }

      const tools = data.result?.tools || [];
      spinner.stop();

      if (flags.json) {
        output.json({
          collection: args.collection,
          mcpUrl,
          toolCount: tools.length,
          tools: tools.map((t) => ({
            name: t.name,
            description: t.description,
            ...(flags.verbose ? { inputSchema: t.inputSchema } : {}),
          })),
        });
        return;
      }

      // Display collection info
      output.success(`Collection: ${args.collection}`);
      output.text(`MCP URL: ${mcpUrl}`);
      output.text(`Tools: ${tools.length}`);
      output.divider();

      if (tools.length === 0) {
        output.info('No tools in this collection');
        return;
      }

      // Display tools table
      output.table(
        tools.map((tool) => ({
          name: tool.name,
          description: truncate(tool.description, 60),
        })),
        [
          { key: 'name', header: 'Tool Name', width: 40 },
          { key: 'description', header: 'Description', width: 60 },
        ]
      );

      // Show verbose tool details
      if (flags.verbose) {
        output.newLine();
        output.divider();
        output.text('Tool Details:');
        output.newLine();

        for (const tool of tools) {
          output.text(`${output.bold(tool.name)}`);
          output.text(`  ${tool.description}`);

          if (tool.inputSchema?.properties) {
            const props = tool.inputSchema.properties;
            const required = tool.inputSchema.required || [];
            output.text('  Parameters:');
            for (const [name, schema] of Object.entries(props)) {
              const req = required.includes(name) ? ' (required)' : '';
              output.text(`    - ${name}: ${schema.type}${req}`);
              if (schema.description) {
                output.text(`      ${output.dim(schema.description)}`);
              }
            }
          }
          output.newLine();
        }
      }

      // Usage hints
      output.newLine();
      output.text(output.dim('Usage example:'));
      const exampleTool = tools[0]?.name || 'toolName';
      output.text(output.dim(`  tpm run -c ${args.collection} -t ${exampleTool} --args '{}'`));
    } catch (error) {
      spinner.fail('Failed to fetch collection');
      output.error(error instanceof Error ? error.message : 'Unknown error');
    }
  }
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}
