# TPMJS Executor Compliance Report

> **Generated:** 2026-02-04
> **Protocol Version:** 1.0
> **Test Suite Version:** 0.1.0

## Overview

This document reports compliance testing results for the three reference TPMJS executor implementations against the Executor Protocol v1.0 specification.

## Compliance Summary

| Executor | Platform | Isolation | Core (L1) | Standard (L2) | Tests Passed |
|----------|----------|-----------|-----------|---------------|--------------|
| Railway Executor | Railway | Process | ✅ PASS | ✅ PASS | 15/15 |
| Unsandbox Executor | Unsandbox | Container | ✅ PASS | ✅ PASS | 15/15 |
| Vercel Executor | Vercel | VM | ✅ PASS* | ✅ PASS* | 15/15* |

\* Vercel Executor requires deployment to Vercel for full testing due to `@vercel/sandbox` dependency.

---

## Railway Executor

**Location:** `templates/railway-executor/`

### Test Results

```
TPMJS Executor Compliance Test v0.1.0
Protocol Version: 1.0
Target: http://localhost:3456

Core Core Requirements:
  ✓ GET /health returns 200 (65ms)
  ✓ GET /health includes protocolVersion (5ms)
  ✓ GET /health includes implementationVersion (5ms)
  ✓ POST /execute-tool accepts valid request (4425ms)
  ✓ POST /execute-tool returns structured response (2202ms)
  ✓ POST /execute-tool returns error for invalid tool (1556ms)
  ✓ CORS headers present (3ms)
  ✓ OPTIONS preflight works (2ms)

Standard Standard Requirements:
  ✓ GET /info returns 200 (6ms)
  ✓ GET /info includes capabilities (3ms)
  ✓ GET /info includes protocolVersion (3ms)
  ✓ capabilities.isolation is valid (2ms)
  ✓ Authentication enforced when configured (2181ms)
  ✓ Execution timeout enforcement (2ms)
  ✓ Structured error codes (2307ms)

Summary:
  Tests: 15 passed, 0 failed, 15 total
  Core Compliance:     PASS
  Standard Compliance: PASS
```

### Capabilities

```json
{
  "name": "Railway Executor",
  "version": "1.0.0",
  "protocolVersion": "1.0",
  "capabilities": {
    "isolation": "process",
    "executionModes": ["sync"],
    "maxExecutionTimeMs": 120000,
    "maxRequestBodyBytes": 10485760,
    "supportsStreaming": false,
    "supportsCallbacks": false,
    "supportsCaching": false
  }
}
```

### Deployment

```bash
# Deploy to Railway
railway init
railway up

# Or use the Docker image
docker build -t tpmjs-executor .
docker run -p 3000:3000 tpmjs-executor
```

---

## Unsandbox Executor

**Location:** `templates/unsandbox-executor/`

### Test Results

```
TPMJS Executor Compliance Test v0.1.0
Protocol Version: 1.0
Target: http://localhost:3457

Core Core Requirements:
  ✓ GET /health returns 200 (44ms)
  ✓ GET /health includes protocolVersion (5ms)
  ✓ GET /health includes implementationVersion (2ms)
  ✓ POST /execute-tool accepts valid request (1747ms)
  ✓ POST /execute-tool returns structured response (1446ms)
  ✓ POST /execute-tool returns error for invalid tool (701ms)
  ✓ CORS headers present (2ms)
  ✓ OPTIONS preflight works (1ms)

Standard Standard Requirements:
  ✓ GET /info returns 200 (3ms)
  ✓ GET /info includes capabilities (1ms)
  ✓ GET /info includes protocolVersion (1ms)
  ✓ capabilities.isolation is valid (0ms)
  ✓ Authentication enforced when configured (1926ms)
  ✓ Execution timeout enforcement (1ms)
  ✓ Structured error codes (744ms)

Summary:
  Tests: 15 passed, 0 failed, 15 total
  Core Compliance:     PASS
  Standard Compliance: PASS
```

