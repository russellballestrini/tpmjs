'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface EnvVarWarning {
  toolId: string;
  toolName: string;
  packageName: string;
  envVar: {
    name: string;
    description: string;
    required: boolean;
  };
}

interface EnvVarWarningBannerProps {
  warnings: EnvVarWarning[];
  onDismiss?: () => void;
}

/**
 * Warning banner displayed when tools need API keys that aren't configured
 */
export function EnvVarWarningBanner({ warnings, onDismiss }: EnvVarWarningBannerProps) {
  const router = useRouter();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || warnings.length === 0) {
    return null;
  }

  // Group warnings by env var name
  const uniqueEnvVars = Array.from(new Map(warnings.map((w) => [w.envVar.name, w])).values());

  const handleConfigure = () => {
    router.push('/omega/settings');
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="mx-4 mb-4 p-4 rounded-lg bg-warning/10 border border-warning/30">
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-warning/20">
          <Icon icon="alertTriangle" size="sm" className="text-warning" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-foreground">Some tools need API keys to work</h3>
          <div className="mt-2 space-y-1">
            {uniqueEnvVars.slice(0, 3).map((warning) => (
              <div key={warning.envVar.name} className="flex items-center gap-2 text-sm">
                <code className="px-1.5 py-0.5 rounded bg-surface-secondary text-xs font-mono text-foreground">
                  {warning.envVar.name}
                </code>
                <span className="text-foreground-tertiary">for {warning.packageName}</span>
              </div>
            ))}
            {uniqueEnvVars.length > 3 && (
              <p className="text-xs text-foreground-tertiary">+{uniqueEnvVars.length - 3} more</p>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" onClick={handleConfigure}>
              <Icon icon="key" size="xs" className="mr-1" />
              Configure Keys
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
