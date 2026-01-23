/**
 * Register Built-in Tool Renderers
 *
 * Call this function once at app initialization to register
 * all built-in tool renderers with the registry.
 */

import { DefaultJsonRenderer } from './DefaultJsonRenderer';
import { toolRendererRegistry } from './registry';
import { RegistryExecuteRenderer } from './renderers/RegistryExecuteRenderer';
import { RegistrySearchRenderer } from './renderers/RegistrySearchRenderer';

let isRegistered = false;

/**
 * Register all built-in tool renderers
 *
 * This function is idempotent - calling it multiple times has no effect.
 *
 * @example
 * ```tsx
 * // In your app's root or layout
 * import { registerBuiltInRenderers } from '@tpmjs/ui/ToolRenderer/registerBuiltInRenderers';
 *
 * registerBuiltInRenderers();
 * ```
 */
export function registerBuiltInRenderers(): void {
  if (isRegistered) {
    return;
  }

  // Register specific renderers first (higher priority)
  toolRendererRegistry.register({
    match: (name) => name === 'registrySearchTool',
    priority: 100,
    component: RegistrySearchRenderer,
  });

  toolRendererRegistry.register({
    match: (name) => name === 'registryExecuteTool',
    priority: 100,
    component: RegistryExecuteRenderer,
  });

  // Register default fallback renderer (lowest priority)
  toolRendererRegistry.register({
    match: () => true,
    priority: -1000,
    component: DefaultJsonRenderer,
  });

  isRegistered = true;
}
