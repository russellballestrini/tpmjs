'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useState } from 'react';
import { ForkButton } from '~/components/ForkButton';

interface EnvVar {
  name: string;
  description?: string;
}

interface InstallationSectionProps {
  collection: {
    id: string;
    slug: string;
    name: string;
    toolCount: number;
    envVars?: Record<string, string> | null;
  };
  username: string;
  isPrivate: boolean;
  /** Whether to show the fork button (typically false for dashboard/owner view) */
  showForkButton?: boolean;
}

export function InstallationSection({
  collection,
  username,
  isPrivate,
  showForkButton = true,
}: InstallationSectionProps) {
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [showClaudeDesktop, setShowClaudeDesktop] = useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://tpmjs.com';
  const mcpUrl = `${baseUrl}/@${username}/collections/${collection.slug}/mcp`;

  // Build the claude mcp add command
  // Options must come before <name> <url>
  const commandParts = ['claude mcp add'];
  commandParts.push('--transport http');
  if (isPrivate) {
    commandParts.push('--header "Authorization: Bearer YOUR_TPMJS_API_KEY"');
  }
  commandParts.push(collection.slug);
  commandParts.push(mcpUrl);

  const installCommand = commandParts.join(' \\\n  ');

  // Build Claude Desktop config JSON
  const claudeDesktopConfig = isPrivate
    ? JSON.stringify(
        {
          mcpServers: {
            [collection.slug]: {
              type: 'http',
              url: mcpUrl,
              headers: {
                Authorization: 'Bearer YOUR_TPMJS_API_KEY',
              },
            },
          },
        },
        null,
        2
      )
    : JSON.stringify(
        {
          mcpServers: {
            [collection.slug]: {
              type: 'http',
              url: mcpUrl,
            },
          },
        },
        null,
        2
      );

  // Extract env var names from collection
  const envVarsList: EnvVar[] = collection.envVars
    ? Object.keys(collection.envVars).map((name) => ({ name }))
    : [];

  const copyCommand = async () => {
    // Copy the flat command (without line breaks for easy pasting)
    const flatCommand = isPrivate
      ? `claude mcp add --transport http --header "Authorization: Bearer YOUR_TPMJS_API_KEY" ${collection.slug} ${mcpUrl}`
      : `claude mcp add --transport http ${collection.slug} ${mcpUrl}`;

    await navigator.clipboard.writeText(flatCommand);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  return (
    <section className="bg-surface border border-border rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground">Installation</h2>
          <Badge variant="secondary" size="sm">
            {collection.toolCount} {collection.toolCount === 1 ? 'tool' : 'tools'}
          </Badge>
        </div>
      </div>

      {/* Env Vars Warning */}
      {envVarsList.length > 0 && (
        <div className="mb-6 p-4 bg-warning/10 border border-warning/30 rounded-lg">
          <div className="flex items-start gap-3">
            <Icon icon="alertTriangle" size="sm" className="text-warning mt-0.5 shrink-0" />
            <div>
              <h3 className="font-medium text-foreground">Required Environment Variables</h3>
              <p className="text-sm text-foreground-secondary mt-1">
                Set these before tools will work:
              </p>
              <ul className="mt-2 space-y-1">
                {envVarsList.map((envVar) => (
                  <li key={envVar.name} className="text-sm">
                    <code className="font-mono text-xs bg-surface px-1.5 py-0.5 rounded border border-border">
                      {envVar.name}
                    </code>
                    {envVar.description && (
                      <span className="text-foreground-tertiary ml-2">— {envVar.description}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Add to Claude */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-foreground mb-2">Step 1: Add to Claude</h3>
        <div className="relative">
          <pre className="p-4 bg-surface-secondary border border-border rounded-lg font-mono text-sm text-foreground-secondary overflow-x-auto whitespace-pre-wrap break-all">
            {installCommand}
          </pre>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyCommand}
            className="absolute top-2 right-2"
          >
            <Icon icon={copiedCommand ? 'check' : 'copy'} size="xs" />
          </Button>
        </div>
        {isPrivate && (
          <p className="mt-2 text-xs text-foreground-tertiary">
            Get your API key from{' '}
            <Link
              href="/dashboard/settings/tpmjs-api-keys"
              className="text-primary hover:underline"
            >
              Settings
            </Link>
          </p>
        )}
      </div>

      {/* Step 2: Verify */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-foreground mb-2">Step 2: Verify</h3>
        <p className="text-sm text-foreground-secondary">
          Run{' '}
          <code className="font-mono text-xs bg-surface-secondary px-1.5 py-0.5 rounded border border-border">
            /mcp
          </code>{' '}
          in Claude Code to confirm the server is connected.
        </p>
      </div>

      {/* Fork Button */}
      {showForkButton && (
        <div className="mb-6">
          <ForkButton
            type="collection"
            sourceId={collection.id}
            sourceName={collection.name}
            variant="full"
            className="w-full"
          />
        </div>
      )}

      {/* Collapsible Sections */}
      <div className="pt-4 border-t border-border space-y-2">
        {/* Claude Desktop */}
        <button
          type="button"
          onClick={() => setShowClaudeDesktop(!showClaudeDesktop)}
          className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          <Icon icon={showClaudeDesktop ? 'chevronDown' : 'chevronRight'} size="xs" />
          <span>Using Claude Desktop instead?</span>
        </button>

        {showClaudeDesktop && (
          <div className="mt-3 ml-6">
            <p className="text-sm text-foreground-secondary mb-2">
              Add this to your{' '}
              <code className="font-mono text-xs bg-surface-secondary px-1.5 py-0.5 rounded border border-border">
                claude_desktop_config.json
              </code>{' '}
              file:
            </p>
            <CodeBlock language="json" code={claudeDesktopConfig} />
            {isPrivate && (
              <p className="mt-2 text-xs text-foreground-tertiary">
                Replace <code className="font-mono">YOUR_TPMJS_API_KEY</code> with your{' '}
                <Link
                  href="/dashboard/settings/tpmjs-api-keys"
                  className="text-primary hover:underline"
                >
                  TPMJS API key
                </Link>
              </p>
            )}
          </div>
        )}

        {/* Troubleshooting */}
        <button
          type="button"
          onClick={() => setShowTroubleshooting(!showTroubleshooting)}
          className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          <Icon icon={showTroubleshooting ? 'chevronDown' : 'chevronRight'} size="xs" />
          <span>Troubleshooting</span>
        </button>

        {showTroubleshooting && (
          <div className="mt-3 ml-6 space-y-4 text-sm">
            {/* Connection timeout */}
            <div>
              <h4 className="font-medium text-foreground">Connection timeout</h4>
              <ul className="mt-1 text-foreground-secondary space-y-1">
                <li>
                  • Try increasing the timeout:{' '}
                  <code className="font-mono text-xs bg-surface-secondary px-1 rounded">
                    MCP_TIMEOUT=10000 claude
                  </code>
                </li>
                <li>• Check firewall/VPN settings</li>
              </ul>
            </div>

            {/* Auth failures */}
            <div>
              <h4 className="font-medium text-foreground">Authentication failures</h4>
              <ul className="mt-1 text-foreground-secondary space-y-1">
                <li>• Verify your API key is correct</li>
                <li>
                  • Ensure the header format is{' '}
                  <code className="font-mono text-xs bg-surface-secondary px-1 rounded">
                    Authorization: Bearer YOUR_KEY
                  </code>
                </li>
                <li>• Check that your API key hasn&apos;t expired</li>
              </ul>
            </div>

            {/* Server not appearing */}
            <div>
              <h4 className="font-medium text-foreground">Server not appearing</h4>
              <ul className="mt-1 text-foreground-secondary space-y-1">
                <li>
                  • Run{' '}
                  <code className="font-mono text-xs bg-surface-secondary px-1 rounded">
                    claude mcp list
                  </code>{' '}
                  to see configured servers
                </li>
                <li>
                  • Try removing and re-adding:{' '}
                  <code className="font-mono text-xs bg-surface-secondary px-1 rounded">
                    claude mcp remove {collection.slug}
                  </code>
                </li>
              </ul>
            </div>

            {/* Tools not loading */}
            <div>
              <h4 className="font-medium text-foreground">Tools not loading</h4>
              <ul className="mt-1 text-foreground-secondary space-y-1">
                <li>• The server may take a moment to initialize on first connection</li>
                <li>• Check that required environment variables are set</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
