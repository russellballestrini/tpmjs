'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Drawer } from '@tpmjs/ui/Drawer/Drawer';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { ExecutorsDiagram } from './architecture/ExecutorsDiagram';
import { NpmRegistryDiagram } from './architecture/NpmRegistryDiagram';
import { OutputsDiagram } from './architecture/OutputsDiagram';
import { ToolsDiagram } from './architecture/ToolsDiagram';
import { TpmjsDiagram } from './architecture/TpmjsDiagram';
import { UsersDiagram } from './architecture/UsersDiagram';

// Map node IDs to their diagram components
const diagramComponents: Record<string, React.ComponentType> = {
  tools: ToolsDiagram,
  npm: NpmRegistryDiagram,
  tpmjs: TpmjsDiagram,
  users: UsersDiagram,
  executors: ExecutorsDiagram,
  outputs: OutputsDiagram,
};

interface NodeDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  nodeId: string;
  title: string;
  description: string;
  bullets: string[];
  links?: { label: string; href: string }[];
}

export function NodeDetailDrawer({
  open,
  onClose,
  nodeId,
  title,
  description,
  bullets,
  links,
}: NodeDetailDrawerProps): React.ReactElement {
  const DiagramComponent = diagramComponents[nodeId];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      side="right"
      size="lg"
      footer={
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Interactive Diagram */}
        {DiagramComponent && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              How It Works
            </h4>
            <div className="bg-surface/50 rounded-lg border border-border p-4">
              <DiagramComponent />
            </div>
            <p className="text-xs text-foreground-tertiary italic">
              Hover over elements for more details
            </p>
          </div>
        )}

        {/* Description */}
        <p className="text-foreground-secondary leading-relaxed">{description}</p>

        {/* Bullet points */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Key Features
          </h4>
          <ul className="space-y-2">
            {bullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-3">
                <Icon icon="check" size="sm" className="flex-shrink-0 mt-0.5 text-primary" />
                <span className="text-sm text-foreground-secondary">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Links */}
        {links && links.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Learn More
            </h4>
            <div className="flex flex-wrap gap-2">
              {links.map((link) => (
                <Link key={link.href} href={link.href}>
                  <Button variant="outline" size="sm">
                    {link.label}
                    <Icon icon="arrowRight" size="sm" className="ml-1" />
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
