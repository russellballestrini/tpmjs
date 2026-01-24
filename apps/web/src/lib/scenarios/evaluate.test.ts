/**
 * Scenario Evaluation Unit Tests
 *
 * Tests for the evaluation logic including:
 * - Regex assertion matching
 * - Final verdict determination
 * - Assertion result handling
 */

import { describe, expect, it } from 'vitest';

import { determineFinalVerdict, runAssertions } from './evaluate';

describe('runAssertions', () => {
  describe('regex assertions', () => {
    it('should pass when regex matches output', () => {
      const output = 'Hello, World!';
      const assertions = { regex: ['hello', 'world'] };

      const result = runAssertions(output, assertions);

      expect(result.passed).toContain('regex:hello');
      expect(result.passed).toContain('regex:world');
      expect(result.failed).toHaveLength(0);
    });

    it('should fail when regex does not match output', () => {
      const output = 'Goodbye, World!';
      const assertions = { regex: ['hello'] };

      const result = runAssertions(output, assertions);

      expect(result.failed).toContain('regex:hello');
      expect(result.passed).toHaveLength(0);
    });

    it('should handle multiple assertions with mixed results', () => {
      const output = 'The result is 42 and status is success';
      const assertions = { regex: ['result.*42', 'success', 'error', 'failure'] };

      const result = runAssertions(output, assertions);

      expect(result.passed).toContain('regex:result.*42');
      expect(result.passed).toContain('regex:success');
      expect(result.failed).toContain('regex:error');
      expect(result.failed).toContain('regex:failure');
    });

    it('should handle case-insensitive matching', () => {
      const output = 'SUCCESS';
      const assertions = { regex: ['success'] };

      const result = runAssertions(output, assertions);

      expect(result.passed).toContain('regex:success');
    });

    it('should handle invalid regex patterns gracefully', () => {
      const output = 'test';
      const assertions = { regex: ['[invalid', '(unclosed'] };

      const result = runAssertions(output, assertions);

      expect(result.failed).toContain('regex:[invalid (invalid pattern)');
      expect(result.failed).toContain('regex:(unclosed (invalid pattern)');
    });

    it('should handle empty regex array', () => {
      const output = 'test';
      const assertions = { regex: [] };

      const result = runAssertions(output, assertions);

      expect(result.passed).toHaveLength(0);
      expect(result.failed).toHaveLength(0);
    });

    it('should handle complex regex patterns', () => {
      const output = 'User john@example.com has ID 12345';
      const assertions = {
        regex: [
          '[a-z]+@[a-z]+\\.[a-z]+', // Email pattern
          'ID \\d+', // ID pattern
          '^User', // Starts with User
        ],
      };

      const result = runAssertions(output, assertions);

      expect(result.passed).toHaveLength(3);
      expect(result.failed).toHaveLength(0);
    });
  });

  describe('schema assertions', () => {
    it('should note when schema is provided', () => {
      const output = '{"name": "test"}';
      const assertions = { schema: { type: 'object' } };

      const result = runAssertions(output, assertions);

      expect(result.passed).toContain('schema:provided (validation pending)');
    });
  });

  describe('combined assertions', () => {
    it('should handle both regex and schema assertions', () => {
      const output = '{"status": "success"}';
      const assertions = {
        regex: ['success'],
        schema: { type: 'object' },
      };

      const result = runAssertions(output, assertions);

      expect(result.passed).toContain('regex:success');
      expect(result.passed).toContain('schema:provided (validation pending)');
    });
  });
});

describe('determineFinalVerdict', () => {
  describe('LLM evaluation only', () => {
    it('should return pass when LLM says pass', () => {
      const evaluation = {
        verdict: 'pass' as const,
        reason: 'Task completed successfully',
        confidence: 0.95,
      };

      const result = determineFinalVerdict(evaluation);

      expect(result).toBe('pass');
    });

    it('should return fail when LLM says fail', () => {
      const evaluation = {
        verdict: 'fail' as const,
        reason: 'Task was not completed',
        confidence: 0.9,
      };

      const result = determineFinalVerdict(evaluation);

      expect(result).toBe('fail');
    });
  });

  describe('with assertions', () => {
    it('should return pass when LLM passes and all assertions pass', () => {
      const evaluation = {
        verdict: 'pass' as const,
        reason: 'Task completed',
        confidence: 0.9,
      };
      const assertions = {
        passed: ['regex:success', 'regex:result'],
        failed: [],
      };

      const result = determineFinalVerdict(evaluation, assertions);

      expect(result).toBe('pass');
    });

    it('should return fail when LLM passes but assertions fail', () => {
      const evaluation = {
        verdict: 'pass' as const,
        reason: 'Task completed',
        confidence: 0.9,
      };
      const assertions = {
        passed: ['regex:success'],
        failed: ['regex:expected_output'],
      };

      const result = determineFinalVerdict(evaluation, assertions);

      expect(result).toBe('fail');
    });

    it('should return fail when LLM fails regardless of assertions', () => {
      const evaluation = {
        verdict: 'fail' as const,
        reason: 'Task failed',
        confidence: 0.95,
      };
      const assertions = {
        passed: ['regex:success'],
        failed: [],
      };

      const result = determineFinalVerdict(evaluation, assertions);

      expect(result).toBe('fail');
    });

    it('should handle null assertions', () => {
      const evaluation = {
        verdict: 'pass' as const,
        reason: 'Task completed',
        confidence: 0.9,
      };

      const result = determineFinalVerdict(evaluation, null);

      expect(result).toBe('pass');
    });

    it('should handle undefined assertions', () => {
      const evaluation = {
        verdict: 'pass' as const,
        reason: 'Task completed',
        confidence: 0.9,
      };

      const result = determineFinalVerdict(evaluation, undefined);

      expect(result).toBe('pass');
    });
  });
});
