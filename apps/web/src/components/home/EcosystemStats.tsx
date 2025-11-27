/**
 * EcosystemStats Component
 *
 * Redesigned statistics section with dithered numbers and live activity stream.
 */

'use client';

import { ActivityStream } from '@tpmjs/ui/ActivityStream/ActivityStream';
import { Container } from '@tpmjs/ui/Container/Container';
import { DitherSectionHeader } from '@tpmjs/ui/DitherText/DitherSectionHeader';
import { StatCard } from '@tpmjs/ui/StatCard/StatCard';
import { statistics } from '../../data/homePageData';

export function EcosystemStats(): React.ReactElement {
  return (
    <section className="py-16 md:py-24 bg-surface relative overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.02] grid-background" />

      <Container size="xl" padding="lg" className="relative z-10">
        <DitherSectionHeader className="mb-12 text-center">LIVE ECOSYSTEM</DitherSectionHeader>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {statistics.map((stat, index) => {
            // Extract number from value string
            const numValue = Number.parseInt(stat.value.replace(/[^0-9]/g, ''), 10) || 0;
            const suffix = stat.value.replace(/[0-9,]/g, '');

            return (
              <div
                key={stat.label}
                className={`opacity-0 animate-brutalist-entrance stagger-${index + 1}`}
              >
                <StatCard
                  value={numValue}
                  label={stat.label}
                  subtext={stat.subtext}
                  suffix={suffix}
                  variant="brutalist"
                  size="md"
                  showBar={true}
                  barProgress={60 + index * 10}
                />
              </div>
            );
          })}
        </div>

        {/* Activity Stream */}
        <div className="max-w-3xl mx-auto">
          <ActivityStream updateInterval={6000} maxItems={5} />
        </div>
      </Container>
    </section>
  );
}