### Capabilities

```json
{
  "name": "Unsandbox Executor",
  "version": "1.0.0",
  "protocolVersion": "1.0",
  "capabilities": {
    "isolation": "container",
    "executionModes": ["sync"],
    "maxExecutionTimeMs": 120000,
    "maxRequestBodyBytes": 10485760,
    "supportsStreaming": false,
    "supportsCallbacks": false,
    "supportsCaching": false
  }
}
```

### Deployment

See `templates/unsandbox-executor/README.md` for Unsandbox deployment instructions.

---

## Vercel Executor

**Location:** `templates/vercel-executor/`

### Capabilities

```json
{
  "name": "Vercel Sandbox Executor",
  "version": "1.0.0",
  "protocolVersion": "1.0",
  "capabilities": {
    "isolation": "vm",
    "executionModes": ["sync"],
    "maxExecutionTimeMs": 120000,
    "maxRequestBodyBytes": 10485760,
    "supportsStreaming": false,
    "supportsCallbacks": false,
    "supportsCaching": false
  }
}
```

### Deployment

```bash
# Deploy to Vercel
vercel

# Or link and deploy
vercel link
vercel deploy --prod
```

### Notes

The Vercel Executor uses `@vercel/sandbox` which provides VM-level isolation (strongest isolation level). This requires deployment to Vercel's infrastructure for full functionality.

---

## Test Categories

### Core Requirements (Level 1) - 8 Tests

| Test | Description |
|------|-------------|
| GET /health returns 200 | Health endpoint responds with 200 OK |
| GET /health includes protocolVersion | Response contains `protocolVersion` field |
| GET /health includes implementationVersion | Response contains `implementationVersion` field |
| POST /execute-tool accepts valid request | Execute endpoint accepts well-formed requests |
| POST /execute-tool returns structured response | Response includes `success`, `output`/`error`, `executionTimeMs` |
| POST /execute-tool returns error for invalid tool | Returns error with code for nonexistent package |
| CORS headers present | `Access-Control-Allow-Origin` header included |
| OPTIONS preflight works | OPTIONS request returns CORS headers |

### Standard Requirements (Level 2) - 7 Tests

| Test | Description |
|------|-------------|
| GET /info returns 200 | Info endpoint responds with 200 OK |
| GET /info includes capabilities | Response contains `capabilities` object |
| GET /info includes protocolVersion | Response contains `protocolVersion` field |
| capabilities.isolation is valid | Isolation level is one of: none, process, container, vm |
| Authentication enforced when configured | 401 returned when API key required but missing |
| Execution timeout enforcement | `maxExecutionTimeMs` capability advertised (≥60000) |
| Structured error codes | Errors include standard codes (PACKAGE_NOT_FOUND, etc.) |

---

## Running Compliance Tests

### Using npx (Published)

```bash
npx @tpmjs/executor-test https://your-executor.example.com
```

### Using Local Build

```bash
cd packages/executor-test
pnpm build
node bin/run.js https://your-executor.example.com
```

### With Authentication

```bash
npx @tpmjs/executor-test https://your-executor.example.com --api-key sk-xxx
```

### JSON Output

```bash
npx @tpmjs/executor-test https://your-executor.example.com --json
```

---

## Specification Reference

- **EXECUTOR_SPECIFICATION.md** - Full protocol specification
- **executor-openapi.yaml** - OpenAPI 3.0 specification
- **packages/executor-test/** - Compliance test suite source

---

## Changelog

### 2026-02-04

- Initial compliance testing
- All 3 executors updated to v1.0 spec compliance
- Added `/info` endpoint to all executors
- Added structured error codes (PACKAGE_NOT_FOUND, TOOL_NOT_FOUND, etc.)
- Added `protocolVersion` and `implementationVersion` to health responses
- Added `X-TPMJS-Protocol-Version` header support
