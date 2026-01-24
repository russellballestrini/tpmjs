# Omega PRD (Draft v0.2)

Project name: Omega
Path: `/omega`
Owner: TPMJS
Status: Draft
Last Updated: 2026-01-22

---

## 1) Executive Summary

Omega is a TPMJS flagship feature that demonstrates what happens when a single agent can discover and execute tools from the entire TPM registry (1M+ tools). The vision is playful and bold: "the last robot/AI you ever need" (Skynet energy, but friendly). Omega will ship as a dedicated chat experience at `/omega` and a public REST API that lets anyone start and continue conversations. The product must highlight tool discovery, selection, and execution at scale, while handling missing credentials gracefully.

**Key Differentiators:**
- Tool Search Tool pattern for 1M+ tool scale (85% context savings)
- Multi-user collaborative conversations with participant tracking
- Pause/resume execution flow for missing credentials
- Plan-then-execute architecture with user selection
- Full audit trail and observability

---

## 2) Problem Statement

TPMJS has powerful registry and tool execution capabilities, but the end-user experience does not yet show how these components combine into a single, continuous, tool-driven agent. Users need a simple way to:
- Ask for outcomes, not tools
- Watch the agent discover the right tool(s) from 1M+ options
- Provide credentials only when needed
- Continue execution without restarting
- Collaborate with others on complex tasks

---

## 3) Vision

Omega is a single agent with access to the TPM registry, able to choose and run the right tools to complete tasks. Users can chat or call an API and see a transparent, step-by-step tool workflow. It is a public showcase that can become a standalone product over time.

**Design Principles:**
1. **Least Agency** - Only grant the agent minimum autonomy required for the task
2. **Transparency** - Show every tool call, input, output, and reasoning
3. **Graceful Degradation** - Handle failures with alternatives and clear UX
4. **Context Efficiency** - Use Tool Search pattern to preserve context window

---

## 4) Goals and Success Metrics

### Goals
- Showcase tool discovery and execution at scale (1M+ tools)
- Deliver a great developer experience (DX) with simple API endpoints
- Make credential handling safe, clear, and resumable
- Provide a polished chat UI that is fast and transparent
- Enable collaborative conversations between multiple users

### Success Metrics (Early)
| Metric | Target |
|--------|--------|
| Conversations created per week | 100+ |
| % conversations that use at least one tool | >60% |
| Median time to first tool call | <10 seconds |
| Completion rate (user gets a result without abandoning) | >70% |
| Avg. tool-call count per conversation | 3-5 |
| User feedback: "felt like a real agent" | >80% positive |
| Tool execution success rate | >90% |
| P95 response latency (streaming start) | <2 seconds |

---

## 5) Non-Goals (v0)

- Multi-agent orchestration (single agent with tool access)
- Enterprise SSO or complex permission tiers
- Guaranteed deterministic tool selection
- Complex billing or metering
- File uploads (deferred to later phase)
- Cross-conversation memory (per-conversation only)
- Team/workspace credentials (per-user only)

---

## 6) Target Users and Use Cases

### Personas

| Persona | Description | Primary Use Cases |
|---------|-------------|-------------------|
| **Developers** (primary for v0) | Evaluating TPMJS or building on it | API testing, tool discovery, integration prototyping |
| **Power Users** | Exploring tool chains and automation | Complex multi-step tasks, workflow automation |
| **Curious Users** | Experimenting with AI + tools | General exploration, learning capabilities |

### Example Use Cases
- "Summarize a website and turn it into a checklist"
- "Analyze a CSV and generate insights"
- "Generate a proposal and send it via email"
- "Search for a tool to do X and run it"
- "Execute this Python code and show me the results"
- "Find all APIs that can translate text and compare their pricing"

---

## 7) Product Requirements

### 7.1 Chat UI (`/omega`)

#### Core Features
- Landing intro before first chat with creative sample prompts
- New conversation creation
- Message stream with agent responses
- Tool activity panel (tool name, inputs, outputs, status, duration)
- Debug mode (raw JSON) with "view raw" toggles for tool I/O
- Shareable conversation URL
- Requires login (v0)

