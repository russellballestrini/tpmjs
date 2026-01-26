/**
 * Scenario Evaluation Unit Tests
 *
 * Tests for the evaluation logic including:
 * - Regex assertion matching
 * - JSON Schema validation
 * - JSON extraction from various formats
 * - Final verdict determination
 * - Assertion result handling
 */

import { describe, expect, it } from 'vitest';

import {
  determineFinalVerdict,
  extractJsonFromOutput,
  runAssertions,
  validateJsonSchema,
} from './evaluate';

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
    it('should pass when JSON validates against schema', () => {
      const output = '{"name": "test", "age": 25}';
      const assertions = {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' },
          },
          required: ['name'],
        },
      };

      const result = runAssertions(output, assertions);

      expect(result.passed).toContain('schema: JSON validates against schema');
      expect(result.failed).toHaveLength(0);
    });

    it('should fail when JSON does not validate against schema', () => {
      const output = '{"name": 123}';
      const assertions = {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
      };

      const result = runAssertions(output, assertions);

      expect(result.failed.length).toBeGreaterThan(0);
      expect(result.failed[0]).toContain('schema:');
      expect(result.passed).toHaveLength(0);
    });

    it('should fail when output is not valid JSON', () => {
      const output = 'This is not JSON at all';
      const assertions = {
        schema: { type: 'object' },
      };

      const result = runAssertions(output, assertions);

      expect(result.failed).toContain('schema: Output does not contain valid JSON');
    });

    it('should handle schema with required fields', () => {
      const output = '{"name": "test"}';
      const assertions = {
        schema: {
          type: 'object',
          required: ['name', 'email'],
        },
      };

      const result = runAssertions(output, assertions);

      expect(result.failed.length).toBeGreaterThan(0);
      expect(result.failed[0]).toContain('schema:');
    });

    it('should handle empty schema object', () => {
      const output = '{"anything": "goes"}';
      const assertions = { schema: {} };

      const result = runAssertions(output, assertions);

      // Empty schema should not run validation
      expect(result.passed).toHaveLength(0);
      expect(result.failed).toHaveLength(0);
    });
  });

  describe('combined assertions', () => {
    it('should handle both regex and schema assertions passing', () => {
      const output = '{"status": "success", "count": 42}';
      const assertions = {
        regex: ['success', '42'],
        schema: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            count: { type: 'number' },
          },
        },
      };

      const result = runAssertions(output, assertions);

      expect(result.passed).toContain('regex:success');
      expect(result.passed).toContain('regex:42');
      expect(result.passed).toContain('schema: JSON validates against schema');
      expect(result.failed).toHaveLength(0);
    });

    it('should handle regex passing but schema failing', () => {
      const output = '{"status": "success", "count": "not a number"}';
      const assertions = {
        regex: ['success'],
        schema: {
          type: 'object',
          properties: {
            count: { type: 'number' },
          },
        },
      };

      const result = runAssertions(output, assertions);

      expect(result.passed).toContain('regex:success');
      expect(result.failed.length).toBeGreaterThan(0);
      expect(result.failed[0]).toContain('schema:');
    });
  });
});

describe('extractJsonFromOutput', () => {
  it('should extract direct JSON object', () => {
    const output = '{"name": "test"}';
    const result = extractJsonFromOutput(output);
    expect(result).toEqual({ name: 'test' });
  });

  it('should extract direct JSON array', () => {
    const output = '[1, 2, 3]';
    const result = extractJsonFromOutput(output);
    expect(result).toEqual([1, 2, 3]);
  });

  it('should extract JSON from markdown code block with json tag', () => {
    const output = 'Here is the result:\n```json\n{"status": "ok"}\n```';
    const result = extractJsonFromOutput(output);
    expect(result).toEqual({ status: 'ok' });
  });

  it('should extract JSON from markdown code block without tag', () => {
    const output = 'Result:\n```\n{"value": 42}\n```\nDone.';
    const result = extractJsonFromOutput(output);
    expect(result).toEqual({ value: 42 });
  });

  it('should extract JSON embedded in text', () => {
    const output = 'The response is {"data": "found"} as expected.';
    const result = extractJsonFromOutput(output);
    expect(result).toEqual({ data: 'found' });
  });

  it('should return null for non-JSON output', () => {
    const output = 'This is just plain text with no JSON.';
    const result = extractJsonFromOutput(output);
    expect(result).toBeNull();
  });

  it('should handle whitespace around JSON', () => {
    const output = '   \n  {"trimmed": true}  \n   ';
    const result = extractJsonFromOutput(output);
    expect(result).toEqual({ trimmed: true });
  });

  it('should handle nested JSON objects', () => {
    const output = '{"outer": {"inner": {"deep": "value"}}}';
    const result = extractJsonFromOutput(output);
    expect(result).toEqual({ outer: { inner: { deep: 'value' } } });
  });
});

describe('validateJsonSchema', () => {
  it('should validate simple object schema', () => {
    const data = { name: 'test', age: 25 };
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
    };

    const result = validateJsonSchema(data, schema);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should return errors for invalid data', () => {
    const data = { name: 123 };
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    };

    const result = validateJsonSchema(data, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should validate required fields', () => {
    const data = { name: 'test' };
    const schema = {
      type: 'object',
      required: ['name', 'email'],
    };

    const result = validateJsonSchema(data, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('email'))).toBe(true);
  });

  it('should validate array schemas', () => {
    const data = [1, 2, 3];
    const schema = {
      type: 'array',
      items: { type: 'number' },
    };

    const result = validateJsonSchema(data, schema);
    expect(result.valid).toBe(true);
  });

  it('should handle format validation (email)', () => {
    const data = { email: 'invalid-email' };
    const schema = {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
      },
    };

    const result = validateJsonSchema(data, schema);
    expect(result.valid).toBe(false);
  });

  it('should pass format validation for valid email', () => {
    const data = { email: 'test@example.com' };
    const schema = {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
      },
    };

    const result = validateJsonSchema(data, schema);
    expect(result.valid).toBe(true);
  });

  it('should handle invalid schema gracefully', () => {
    const data = { test: true };
    const schema = {
      type: 'invalid-type-that-does-not-exist',
    };

    const result = validateJsonSchema(data, schema as Record<string, unknown>);
    // Ajv with strict: false will still try to validate
    expect(result.valid).toBe(false);
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
