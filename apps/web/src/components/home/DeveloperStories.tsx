/**
 * DeveloperStories Component
 *
 * Code-first testimonials showing what builders have created with tpmjs.
 */

'use client';

import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import { Container } from '@tpmjs/ui/Container/Container';
import { DitherSectionHeader } from '@tpmjs/ui/DitherText/DitherSectionHeader';
import { developerStories } from '../../data/homePageData';

export function DeveloperStories(): React.ReactElement {
  return (
    <section className="py-16 md:py-24 bg-background relative">
      {/* Blueprint grid */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      <Container size="xl" padding="lg" className="relative z-10">
        <DitherSectionHeader className="mb-12 text-center">BUILT WITH TPMJS</DitherSectionHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {developerStories.map((story, index) => {
            return (
              <div
                key={story.author}
                className={`opacity-0 animate-brutalist-entrance stagger-${(index % 5) + 1}`}
              >
                <div className="border-l-4 border-brutalist-accent pl-6">
                  {/* Code snippet */}
                  <CodeBlock
                    code={story.code}
                    language="typescript"
                    size="md"
                    showCopy={false}
                    className="mb-6"
                  />

                  {/* Impact quote */}
                  <blockquote className="mb-4">
                    <p className="text-lg font-medium text-foreground leading-relaxed mb-2">
                      &ldquo;{story.quote}&rdquo;
                    </p>
                    <footer className="text-sm text-foreground-secondary">
                      <cite className="not-italic">
                        <span className="font-bold">{story.author}</span>
                        {', '}
                        <span className="text-brutalist-accent">{story.company}</span>
                      </cite>
                    </footer>
                  </blockquote>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
