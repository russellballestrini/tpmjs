# TPMJS Executor Protocol Specification v1.0

> **Status:** Draft
> **Version:** 1.0.0
> **Last Updated:** 2026-02-03

## Overview

The TPMJS Executor Protocol defines a standard HTTP interface for executing TPMJS tools. Executors are **compute adapters** that provide a consistent API for running npm-packaged tools regardless of the underlying infrastructure.

### Design Philosophy

- **HTTP-First:** No SDK lock-in, deployable anywhere
- **Minimal Surface:** Small core, optional extensions
- **Executor ≠ Sandbox:** Standardize coordination, not security
- **Declare, Don't Enforce:** Executors report capabilities, TPMJS decides policy

### Relationship to Other Specs

| Spec | Purpose |
|------|---------|
| **MCP** | Model ↔ Tool interface |
| **TPMJS Executor** | Tool ↔ Compute interface |
| **TPMJS Tools** | Tool contract (separate spec) |

---

## Protocol Versioning

### Version Header

All requests SHOULD include:

```http
X-TPMJS-Protocol-Version: 1.0
```

Executors MUST respond with their supported protocol version in `/health` and `/info` responses.

**Rationale:** Header-based versioning enables graceful evolution without URL fragmentation.

---

## Specification Levels

### Level 1: Core (REQUIRED)

Every executor MUST implement:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Liveness + protocol discovery |
| `/execute-tool` | POST | Synchronous tool execution |

### Level 2: Standard (RECOMMENDED)

Executors SHOULD implement:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/info` | GET | Capability advertisement |

Plus:
- API key authentication
- Structured error responses
- Execution timeout enforcement
- CORS headers

### Level 3: Extended (OPTIONAL)

Reserved for future versions:

- `POST /execute-tool` with `Accept: text/event-stream` (streaming)
- `POST /execute-async` (webhook callbacks)
- `POST /validate-tool` (dry-run validation)
- `POST /execute-batch` (multiple tools)

---

## Core Endpoints

### GET /health

**Purpose:** Verify executor is running and discover protocol version.

**Response (200 OK):**

```json
{
  "status": "ok",
  "protocolVersion": "1.0",
  "implementationVersion": "1.0.0",
  "runtime": "node",
  "timestamp": "2026-02-03T12:00:00.000Z"
}
```

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | Yes | Always `"ok"` if healthy |
| `protocolVersion` | string | Yes | TPMJS protocol version (e.g., `"1.0"`) |
| `implementationVersion` | string | Yes | Executor software version |
| `runtime` | string | No | Runtime identifier (e.g., `"node"`, `"deno"`, `"bun"`) |
| `timestamp` | string | No | ISO 8601 timestamp |

**Requirements:**
- MUST respond within 1 second
- MUST return 200 OK if healthy
- MUST include `protocolVersion`

---

### POST /execute-tool

**Purpose:** Execute a single TPMJS tool synchronously.

**Request Headers:**

```http
Content-Type: application/json
Authorization: Bearer <api-key>  (if auth enabled)
X-TPMJS-Protocol-Version: 1.0
```

**Request Body:**

```json
{
  "packageName": "@tpmjs/hello",
  "version": "latest",
  "name": "helloWorldTool",
  "params": {
    "greeting": "Hello"
  },
  "env": {
    "OPENAI_API_KEY": "sk-..."
  }
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `packageName` | string | Yes | npm package name |
| `version` | string | No | Package version (default: `"latest"`) |
| `name` | string | Yes | Tool export name |
| `params` | object | No | Parameters passed to `tool.execute()` |
| `env` | object | No | Environment variables for execution |

**Success Response (200 OK):**

```json
{
  "success": true,
  "output": {
    "message": "Hello, World!"
  },
  "executionTimeMs": 1234
}
```

**Error Response (200 OK):**

```json
{
  "success": false,
  "error": {
    "code": "TOOL_EXECUTION_ERROR",
    "message": "Tool threw an error: Invalid input"
  },
  "executionTimeMs": 123
}
```

**Response Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `success` | boolean | Yes | Whether execution succeeded |
| `output` | any | If success | Return value from `tool.execute()` |
| `error` | object | If failed | Error details |
| `error.code` | string | If failed | Machine-readable error code |
| `error.message` | string | If failed | Human-readable error message |
| `executionTimeMs` | number | Yes | Total execution time in milliseconds |

**Error Codes:**

| Code | Description |
|------|-------------|
| `PACKAGE_NOT_FOUND` | npm package could not be installed |
| `TOOL_NOT_FOUND` | Named export not found in package |
| `TOOL_INVALID` | Export exists but has no `.execute()` method |
| `TOOL_EXECUTION_ERROR` | Tool threw during execution |
| `EXECUTION_TIMEOUT` | Execution exceeded time limit |
| `INTERNAL_ERROR` | Unexpected executor error |

---

## Standard Endpoints

### GET /info

**Purpose:** Advertise executor capabilities for intelligent routing.

**Response (200 OK):**

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
  },
  "runtime": {
    "platform": "linux",
    "nodeVersion": "20.10.0",
    "region": "us-west-1"
  }
}
```

**Capability Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `isolation` | string | `"none"` \| `"process"` \| `"container"` \| `"vm"` |
| `executionModes` | array | `["sync"]` (future: `"stream"`, `"async"`) |
| `maxExecutionTimeMs` | number | Maximum execution time before timeout |
| `maxRequestBodyBytes` | number | Maximum request body size |
| `supportsStreaming` | boolean | Reserved for v1.1 |
| `supportsCallbacks` | boolean | Reserved for v1.1 |
| `supportsCaching` | boolean | Reserved for v1.1 |

**Isolation Levels:**

| Level | Description |
|-------|-------------|
| `none` | Tools run in executor process (development only) |
| `process` | Tools run in separate OS process |
| `container` | Tools run in isolated container |
| `vm` | Tools run in isolated VM (strongest) |

---

## Authentication

### v1.0: API Key Only

Executors MAY require authentication via Bearer token.

**Request Header:**

```http
Authorization: Bearer <api-key>
```

**Configuration:**

Executors SHOULD use `EXECUTOR_API_KEY` environment variable:
- If set: All requests MUST include valid Bearer token
- If unset: No authentication required

**Unauthorized Response (401):**

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing API key"
  }
}
```