#### Tool Execution Display
- Real-time tool status: pending → running → success/error
- Collapsible input/output JSON sections
- Duration display (ms/s) for each tool call
- Error messages with clear explanations
- Alternative tool suggestions on failure

#### Credential Handling
- Credential prompt when missing env vars (inline modal)
- Show required keys with descriptions
- Resume execution after credentials are provided
- Stored credentials encrypted per-user in Omega settings

#### Planning Panel
- Displayed only when requested or task is complex
- Shows tool order, purpose, expected outputs, confidence
- User can select a plan or ask for another
- Cost estimation before execution

#### Multi-User Support
- Shared links allow anyone with URL to send messages
- Show participant display names and Gravatar avatars (email-based)
- Clear attribution of who sent each message
- Only owner-stored credentials may run tools

#### Additional Features
- Cancel running tool execution or full conversation run
- Export conversation to JSON and Markdown
- Lazy-load long outputs and message history (Virtuoso-based)
- Auto-generate conversation title after first response
- System status banner (registry + executor health)
- Light/dark theme supported (use TPMJS style guide)

#### Control Transfer Indicators
- "Agent is thinking..."
- "Agent is executing tools..."
- "Waiting for your input..."
- "Agent wants approval to proceed..."

### 7.2 REST API

#### Endpoints (Initial)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/omega/conversations` | Create a conversation. Returns conversation ID and optional title. |
| `POST` | `/api/omega/conversations/:id/messages` | Send a message and stream response (SSE). |
| `GET` | `/api/omega/conversations/:id` | Fetch conversation history with pagination. |
| `POST` | `/api/omega/conversations/:id/credentials` | Provide missing env vars and resume. |
| `POST` | `/api/omega/conversations/:id/plan` | Generate plan(s) without execution. |
| `POST` | `/api/omega/conversations/:id/cancel` | Cancel running execution. |
| `DELETE` | `/api/omega/conversations/:id` | Delete a conversation (owner only). |

#### Authentication
- API access requires TPMJS API key (standard user keys)
- Shared conversations accept either logged-in session or TPMJS API key
- Separate scopes for read vs. execute operations

#### SSE Event Types (Granular Streaming)
```
message.delta          # Partial message content
run.step.started       # Step beginning
run.step.tool.started  # Tool execution starting
run.step.tool.delta    # Streaming tool output (if supported)
run.step.tool.completed # Tool finished
run.step.tool.failed   # Tool error
run.step.completed     # Step finished
run.requires_action    # Needs user input (credentials, approval)
run.completed          # Full run complete
run.failed             # Run failed
```

### 7.3 Tool Discovery and Execution

#### Tool Search Tool Pattern
Since Omega targets 1M+ tools, implement semantic tool discovery:
- Tools aren't loaded into context by default
- Agent queries a "tool search" meta-tool first
- Only relevant tools (top 10-20) are loaded for execution
- Preserves ~85% more context for the actual task

#### Execution Flow
- Default path: registry search + execute tools (entire registry)
- Registry execution uses TPMJS sandbox executor
- Allow tool usage transparency in UI and API responses
- Max tool calls per message: 200 (AI SDK `maxSteps`)

#### Tool Pinning & Preferences
- Allow users to pin preferred tools for the agent to prioritize
- Pinned tools are always included in search results
- Support negative pins (blocked tools never suggested)
- Tool preference ordering for ties

#### Parallel Execution
- Enable parallel tool execution when tools don't depend on each other
- Track dependencies between tool calls
- Merge results appropriately

### 7.4 Planning

#### Plan Generation
- Agent can propose one or more plans (default: 2-3) before running tools
- Plans show tool order, purpose, expected outputs, and confidence
- User can select a plan or ask for another
- Planning auto-runs for complex tasks or when explicitly requested

#### Plan Contents
```typescript
interface ExecutionPlan {
  steps: Array<{
    stepNumber: number;
    toolName: string;
    purpose: string;
    expectedOutputs: string;
    dependencies: number[];  // Step numbers this depends on
  }>;
  confidence: number;  // 0-1
  reasoning: string;
  estimatedTokens?: number;
  estimatedCostCents?: number;
  warnings?: string[];
}
```

