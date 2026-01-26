/**
 * Scenario Execution Unit Tests
 *
 * Tests for the execution logic including:
 * - Quota management
 * - Quality score metrics
 * - Error handling
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ScenarioExecutionError } from './execute';

// Mock prisma
vi.mock('@tpmjs/db', () => ({
  prisma: {
    scenarioQuota: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    scenario: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    scenarioRun: {
      create: vi.fn(),
      update: vi.fn(),
    },
    collection: {
      findUnique: vi.fn(),
    },
  },
}));

describe('ScenarioExecutionError', () => {
  it('should create error with category', () => {
    const error = new ScenarioExecutionError('Test error message', 'COLLECTION_NOT_FOUND', {
      scenarioId: 'test-123',
    });

    expect(error.message).toBe('Test error message');
    expect(error.category).toBe('COLLECTION_NOT_FOUND');
    expect(error.context).toEqual({ scenarioId: 'test-123' });
    expect(error.name).toBe('ScenarioExecutionError');
  });

  it('should work without context', () => {
    const error = new ScenarioExecutionError('No context error', 'NO_TOOLS');

    expect(error.message).toBe('No context error');
    expect(error.category).toBe('NO_TOOLS');
    expect(error.context).toBeUndefined();
  });

  it('should be an instance of Error', () => {
    const error = new ScenarioExecutionError('Test', 'UNKNOWN_ERROR');
    expect(error instanceof Error).toBe(true);
  });

  it('should support all error categories', () => {
    const categories = [
      'COLLECTION_NOT_FOUND',
      'NO_COLLECTION',
      'NO_TOOLS',
      'TOOL_BUILD_ERROR',
      'EXECUTION_ERROR',
      'EVALUATION_ERROR',
      'QUOTA_EXCEEDED',
      'UNKNOWN_ERROR',
    ] as const;

    for (const category of categories) {
      const error = new ScenarioExecutionError(`Error: ${category}`, category);
      expect(error.category).toBe(category);
    }
  });
});

describe('Quota Management', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('checkAndDecrementQuota', () => {
    it('should create quota for new user', async () => {
      const { prisma } = await import('@tpmjs/db');
      const { checkAndDecrementQuota } = await import('./execute');

      vi.mocked(prisma.scenarioQuota.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.scenarioQuota.create).mockResolvedValue({
        id: 'quota-1',
        userId: 'user-1',
        dailyLimit: 50,
        dailyUsed: 0,
        lastResetAt: new Date('2025-01-15T00:00:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(prisma.scenarioQuota.update).mockResolvedValue({
        id: 'quota-1',
        userId: 'user-1',
        dailyLimit: 50,
        dailyUsed: 1,
        lastResetAt: new Date('2025-01-15T00:00:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await checkAndDecrementQuota('user-1');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(49);
      expect(prisma.scenarioQuota.create).toHaveBeenCalled();
    });

    it('should deny when quota exceeded', async () => {
      const { prisma } = await import('@tpmjs/db');
      const { checkAndDecrementQuota } = await import('./execute');

      vi.mocked(prisma.scenarioQuota.findUnique).mockResolvedValue({
        id: 'quota-1',
        userId: 'user-1',
        dailyLimit: 50,
        dailyUsed: 50,
        lastResetAt: new Date('2025-01-15T00:00:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await checkAndDecrementQuota('user-1');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should reset quota on new day', async () => {
      const { prisma } = await import('@tpmjs/db');
      const { checkAndDecrementQuota } = await import('./execute');

      // Quota from yesterday
      vi.mocked(prisma.scenarioQuota.findUnique).mockResolvedValue({
        id: 'quota-1',
        userId: 'user-1',
        dailyLimit: 50,
        dailyUsed: 45,
        lastResetAt: new Date('2025-01-14T00:00:00Z'), // Yesterday
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // After reset
      vi.mocked(prisma.scenarioQuota.update).mockResolvedValue({
        id: 'quota-1',
        userId: 'user-1',
        dailyLimit: 50,
        dailyUsed: 0,
        lastResetAt: new Date('2025-01-15T00:00:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await checkAndDecrementQuota('user-1');

      expect(result.allowed).toBe(true);
      // After reset: 50 - 0 - 1 = 49
      expect(result.remaining).toBe(49);
    });
  });

  describe('getQuotaStatus', () => {
    it('should return default quota for new user', async () => {
      const { prisma } = await import('@tpmjs/db');
      const { getQuotaStatus } = await import('./execute');

      vi.mocked(prisma.scenarioQuota.findUnique).mockResolvedValue(null);

      const result = await getQuotaStatus('user-1');

      expect(result.used).toBe(0);
      expect(result.limit).toBe(50);
      expect(result.remaining).toBe(50);
    });

    it('should return current quota for existing user', async () => {
      const { prisma } = await import('@tpmjs/db');
      const { getQuotaStatus } = await import('./execute');

      vi.mocked(prisma.scenarioQuota.findUnique).mockResolvedValue({
        id: 'quota-1',
        userId: 'user-1',
        dailyLimit: 50,
        dailyUsed: 10,
        lastResetAt: new Date('2025-01-15T00:00:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await getQuotaStatus('user-1');

      expect(result.used).toBe(10);
      expect(result.limit).toBe(50);
      expect(result.remaining).toBe(40);
    });
  });
});

describe('Scenario Metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateScenarioMetrics', () => {
    it('should increase quality score on pass', async () => {
      const { prisma } = await import('@tpmjs/db');
      const { updateScenarioMetrics } = await import('./execute');

      vi.mocked(prisma.scenario.findUnique).mockResolvedValue({
        id: 'scenario-1',
        collectionId: 'col-1',
        prompt: 'Test',
        name: 'Test',
        description: null,
        tags: [],
        assertions: null,
        qualityScore: 0.5,
        consecutivePasses: 0,
        consecutiveFails: 2,
        totalRuns: 5,
        lastRunAt: null,
        lastRunStatus: 'fail',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(prisma.scenario.update).mockResolvedValue({} as any);

      await updateScenarioMetrics('scenario-1', 'pass');

      expect(prisma.scenario.update).toHaveBeenCalledWith({
        where: { id: 'scenario-1' },
        data: expect.objectContaining({
          consecutivePasses: 1,
          consecutiveFails: 0,
          totalRuns: 6,
          lastRunStatus: 'pass',
        }),
      });

      // Check quality score increased
      const updateCall = vi.mocked(prisma.scenario.update).mock.calls[0]?.[0];
      expect(updateCall?.data.qualityScore).toBeGreaterThan(0.5);
    });

    it('should decrease quality score on fail', async () => {
      const { prisma } = await import('@tpmjs/db');
      const { updateScenarioMetrics } = await import('./execute');

      vi.mocked(prisma.scenario.findUnique).mockResolvedValue({
        id: 'scenario-1',
        collectionId: 'col-1',
        prompt: 'Test',
        name: 'Test',
        description: null,
        tags: [],
        assertions: null,
        qualityScore: 0.5,
        consecutivePasses: 3,
        consecutiveFails: 0,
        totalRuns: 5,
        lastRunAt: null,
        lastRunStatus: 'pass',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(prisma.scenario.update).mockResolvedValue({} as any);

      await updateScenarioMetrics('scenario-1', 'fail');

      expect(prisma.scenario.update).toHaveBeenCalledWith({
        where: { id: 'scenario-1' },
        data: expect.objectContaining({
          consecutivePasses: 0,
          consecutiveFails: 1,
          totalRuns: 6,
          lastRunStatus: 'fail',
        }),
      });

      // Check quality score decreased
      const updateCall = vi.mocked(prisma.scenario.update).mock.calls[0]?.[0];
      expect(updateCall?.data.qualityScore).toBeLessThan(0.5);
    });

    it('should not exceed quality score bounds', async () => {
      const { prisma } = await import('@tpmjs/db');
      const { updateScenarioMetrics } = await import('./execute');

      // Test max bound
      vi.mocked(prisma.scenario.findUnique).mockResolvedValue({
        id: 'scenario-1',
        collectionId: 'col-1',
        prompt: 'Test',
        name: 'Test',
        description: null,
        tags: [],
        assertions: null,
        qualityScore: 0.99,
        consecutivePasses: 10,
        consecutiveFails: 0,
        totalRuns: 20,
        lastRunAt: null,
        lastRunStatus: 'pass',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(prisma.scenario.update).mockResolvedValue({} as any);

      await updateScenarioMetrics('scenario-1', 'pass');

      const updateCall = vi.mocked(prisma.scenario.update).mock.calls[0]?.[0];
      expect(updateCall?.data.qualityScore).toBeLessThanOrEqual(1.0);
    });

    it('should not go below zero', async () => {
      const { prisma } = await import('@tpmjs/db');
      const { updateScenarioMetrics } = await import('./execute');

      // Test min bound
      vi.mocked(prisma.scenario.findUnique).mockResolvedValue({
        id: 'scenario-1',
        collectionId: 'col-1',
        prompt: 'Test',
        name: 'Test',
        description: null,
        tags: [],
        assertions: null,
        qualityScore: 0.05,
        consecutivePasses: 0,
        consecutiveFails: 5,
        totalRuns: 10,
        lastRunAt: null,
        lastRunStatus: 'fail',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(prisma.scenario.update).mockResolvedValue({} as any);

      await updateScenarioMetrics('scenario-1', 'fail');

      const updateCall = vi.mocked(prisma.scenario.update).mock.calls[0]?.[0];
      expect(updateCall?.data.qualityScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle non-existent scenario gracefully', async () => {
      const { prisma } = await import('@tpmjs/db');
      const { updateScenarioMetrics } = await import('./execute');

      vi.mocked(prisma.scenario.findUnique).mockResolvedValue(null);

      // Should not throw
      await expect(updateScenarioMetrics('non-existent', 'pass')).resolves.toBeUndefined();
      expect(prisma.scenario.update).not.toHaveBeenCalled();
    });
  });
});

describe('Quality Score Algorithm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reward consecutive passes with streak bonus', async () => {
    const { prisma } = await import('@tpmjs/db');
    const { updateScenarioMetrics } = await import('./execute');

    // Starting with 3 consecutive passes
    vi.mocked(prisma.scenario.findUnique).mockResolvedValue({
      id: 'scenario-1',
      collectionId: 'col-1',
      prompt: 'Test',
      name: 'Test',
      description: null,
      tags: [],
      assertions: null,
      qualityScore: 0.3,
      consecutivePasses: 3,
      consecutiveFails: 0,
      totalRuns: 5,
      lastRunAt: null,
      lastRunStatus: 'pass',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(prisma.scenario.update).mockResolvedValue({} as any);

    await updateScenarioMetrics('scenario-1', 'pass');

    const updateCall = vi.mocked(prisma.scenario.update).mock.calls[0]?.[0];
    // Base: 0.3, +0.05 for pass, +0.01*4 for streak bonus = 0.3 + 0.05 + 0.04 = 0.39
    expect(updateCall?.data.qualityScore).toBeCloseTo(0.39, 2);
    expect(updateCall?.data.consecutivePasses).toBe(4);
  });

  it('should penalize consecutive fails with streak penalty', async () => {
    const { prisma } = await import('@tpmjs/db');
    const { updateScenarioMetrics } = await import('./execute');

    // Starting with 2 consecutive fails
    vi.mocked(prisma.scenario.findUnique).mockResolvedValue({
      id: 'scenario-1',
      collectionId: 'col-1',
      prompt: 'Test',
      name: 'Test',
      description: null,
      tags: [],
      assertions: null,
      qualityScore: 0.5,
      consecutivePasses: 0,
      consecutiveFails: 2,
      totalRuns: 5,
      lastRunAt: null,
      lastRunStatus: 'fail',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(prisma.scenario.update).mockResolvedValue({} as any);

    await updateScenarioMetrics('scenario-1', 'fail');

    const updateCall = vi.mocked(prisma.scenario.update).mock.calls[0]?.[0];
    // Base: 0.5, -0.1 for fail, -0.02*3 for streak penalty = 0.5 - 0.1 - 0.06 = 0.34
    expect(updateCall?.data.qualityScore).toBeCloseTo(0.34, 2);
    expect(updateCall?.data.consecutiveFails).toBe(3);
  });
});
