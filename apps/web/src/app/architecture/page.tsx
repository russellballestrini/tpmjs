import type { Metadata } from 'next';
import { AppHeader } from '~/components/AppHeader';
import { SystemOverviewDiagram } from '~/components/SystemOverviewDiagram';

export const metadata: Metadata = {
  title: 'System Architecture | TPMJS',
  description:
    'Interactive visualization of the TPMJS system architecture. See how tools flow from npm to execution.',
};

export default function ArchitecturePage(): React.ReactElement {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-foreground">
              TPMJS System Architecture
            </h1>
            <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
              See how tools flow from npm to execution. Click any node to learn more.
            </p>
          </div>

          {/* Diagram */}
          <SystemOverviewDiagram />

          {/* Legend */}
          <div className="mt-8 sm:mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Tools', color: 'bg-blue-100 dark:bg-blue-900/30 border-blue-500' },
              {
                label: 'npm Registry',
                color: 'bg-orange-100 dark:bg-orange-900/30 border-orange-500',
              },
              { label: 'TPMJS', color: 'bg-green-100 dark:bg-green-900/30 border-green-500' },
              { label: 'Users', color: 'bg-purple-100 dark:bg-purple-900/30 border-purple-500' },
              { label: 'Executors', color: 'bg-pink-100 dark:bg-pink-900/30 border-pink-500' },
              { label: 'Outputs', color: 'bg-green-100 dark:bg-green-900/30 border-green-500' },
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