#### Re-Planning
- If tool results are unexpected, agent can propose revised plan
- Track replan count and reasons
- User can force re-plan at any step

### 7.5 Credentials / Missing Env Vars

#### Detection & Pause
- Detect missing env vars for tools before execution
- Pause execution when required env vars missing
- Return structured `MISSING_ENV_VARS` response

#### Credential Prompt
- Provide a credential prompt in UI (inline modal)
- Show key name, description, and where to get it
- Resume execution after credentials are supplied
- Allow API callers to supply env vars in requests

#### Storage
- Store credentials encrypted per-user in Omega settings (AES-256-GCM)
- Scope credentials to Omega (separate from global user credentials)
- Support key rotation with grace period
- Never pass raw credentials to LLM context (use references)

### 7.6 System Prompt and Safety Controls

#### Default System Prompt
- Omega ships with a comprehensive default system prompt
- Versioned and updated independently of the product
- Users can extend/override with a custom prompt in Omega settings

#### Safe Mode
- Toggle: require explicit approval before tool execution (human-in-the-loop)
- Per-tool approval settings for high-risk operations:
  ```typescript
  {
    "requireApproval": {
      "all": false,
      "categories": ["destructive", "external_api"],
      "tools": ["deleteFile", "sendEmail", "makePayment"]
    }
  }
  ```

#### Proactiveness Slider (Future)
- **Conservative**: Ask before every tool call
- **Balanced**: Ask for destructive/external actions only (default)
- **Autonomous**: Only ask when credentials missing

---

## 8) UX Flows

### Flow A: Standard Chat
1. User sends a message
2. Agent searches registry for relevant tools (Tool Search Tool)
3. Agent responds with plan or starts execution
4. Tool calls appear in tool panel with real-time status
5. Tool results appear inline
6. Agent synthesizes final response
7. Conversation persists

### Flow B: Missing Credentials
1. Tool requires env vars
2. Agent pauses and returns `MISSING_ENV_VARS`
3. UI displays required keys with descriptions
4. User provides keys via modal
5. Execution resumes from same step
6. Tool executes with provided credentials

### Flow C: Planning
1. User sends a request
2. Agent generates 2-3 plans with confidence scores
3. UI displays plans with cost estimates
4. User selects a plan or asks for changes
5. Execution starts with selected plan
6. Progress tracked against plan steps

### Flow D: Tool Failure + Alternatives
1. Tool fails or returns error
2. Agent searches for alternative tools
3. Agent presents options and required keys in a table
4. User selects a tool or provides guidance
5. Execution resumes with alternative

### Flow E: Multi-User Collaboration
1. Owner creates conversation
2. Owner shares URL with collaborators
3. Collaborators join and see participant list
4. Any participant can send messages
5. Messages attributed to sender
6. Only participants with credentials can trigger tool execution

---

## 9) Data Model

### New Models Required

