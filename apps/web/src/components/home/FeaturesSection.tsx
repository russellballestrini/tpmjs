'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Container } from '@tpmjs/ui/Container/Container';
import type { IconName } from '@tpmjs/ui/Icon/Icon';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';

// ============================================================================
// Feature Card Component
// ============================================================================

interface FeatureCardProps {
  icon: IconName;
  title: string;
  description: string;
  badge?: string;
  href?: string;
}

function FeatureCard({
  icon,
  title,
  description,
  badge,
  href,
}: FeatureCardProps): React.ReactElement {
  const content = (
    <div className="group h-full p-6 border border-dashed border-border bg-surface hover:border-primary hover:bg-primary/5 transition-all duration-200">
      {/* Icon */}
      <div className="w-12 h-12 flex items-center justify-center mb-4 border border-dashed border-border bg-background group-hover:border-primary group-hover:bg-primary/10 transition-all duration-200">
        <Icon
          icon={icon}
          size="md"
          className="text-foreground-secondary group-hover:text-primary transition-colors duration-200"
        />
      </div>

      {/* Content */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-mono text-lg font-semibold text-foreground lowercase group-hover:text-primary transition-colors">
          {title}
        </h3>
        {badge && (
          <Badge variant="outline" size="sm" className="flex-shrink-0">
            {badge}
          </Badge>
        )}
      </div>
      <p className="font-sans text-sm text-foreground-secondary leading-relaxed">{description}</p>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

// ============================================================================
// Main Features Section
// ============================================================================

export function FeaturesSection(): React.ReactElement {
  const features: Array<{
    icon: IconName;
    title: string;
    description: string;
    badge: string;
    href?: string;
  }> = [
    {
      icon: 'search',
      title: 'semantic retrieval',
      description:
        'Agent describes what it needs, TPMJS returns the right tools. Selection at scale through semantic search and quality scoring.',
      badge: 'core',
      href: '/tool/tool-search',
    },
    {
      icon: 'puzzle',
      title: 'omega agent',
      description:
        'See toolspace virtualization in action. Omega discovers and executes from 1M+ tools on-demand. No pre-configuration.',
      badge: 'demo',
      href: '/omega',
    },
    {
      icon: 'folder',
      title: 'collections',
      description:
        'Curate domain-specific toolsets. Collections become instant MCP servers with stable URLs and progressive tool loading.',
      badge: 'shareable',
      href: '/collections',
    },
    {
      icon: 'user',
      title: 'custom agents',
      description:
        'Build agents with any LLM and custom prompts. The toolspace scales independently of agent complexity.',
      badge: 'unlimited',
      href: '/agents',
    },
    {
      icon: 'link',
      title: 'mcp protocol',
      description:
        'MCP is the socket. TPMJS is the operating system. Works with Claude, Cursor, Windsurf, and any MCP client.',
      badge: 'universal',
      href: '/integrations',
    },
    {
      icon: 'key',
      title: 'sandboxed execution',
      description:
        'Every tool runs isolated with timeouts and rate limits. npm is storage, TPMJS is the secure runtime.',
      badge: 'secure',
    },
    {
      icon: 'checkCircle',
      title: 'quality signals',
      description:
        'Health checks, test scenarios, and usage metrics. Surface the best tools from the infinite toolspace.',
      badge: 'automated',
      href: '/scenarios',
    },
    {
      icon: 'message',
      title: 'living skills',
      description:
        'Documentation emerges from real usage. Tools teach agents how to use them through proven patterns.',
      badge: 'evolving',
      href: '/docs/skills',
    },
    {
      icon: 'terminal',
      title: 'publish once',
      description:
        'Add one keyword to package.json. Your tool joins the infinite toolspace within minutes. Zero configuration.',
      badge: 'npm',
      href: '/publish',
    },
  ];

  return (
    <section className="py-20 bg-background border-t border-border">
      <Container size="xl" padding="lg">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="font-mono text-xs text-primary uppercase tracking-widest mb-3">
            toolspace virtualization
          </p>
          <h2 className="font-mono text-3xl md:text-4xl font-semibold mb-4 text-foreground lowercase">
            the retrieval layer
          </h2>
          <p className="text-base text-foreground-secondary max-w-2xl mx-auto font-sans">
            npm stores the tools. TPMJS retrieves the right ones. Agents get infinite capabilities
            without infinite context windows.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              badge={feature.badge}
              href={feature.href}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="inline-flex flex-col sm:flex-row gap-4">
            <Link href="/omega">
              <Button size="lg" variant="default">
                Try Omega Agent
              </Button>
            </Link>
            <Link href="/docs">
              <Button size="lg" variant="outline">
                Read the Docs
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