**Future Versions:** JWT, OAuth, and per-tool authentication are deferred to v1.1+.

---

## CORS Requirements

All executors MUST support CORS for browser-based clients.

**Required Headers:**

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-TPMJS-Protocol-Version
```

**OPTIONS Preflight:**

All endpoints MUST handle OPTIONS requests and return CORS headers with 200 OK.

---

## Execution Lifecycle

### Standard Flow

1. **Receive Request:** Parse JSON body, validate required fields
2. **Check Auth:** Verify API key if configured
3. **Create Isolation:** Create temporary execution environment
4. **Install Package:** Run `npm install <package>@<version>`
5. **Load Tool:** Import package, resolve named export
6. **Execute:** Call `tool.execute(params)` with environment
7. **Capture Result:** Collect output or error
8. **Cleanup:** Remove temporary files/processes
9. **Respond:** Return JSON response

### Tool Resolution

Executors MUST resolve a callable tool with an `.execute()` method.

**Recommended Resolution Order:**

1. `pkg[name]` - Direct named export
2. `pkg.default?.[name]` - Named property on default export
3. `pkg.default` - Default export itself (if `name` matches)

**Factory Functions:**

If export is a function without `.execute()`:
1. Try calling `tool()` with no arguments
2. Check if result has `.execute()` method

**Note:** Tool export patterns are intentionally not fully standardized in v1.0 to allow ecosystem evolution.

---

## Timeouts

### Required Timeouts

| Phase | Minimum | Recommended |
|-------|---------|-------------|
| npm install | 30s | 60s |
| Tool execution | 60s | 120s |
| Total request | 90s | 180s |

Executors MUST:
- Enforce execution timeouts
- Return `EXECUTION_TIMEOUT` error code when exceeded
- Clean up resources on timeout

---

## Error Handling

### HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Successful execution OR tool error (with `success: false`) |
| 400 | Invalid request (missing fields, malformed JSON) |
| 401 | Authentication required but missing/invalid |
| 404 | Unknown endpoint |
| 500 | Internal executor error |

### Structured Errors

All error responses MUST include:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description"
  }
}
```

---

## Implementation Checklist

### Core (Required for Compliance)

- [ ] `GET /health` returns status and protocol version
- [ ] `POST /execute-tool` accepts standard request format
- [ ] Returns `{ success, output/error, executionTimeMs }`
- [ ] Handles missing/invalid request body (400)
- [ ] CORS headers on all responses
- [ ] OPTIONS preflight handling

### Standard (Recommended)

- [ ] `GET /info` with capabilities
- [ ] `EXECUTOR_API_KEY` environment variable support
- [ ] Bearer token validation (401 on failure)
- [ ] Execution timeout enforcement
- [ ] npm install timeout (60s recommended)
- [ ] Temporary file cleanup
- [ ] Structured error codes

### Extended (Optional)

- [ ] Package caching
- [ ] Concurrent execution limiting
- [ ] Support for both `/path` and `/api/path` routes
- [ ] Region/metadata in `/info` response

---

## Compliance Testing

Use the official compliance test suite:

```bash
npx @tpmjs/executor-test https://my-executor.example.com
```

Output:

```
TPMJS Executor Compliance Test v1.0.0
Target: https://my-executor.example.com

Core Requirements:
  ✓ GET /health returns 200
  ✓ GET /health includes protocolVersion
  ✓ POST /execute-tool accepts valid request
  ✓ POST /execute-tool returns success response
  ✓ POST /execute-tool returns error for invalid tool
  ✓ CORS headers present
  ✓ OPTIONS preflight works

Standard Requirements:
  ✓ GET /info returns capabilities
  ✓ Authentication enforced when configured
  ✓ Execution timeout enforced
  ✗ Missing: maxExecutionTimeMs in capabilities

Result: 10/11 tests passed (Core: PASS, Standard: PARTIAL)
```

---

## Reference Implementations

| Name | Platform | Isolation | Source |
|------|----------|-----------|--------|
| Railway Executor | Railway | Process | `templates/railway-executor/` |
| Vercel Executor | Vercel | VM (Sandbox) | `templates/vercel-executor/` |
| Unsandbox Executor | Unsandbox | Container | `templates/unsandbox-executor/` |

---

## Future Roadmap

### v1.1 (Planned)

- Streaming responses (`Accept: text/event-stream`)
- Async execution with webhooks
- Caching hints (`X-TPMJS-Cache-*` headers)
- Tool validation endpoint

### v2.0 (Exploration)

- Multi-tool batch execution
- Persistent execution contexts
- Resource quotas and billing hooks
- MCP bridge protocol

---

## Changelog

### v1.0.0 (2026-02-03)

- Initial formal specification
- Core: `/health`, `/execute-tool`
- Standard: `/info`, API key auth
- Capability negotiation
- Compliance test suite

---

## Appendix: OpenAPI Specification

See `executor-openapi.yaml` for the formal OpenAPI 3.0 specification.

## Appendix: JSON Schemas

See `packages/types/src/executor.ts` for TypeScript types and Zod schemas.