```prisma
// Multi-user support
model ConversationParticipant {
  id              String   @id @default(cuid())
  conversationId  String
  userId          String?
  apiKeyId        String?
  displayName     String   @db.VarChar(100)
  email           String?
  role            String   @default("collaborator") // owner, collaborator, viewer
  joinedAt        DateTime @default(now())

  @@unique([conversationId, userId, apiKeyId])
  @@index([conversationId])
}

// Tool execution audit trail
model ConversationToolRun {
  id              String   @id @default(cuid())
  conversationId  String
  messageId       String
  toolId          String?
  toolName        String   @db.VarChar(200)
  input           Json     @db.JsonB
  output          Json?    @db.JsonB
  error           String?  @db.Text
  errorType       String?  // timeout, auth, validation, execution
  status          String   @db.VarChar(20) // pending, running, success, error, timeout
  startedAt       DateTime @default(now())
  completedAt     DateTime?
  executionTimeMs Int?
  retryCount      Int      @default(0)
  inputTokens     Int?
  outputTokens    Int?
  estimatedCost   Decimal? @db.Decimal(10, 6)

  @@index([conversationId])
  @@index([status])
  @@index([toolName])
}

// Credential request tracking
model CredentialRequest {
  id              String   @id @default(cuid())
  conversationId  String
  toolRunId       String?
  userId          String?
  requiredKeys    Json     @db.JsonB // [{ name, description, url }]
  providedKeys    Json?    @db.JsonB
  status          String   @db.VarChar(20) // pending, provided, expired, cancelled
  expiresAt       DateTime?
  providedAt      DateTime?
  toolName        String?  @db.VarChar(200)
  createdAt       DateTime @default(now())

  @@index([conversationId])
  @@index([status])
}

// Plan storage
model ConversationPlan {
  id                    String   @id @default(cuid())
  conversationId        String
  messageId             String
  steps                 Json     @db.JsonB
  confidence            Float?
  reasoning             String?  @db.Text
  isSelected            Boolean  @default(false)
  selectedAt            DateTime?
  executionStartedAt    DateTime?
  executionCompletedAt  DateTime?
  executionStatus       String?  @db.VarChar(20)
  estimatedTokens       Int?
  estimatedCost         Decimal? @db.Decimal(10, 6)
  actualTokensUsed      Int?
  actualCost            Decimal? @db.Decimal(10, 6)
  successRate           Float?
  createdAt             DateTime @default(now())

  @@index([conversationId])
  @@index([isSelected])
}

// Omega user settings
model OmegaUserSettings {
  id                 String   @id @default(cuid())
  userId             String   @unique
  omegaEnvVars       Json?    @db.JsonB // Encrypted credentials
  pinnedToolIds      String[] @default([])
  blockedToolIds     String[] @default([])
  enableSafeMode     Boolean  @default(false)
  customSystemPrompt String?  @db.Text
  preferredModel     String?  @db.VarChar(100)
  preferredProvider  String?  @db.VarChar(50)
  autoGenerateTitle  Boolean  @default(true)
  showDebugMode      Boolean  @default(false)
  proactivenessLevel String   @default("balanced") // conservative, balanced, autonomous
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  @@index([userId])
}

// Security audit log
model OmegaAuditLog {
  id                String   @id @default(cuid())
  userId            String
  conversationId    String?
  eventType         String   @db.VarChar(50) // CREDENTIAL_ACCESS, TOOL_EXECUTED, etc.
  resourceType      String?
  resourceId        String?
  success           Boolean
  errorCode         String?
  metadata          Json?    @db.JsonB
  ipAddress         String?
  userAgent         String?
  previousEventHash String?
  eventHash         String
  createdAt         DateTime @default(now())

  @@index([userId])
  @@index([conversationId])
  @@index([eventType])
  @@index([createdAt])
}
```

### Extended Existing Models

```prisma
// Extend Message model
model Message {
  // ... existing fields ...
  authorId        String?
  authorEmail     String?
  authorName      String?

  // Relations
  toolRuns        ConversationToolRun[]
  plans           ConversationPlan[]
}

// Extend Conversation model
model Conversation {
  // ... existing fields ...
  executionState    String?  // idle, running, paused, cancelled
  currentMessageId  String?
  cancelledAt       DateTime?
  inputTokensTotal  Int      @default(0)
  outputTokensTotal Int      @default(0)
  costEstimate      Decimal? @db.Decimal(10, 6)

  // Relations
  participants       ConversationParticipant[]
  toolRuns           ConversationToolRun[]
  credentialRequests CredentialRequest[]
  plans              ConversationPlan[]
}
```

---

## 10) Security and Privacy

### Credential Security
- Encrypt stored credentials at rest (AES-256-GCM)
- Never expose full secret values in UI or logs
- Use credential references in LLM context, not raw values
- Output filtering for credential patterns before returning to users
- Credential isolation between users (no sharing in shared conversations)
- Session-scoped credentials that expire with conversation

### Tool Execution Security
- Execute tools in sandboxed environments with resource limits
- Plan-then-execute pattern (immutable plan, non-LLM executor)
- Input validation with injection pattern detection
- Output sanitization for all contexts (HTML, SQL, shell)
- Never execute LLM output directly as code without validation

