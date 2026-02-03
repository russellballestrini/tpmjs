'use client';

import { Container } from '@tpmjs/ui/Container/Container';
import type { IconName } from '@tpmjs/ui/Icon/Icon';
import { Icon } from '@tpmjs/ui/Icon/Icon';

const stages: Array<{
  number: string;
  title: string;
  description: string;
  icon: IconName;
  color: string;
}> = [
  {
    number: '01',
    title: 'npm stores everything',
    description: '1M+ packages. Every tool ever published. Too many for any context window.',
    icon: 'box',
    color: 'text-foreground-tertiary',
  },
  {
    number: '02',
    title: 'TPMJS retrieves what matters',
    description:
      'Semantic search + quality signals surface the right tools for any task. Selection at scale.',
    icon: 'search',
    color: 'text-primary',
  },
  {
    number: '03',
    title: 'Agent uses what it needs',
    description:
      'Progressive disclosure. Tools load on-demand. Infinite capabilities, finite tokens.',
    icon: 'puzzle',
    color: 'text-brutalist-accent',
  },
];

export function ToolspaceSection(): React.ReactElement {
  return (
    <section className="py-20 bg-surface border-t border-border">
      <Container size="xl" padding="lg">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="font-mono text-xs text-primary uppercase tracking-widest mb-3">
            how it works
          </p>
          <h2 className="font-mono text-3xl md:text-4xl font-semibold mb-4 text-foreground lowercase">
            toolspace virtualization
          </h2>
          <p className="text-base text-foreground-secondary max-w-2xl mx-auto font-sans">
            Use a million tools without loading a million tools. TPMJS is the retrieval layer
            between npm and your agent.
          </p>
        </div>

        {/* Pipeline Visualization */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4">
            {stages.map((stage, index) => (
              <div key={stage.number} className="relative">
                {/* Connector Line (hidden on mobile, between cards on desktop) */}
                {index < stages.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-[2px] bg-border" />
                )}

                <div className="p-6 border border-dashed border-border bg-background h-full">
                  {/* Stage Number */}
                  <div className="flex items-center gap-4 mb-4">
                    <span className={`font-mono text-3xl font-bold ${stage.color}`}>
                      {stage.number}
                    </span>
                    <div
                      className={`w-10 h-10 flex items-center justify-center border border-dashed border-border ${stage.color}`}
                    >
                      <Icon icon={stage.icon} size="sm" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="font-mono text-lg font-semibold text-foreground mb-2 lowercase">
                    {stage.title}
                  </h3>
                  <p className="text-sm text-foreground-secondary leading-relaxed">
                    {stage.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Tagline */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-4 px-6 py-4 border border-dashed border-primary bg-primary/5">
              <Icon icon="star" size="md" className="text-primary" />
              <p className="font-mono text-sm text-foreground">
                <span className="text-primary font-semibold">npm</span> is storage.{' '}
                <span className="text-primary font-semibold">TPMJS</span> is the operating system
                for tool access.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
