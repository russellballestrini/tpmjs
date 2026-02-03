import { describe, expect, it } from 'vitest';

describe('executor-test', () => {
  it('should export run function', async () => {
    const { run } = await import('./runner.js');
    expect(typeof run).toBe('function');
  });

  it('should export test suite functions', async () => {
    const { runCoreTests, runStandardTests } = await import('./index.js');
    expect(typeof runCoreTests).toBe('function');
    expect(typeof runStandardTests).toBe('function');
  });
});