### Rate Limiting
- Tiered limits by user tier (FREE: 100/hr, PRO: 1000/hr)
- Token-aware rate limiting for AI operations
- Cost-based limiting (weight by computational cost)
- Graceful degradation when approaching limits
- Log rate limit events for abuse detection

### Audit Logging
- Immutable, append-only logs with cryptographic chaining
- Required events: CREDENTIAL_ACCESS, TOOL_EXECUTED, AUTH_FAILURE, PERMISSION_CHANGED
- 7-year retention for compliance
- Real-time alerting for suspicious patterns

### Multi-User Security
- Only owner-stored credentials may run tools in shared conversations
- Every tool execution attributed to specific user
- Credential isolation (compromise of one user never cascades)
- Role-based permissions (owner, collaborator, viewer)

---

## 11) Technical Foundations (Reuse Existing)

### From Current Codebase

| Component | Location | Capability |
|-----------|----------|------------|
| Chat + SSE | `apps/web/src/app/api/agents/[id]/conversation/[conversationId]/route.ts` | Agent conversations, tool-call streaming, message persistence |
| Chat UI | `apps/playground/src/components/chat/` | MessageBubble, ChatMessages, streaming patterns |
| Tool Execution | `apps/web/src/lib/ai-agent/tool-executor-agent.ts` | AI SDK tool definition builder |
| Executor | `apps/web/src/lib/executors/index.ts` | Sandbox execution, custom executor support |
| Registry Tools | `packages/tools/registrySearch`, `registryExecute` | Search + execute from registry |
| Env Handling | `apps/web/src/lib/agents/env-helpers.ts`, `build-tools.ts` | Missing var detection, env cascade |
| MCP Handler | `apps/web/src/lib/mcp/handlers.ts` | Tool conversion, env validation |
| Encryption | `apps/web/src/lib/crypto/api-keys.ts` | AES-256-GCM encryption |
| Planning | `packages/tools/official/tool-selection-plan` | Plan generation |
| Rate Limiting | `apps/web/src/lib/rate-limit.ts` | Distributed rate limiting |
| Auth | `apps/web/src/lib/api-keys/middleware.ts` | Dual auth (session + API key) |

### UI Components Available

47 production-ready components in `@tpmjs/ui`:
- Forms: Input, Textarea, Select, Checkbox, Radio, Switch, Slider
- Display: Badge, Card, Table, CodeBlock, Icon (50+ icons)
- Feedback: Modal, Drawer, Toast, Skeleton, Spinner
- Navigation: Tabs, Breadcrumbs, Pagination
- Specialized: ToolCard, QualityScore, ActivityStream

### Key Dependencies
- `react-virtuoso` (v4.18.1) - For lazy-loading long conversations
- `streamdown` (v1.6.11) - Markdown rendering with streaming
- `@ai-sdk/react` - Chat hooks and streaming
- Vercel AI SDK - Tool execution and streaming

---

## 12) Product Decisions (Initial)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Primary audience | Developers | v0 focus on technical users |
| Auth | Login required | Security and attribution |
| Tool access | Entire registry via Tool Search Tool | Scale to 1M+ tools |
| Model | Default `gpt-4.1-mini`; users choose if they have keys | Balance cost and capability |
| Planning | Only on explicit request or high complexity | Avoid overhead for simple tasks |
| Credentials | Per-user, scoped to Omega | Isolation and security |
| Safety | No additional restrictions beyond TPMJS policies | Developer-focused |
| Sharing | Anyone with URL can participate | Collaboration |
| Retention | Conversations stored indefinitely | Auditability |
| Tool output | Summarized by default with "view raw" | Reduce noise |
| Cancel | Users can stop running tool or full run | Control |
| Rate limits | System in place, generous at launch | Growth |
| Participants | Show display names + Gravatar | Attribution |
| API auth | Standard TPMJS API keys | Simplicity |
| Tool selection | Agent-only (no manual marketplace UI) | Showcase AI |
| Files | Deferred to later phase | Scope |
| Streaming | Stream tool outputs where supported | Responsiveness |
| UI | TPMJS style guide (no bespoke theme) | Consistency |
| IDs | UUIDs | Standard |
| Context | Keep full history (no auto-summarization) | Accuracy |
| Deletion | Users can delete their conversations | Privacy |
| Audit logs | Store all tool I/O indefinitely | Compliance |

