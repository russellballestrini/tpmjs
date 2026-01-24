/**
 * Scenario Execution Integration Tests
 *
 * Tests the scenario run API endpoint including:
 * - Running scenarios
 * - Quota management
 * - Result evaluation
 *
 * NOTE: These tests require authentication and may consume API quotas.
 * Run with caution in development environments only.
 */

import { prisma } from '@tpmjs/db';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Skip integration tests unless explicitly enabled
const INTEGRATION_TESTS_ENABLED = process.env.INTEGRATION_TESTS === 'true';
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// Check if server is available
async function isServerAvailable(): Promise<boolean> {
  if (!INTEGRATION_TESTS_ENABLED) return false;
  try {
    const response = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(2000) });
    return response.ok;
  } catch {
    return false;
  }
}

describe.skipIf(!INTEGRATION_TESTS_ENABLED)('Scenario Execution Integration', () => {
  let serverAvailable = false;
  let testScenario: { id: string; name: string; collectionId: string } | null = null;

  beforeAll(async () => {
    serverAvailable = await isServerAvailable();
    if (!serverAvailable) {
      console.warn('⚠️  Server not available - skipping scenario execution tests');
      return;
    }

    // Find a test scenario
    testScenario = await prisma.scenario.findFirst({
      where: {
        collection: { isPublic: true },
      },
      select: { id: true, name: true, collectionId: true },
    });

    if (!testScenario) {
      console.warn('⚠️  No public scenario found - some tests will be skipped');
    }
  });

  afterAll(async () => {
    if (!serverAvailable) return;
    await prisma.$disconnect();
  });

  describe('POST /api/scenarios/[id]/run', () => {
    it('should require authentication', async () => {
      if (!serverAvailable || !testScenario) return;

      const response = await fetch(`${BASE_URL}/api/scenarios/${testScenario.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      // Should return 401 without auth
      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent scenario', async () => {
      if (!serverAvailable) return;

      const response = await fetch(`${BASE_URL}/api/scenarios/non-existent-id-12345/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      // Should return 401 (auth required first) or 404
      expect([401, 404]).toContain(response.status);
    });
  });

  describe('Scenario metrics', () => {
    it('should have quality score between 0 and 1', async () => {
      if (!serverAvailable) return;

      const scenarios = await prisma.scenario.findMany({
        take: 10,
        select: { id: true, qualityScore: true },
      });

      for (const scenario of scenarios) {
        expect(scenario.qualityScore).toBeGreaterThanOrEqual(0);
        expect(scenario.qualityScore).toBeLessThanOrEqual(1);
      }
    });

    it('should track consecutive passes and fails', async () => {
      if (!serverAvailable) return;

      const scenarios = await prisma.scenario.findMany({
        take: 10,
        select: {
          id: true,
          consecutivePasses: true,
          consecutiveFails: true,
          totalRuns: true,
        },
      });

      for (const scenario of scenarios) {
        expect(scenario.consecutivePasses).toBeGreaterThanOrEqual(0);
        expect(scenario.consecutiveFails).toBeGreaterThanOrEqual(0);
        expect(scenario.totalRuns).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Scenario runs history', () => {
    it('should have valid run records', async () => {
      if (!serverAvailable) return;

      const runs = await prisma.scenarioRun.findMany({
        take: 10,
        select: {
          id: true,
          status: true,
          scenarioId: true,
          userId: true,
          createdAt: true,
        },
      });

      for (const run of runs) {
        expect(['pending', 'running', 'pass', 'fail', 'error']).toContain(run.status);
        expect(run.scenarioId).toBeDefined();
        expect(run.userId).toBeDefined();
        expect(run.createdAt).toBeInstanceOf(Date);
      }
    });

    it('should track token usage for completed runs', async () => {
      if (!serverAvailable) return;

      const completedRuns = await prisma.scenarioRun.findMany({
        where: { status: { in: ['pass', 'fail'] } },
        take: 10,
        select: {
          id: true,
          inputTokens: true,
          outputTokens: true,
          totalTokens: true,
          executionTimeMs: true,
        },
      });

      for (const run of completedRuns) {
        // Completed runs should have token counts
        if (run.inputTokens !== null) {
          expect(run.inputTokens).toBeGreaterThanOrEqual(0);
        }
        if (run.outputTokens !== null) {
          expect(run.outputTokens).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe('Quota management', () => {
    it('should track user quotas', async () => {
      if (!serverAvailable) return;

      const quotas = await prisma.scenarioQuota.findMany({
        take: 5,
        select: {
          userId: true,
          dailyLimit: true,
          dailyUsed: true,
          lastResetAt: true,
        },
      });

      for (const quota of quotas) {
        expect(quota.dailyLimit).toBeGreaterThan(0);
        expect(quota.dailyUsed).toBeGreaterThanOrEqual(0);
        expect(quota.dailyUsed).toBeLessThanOrEqual(quota.dailyLimit);
      }
    });
  });
});
