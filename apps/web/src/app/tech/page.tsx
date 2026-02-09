import type { Metadata } from 'next';
import { AppHeader } from '~/components/AppHeader';
import { TechDiagram } from '~/components/tech/TechDiagram';

export const metadata: Metadata = {
  title: 'Tech Stack | TPMJS',
  description:
    'Interactive isometric diagram of the TPMJS ecosystem architecture. Explore external services, applications, published packages, internal packages, and official tools.',
};

export default function TechPage(): React.ReactElement {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-foreground">
              TPMJS Tech Stack
            </h1>
            <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
              Interactive isometric view of the entire TPMJS ecosystem. Pan and zoom to explore how
              services, apps, and packages connect.
            </p>
          </div>

          {/* Diagram */}
          <TechDiagram />

          {/* Legend */}
          <div className="mt-8 sm:mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              {
                label: 'External Services',
                color: 'bg-orange-100 dark:bg-orange-900/30 border-orange-500',
              },
              {
                label: 'Applications',
                color: 'bg-blue-100 dark:bg-blue-900/30 border-blue-500',
              },
              {
                label: 'Published Packages',
                color: 'bg-green-100 dark:bg-green-900/30 border-green-500',
              },
              {
                label: 'Internal Packages',
                color: 'bg-purple-100 dark:bg-purple-900/30 border-purple-500',
              },
              {
                label: 'Official Tools',
                color: 'bg-pink-100 dark:bg-pink-900/30 border-pink-500',
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded border-2 ${item.color}`} />
                <span className="text-sm text-foreground-secondary">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