---

## 13) API Response Contracts (Draft)

### Missing Env Vars
```json
{
  "success": false,
  "error": "Missing required environment variables",
  "details": {
    "code": "MISSING_ENV_VARS",
    "conversationId": "conv_abc123",
    "toolRunId": "run_xyz789",
    "missingVars": [
      {
        "name": "FIRECRAWL_API_KEY",
        "description": "API key for Firecrawl web scraping",
        "url": "https://firecrawl.dev/api-keys"
      }
    ],
    "hint": "Provide these variables via POST /api/omega/conversations/:id/credentials"
  }
}
```

### Plan Response
```json
{
  "plans": [
    {
      "id": "plan_001",
      "steps": [
        { "stepNumber": 1, "toolName": "registrySearchTool", "purpose": "Find web scraping tools", "dependencies": [] },
        { "stepNumber": 2, "toolName": "firecrawl--scrape", "purpose": "Scrape the target URL", "dependencies": [1] },
        { "stepNumber": 3, "toolName": "openai--summarize", "purpose": "Summarize content", "dependencies": [2] }
      ],
      "confidence": 0.85,
      "reasoning": "Found 3 relevant tools for web scraping and summarization",
      "estimatedTokens": 4500,
      "estimatedCostCents": 3,
      "warnings": []
    },
    {
      "id": "plan_002",
      "steps": [
        { "stepNumber": 1, "toolName": "browser--fetch", "purpose": "Fetch page HTML", "dependencies": [] },
        { "stepNumber": 2, "toolName": "html--parse", "purpose": "Extract text content", "dependencies": [1] }
      ],
      "confidence": 0.72,
      "reasoning": "Alternative approach using basic fetch",
      "estimatedTokens": 2000,
      "estimatedCostCents": 1,
      "warnings": ["May not handle JavaScript-rendered content"]
    }
  ]
}
```

### Tool Execution Event (SSE)
```json
{
  "event": "run.step.tool.completed",
  "data": {
    "stepId": "step_001",
    "toolRunId": "run_xyz789",
    "toolName": "firecrawl--scrape",
    "status": "success",
    "executionTimeMs": 2340,
    "outputSummary": "Scraped 5 pages, extracted 12,000 characters",
    "outputFull": { ... },
    "tokensUsed": 450
  }
}
```

---

## 14) Performance and Reliability

### Response Times
| Operation | Target P50 | Target P95 |
|-----------|------------|------------|
| Conversation create | <200ms | <500ms |
| First token (streaming) | <1s | <2s |
| Tool search | <500ms | <1s |
| Tool execution | <5s | <30s |
| Plan generation | <2s | <5s |

### Reliability
- SSE streams should stay responsive under load
- Tool execution timeouts: default 5 minutes, per-tool configurable
- Concurrency controls per conversation (1 active execution)
- Circuit breaker for broken tools or executors
- Adaptive retry with exponential backoff + jitter for transient errors

### Graceful Degradation
- When rate limits approaching: reduce context window, use smaller model
- When tool fails: suggest alternatives, allow user override
- When executor unhealthy: queue requests, show status banner

---

## 15) Observability

### Metrics to Track
- Tool calls and errors (count, latency, success rate)
- Token usage per conversation (input/output breakdown)
- Tool success/failure rates by tool
- P50/P95/P99 latency per tool
- Conversation completion rate
- Credential request frequency
- Replan frequency

### OpenTelemetry Integration
Emit traces in OpenTelemetry format for export to:
- LangSmith
- Arize Phoenix
- Langfuse
- Custom observability stacks

### Logging
- Store conversation logs for debugging
- Tool I/O logged for audit trail
- Security events logged separately (immutable)

---

