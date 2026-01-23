/**
 * Tool Renderer Registry
 *
 * Singleton registry for registering and looking up tool renderers.
 * Renderers are matched by priority (higher = more specific).
 */

import type { ToolRendererConfig, ToolRendererProps } from './types';

class ToolRendererRegistry {
  private renderers: ToolRendererConfig[] = [];

  /**
   * Register a tool renderer
   * @param config - The renderer configuration
   */
  register<TInput = unknown, TOutput = unknown>(config: ToolRendererConfig<TInput, TOutput>): void {
    // Add renderer and sort by priority (descending)
    this.renderers.push(config as ToolRendererConfig);
    this.renderers.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }

  /**
   * Get the appropriate renderer for a tool
   * @param toolName - The name of the tool
   * @returns The matching renderer component, or null if none found
   */
  getRenderer(toolName: string): React.ComponentType<ToolRendererProps> | null {
    const config = this.renderers.find((r) => r.match(toolName));
    return config?.component ?? null;
  }

  /**
   * Get all registered renderers (for debugging)
   */
  getRegisteredRenderers(): ToolRendererConfig[] {
    return [...this.renderers];
  }

  /**
   * Clear all renderers (useful for testing)
   */
  clear(): void {
    this.renderers = [];
  }
}

/**
 * Global tool renderer registry
 */
export const toolRendererRegistry = new ToolRendererRegistry();