## 16) Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Tool quality variance | User frustration | Confidence scores, fallbacks, tool ratings |
| Missing credentials | Blocked execution | Clear pause/resume UX, credential storage |
| Abuse risk | Cost, reputation | Rate limiting, auth, monitoring |
| Tool execution cost | Financial | Usage tracking, limits, cost estimates |
| Prompt injection | Security | Input validation, output filtering, context isolation |
| Credential leakage | Security | Never pass raw creds to LLM, output scanning |
| Tool failures cascade | Poor UX | Circuit breakers, alternatives, graceful degradation |
| Context window exhaustion | Quality degradation | Tool Search Tool pattern, summarization |

---

## 17) Rollout Plan

### Phase 1: Internal Alpha (2 weeks)
- Core chat UI and API
- Tool search and execution
- Basic credential handling
- Team-only access

### Phase 2: Private Beta (4 weeks)
- Multi-user conversations
- Planning panel
- Full credential management
- Invite-only access with rate limits

### Phase 3: Public Beta (4 weeks)
- Full feature set
- Public access with rate limits
- Feedback collection
- Performance optimization

### Phase 4: General Availability
- Rate limits relaxed
- SLA commitments
- Documentation and tutorials
- Integration guides

---

## 18) Future Enhancements (Post-v0)

### High Priority
- **Webhooks** for API events (conversation.created, tool.completed, etc.)
- **Conversation branching** - Fork at any message to explore alternatives
- **Cost estimation UI** - Show estimated cost before execution
- **Execution timeout per-tool** - Configurable based on tool metadata

### Medium Priority
- **File uploads and handling** - Inline preview, versioning, type detection
- **Workflow/DAG view** - Visual tool execution graph
- **User-level persistent memory** - Remember preferences across conversations
- **Semantic search over history** - "What did we discuss about X?"

### Lower Priority
- **Conversation templates** - Pre-configured starting points
- **Multi-agent orchestration** - Specialist sub-agents for categories
- **mTLS for tool integrations** - High-security external services
- **Behavioral anomaly detection** - ML-based unusual pattern detection

---

## 19) Open Questions

1. **System prompt ownership** - How do we version and update the default system prompt?
2. **Safe Mode default** - Should Safe Mode be on or off by default?
3. **Number of plans** - How many plans should Omega propose by default (2? 3?)?
4. **Plan model differentiation** - Should planning use a premium model and execution use cheaper?
5. **Conversation discovery** - Should users be able to list their conversations, or URL-only?
6. **Tool blocklist scope** - Global blocklist vs. per-user vs. per-conversation?

---

## 20) Appendix: OWASP Agentic AI Security Checklist

Based on [OWASP Top 10 for Agentic Applications 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/):

| Risk | Implemented |
|------|-------------|
| ASI01: Agent Goal Hijack | [ ] Prompt injection defenses, context isolation |
| ASI02: Tool Misuse & Exploitation | [ ] Least privilege, sandboxing, approval flows |
| ASI03: Identity & Privilege Abuse | [ ] Short-lived credentials, task-scoped permissions |
| ASI04: Supply Chain Vulnerabilities | [ ] Tool verification, signed packages |
| ASI05: Unexpected Code Execution | [ ] Sandboxing, no eval(), output validation |
| ASI06: Memory & Context Poisoning | [ ] Isolated sessions, validated context |
| ASI07: Insecure Inter-Agent Communication | [ ] N/A (single agent in v0) |
| ASI08: Cascading Failures | [ ] Circuit breakers, graceful degradation |
| ASI09: Human-Agent Trust Exploitation | [ ] Clear agent identification, human-in-loop |
| ASI10: Rogue Agents | [ ] Monitoring, kill switches |

---

## 21) References

### Internal
- TPMJS Codebase: Agent conversation system, tool execution, MCP handlers
- Database Schema: `packages/db/prisma/schema.prisma`
- UI Components: `packages/ui/src/`

### External
- [OpenAI Assistants API](https://platform.openai.com/docs/assistants)
- [Anthropic Tool Use](https://www.anthropic.com/engineering/advanced-tool-use)
- [LangGraph Plan-and-Execute](https://langchain-ai.github.io/langgraph/tutorials/plan-and-execute/)
- [MCP Specification](https://modelcontextprotocol.io/specification/)
- [OWASP GenAI Security](https://genai.owasp.org/)
- [OWASP LLM Top 10](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
