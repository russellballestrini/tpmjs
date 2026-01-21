# Omega PRD (Draft v0.1)

Project name: Omega  
Path: `/omega`  
Owner: TPMJS  
Status: Draft

## 1) Executive Summary
Omega is a TPMJS side project that demonstrates what happens when a single agent can discover and execute tools from the entire TPM registry. The vision is playful and bold: "the last robot/AI you ever need" (Skynet energy, but friendly). Omega will ship as a dedicated chat experience at `/omega` and a public REST API that lets anyone start and continue conversations. The product must highlight tool discovery, selection, and execution at scale, while handling missing credentials gracefully.

## 2) Problem Statement
TPMJS has powerful registry and tool execution capabilities, but the end-user experience does not yet show how these components combine into a single, continuous, tool-driven agent. Users need a simple way to:
- Ask for outcomes, not tools
- Watch the agent discover the right tool(s)
- Provide credentials only when needed
- Continue execution without restarting

## 3) Vision
Omega is a single agent with access to the TPM registry, able to choose and run the right tools to complete tasks. Users can chat or call an API and see a transparent, step-by-step tool workflow. It is a public showcase that can become a standalone product over time.

## 4) Goals and Success Metrics
### Goals
- Showcase tool discovery and execution at scale (1M+ tools).
- Deliver a great developer experience (DX) with simple API endpoints.
- Make credential handling safe, clear, and resumable.
- Provide a polished chat UI that is fast and transparent.

### Success Metrics (Early)
- Conversations created per week
- % conversations that use at least one tool
- Median time to first tool call
- Completion rate (user gets a result without abandoning)
- Avg. tool-call count per conversation
- User feedback: "felt like a real agent"

## 5) Non-Goals (v0)
- Multi-agent orchestration
- Enterprise SSO or complex permission tiers
- Guaranteed deterministic tool selection
- Complex billing or metering

## 6) Target Users and Use Cases
### Personas
- Developers evaluating TPMJS or building on it (primary for v0)
- Power users exploring tool chains
- Curious users experimenting with AI + tools

### Example Use Cases
- "Summarize a website and turn it into a checklist"
- "Analyze a CSV and generate insights"
- "Generate a proposal and send it via email"
- "Search for a tool to do X and run it"

## 7) Product Requirements

### 7.1 Chat UI (`/omega`)
- Landing intro before first chat
- New conversation
- Message stream with agent responses
- Tool activity panel (tool name, inputs, outputs, status)
- Debug mode (raw JSON) and "view raw" toggles for tool I/O
- Shareable conversation URL
- Requires login (v0)
- Credential prompt when missing env vars
- Resume execution after credentials are provided
- Planning panel for proposed plans (only when requested or task is complex)
- Cancel running tool execution or full conversation run
- Multi-user conversations: shared links allow anyone with URL to send messages
- Show participant display names and Gravatar avatars (email-based)
- Export conversation to JSON and Markdown
- Lazy-load long outputs and message history (Virtuoso-based)
- Auto-generate conversation title after first response
- System status banner (registry + executor health)
- Empty state includes creative sample prompts
- Light/dark theme supported (use TPMJS style guide)

### 7.2 REST API
Endpoints (initial):
- `POST /api/omega/conversations`  
  Create a conversation. Returns conversation ID and optional title.
- `POST /api/omega/conversations/:id/messages`  
  Send a message and stream response (SSE).
- `GET /api/omega/conversations/:id`  
  Fetch conversation history.
- `POST /api/omega/conversations/:id/credentials`  
  Provide missing env vars and resume.
- `POST /api/omega/conversations/:id/plan`  
  Optional: generate plan(s) without execution.
- API access requires TPMJS API key (standard user keys).
- Shared conversations accept either logged-in session or TPMJS API key.

### 7.3 Tool Discovery and Execution
- Agent can search registry and execute tools.
- Default path: registry search + execute tools (entire registry).
- Registry execution uses TPMJS sandbox executor.
- Allow tool usage transparency in UI and API responses.
- Allow users to pin preferred tools for the agent to prioritize.
- Pinned tools are always included in the plan/tool set.
- Max tool calls per message: 200 (AI SDK `maxSteps`).

### 7.6 System Prompt and Safety Controls
- Omega ships with a comprehensive default system prompt.
- Users can extend/override with a custom prompt in Omega settings.
- Safe Mode toggle: require explicit approval before tool execution (human-in-the-loop).

### 7.4 Planning
- Agent can propose one or more plans before running tools.
- Plans show tool order, purpose, expected outputs, and confidence.
- User can select a plan or ask for another.
- Planning can be auto-run for complex tasks or when explicitly requested.

### 7.5 Credentials / Missing Env Vars
- Detect missing env vars for tools.
- Pause execution when required env vars missing.
- Provide a credential prompt in UI (inline modal).
- Resume execution after credentials are supplied.
- Allow API callers to supply env vars in requests.
- Store credentials encrypted per-user in Omega settings.

## 8) UX Flows

### Flow A: Standard Chat
1. User sends a message.
2. Agent responds, streams tokens.
3. Tool calls appear in tool panel.
4. Tool results appear inline.
5. Conversation persists.

### Flow B: Missing Credentials
1. Tool requires env vars.
2. Agent pauses and returns `MISSING_ENV_VARS`.
3. UI displays required keys and descriptions.
4. User provides keys.
5. Execution resumes from same step.

### Flow C: Planning
1. User sends a request.
2. Agent responds with one or more plans.
3. User selects a plan or asks for changes.
4. Execution starts.

### Flow D: Tool Failure + Alternatives
1. Tool fails or missing credentials.
2. Agent searches for alternative tools.
3. Agent presents options and required keys in a table.
4. User selects a tool; execution resumes.

## 9) Data Model (High-Level)
- Conversation: id, userId (optional), createdAt, updatedAt, title
- Message: id, conversationId, role, content, createdAt
- ToolRun: id, conversationId, messageId, toolId, input, output, status, duration
- Plan: id, conversationId, messageId, steps, selectedPlanId, createdAt
- CredentialRequest: id, conversationId, toolRunId, requiredKeys, status, createdAt
- CredentialStore: userId, keyName, encryptedValue, scope (global/tool)

## 10) Security and Privacy
- Encrypt stored credentials at rest.
- Never expose full secret values in UI or logs.
- Redact secrets from tool outputs when needed.
- Rate limit API endpoints to prevent abuse.
- Log rate limit events (even if limits are effectively unlimited at launch).
- Audit logs for tool calls and credential access.

## 11) Technical Foundations (Reuse Existing)
From current codebase:
- Chat + SSE (agent conversations, tool-call streaming, message persistence):
  `apps/web/src/app/api/agents/[id]/conversation/[conversationId]/route.ts`
- Pretty URL variant for agent chat (API key scopes + owner/public checks):
  `apps/web/src/app/api/[username]/agents/[agentSlug]/conversation/[conversationId]/route.ts`
- Chat UI with tool panel + streaming + Virtuoso pagination:
  `apps/web/src/app/agents/[id]/chat/[chatId]/page.tsx`
- Tool execution wrapper + AI SDK tool definition builder:
  `apps/web/src/lib/ai-agent/tool-executor-agent.ts`
- Executor resolution + sandbox execution:
  `apps/web/src/lib/executors/index.ts`
- Registry meta-tools for search + execute:
  `packages/tools/registrySearch`, `packages/tools/registryExecute`
- Env var detection and missing var reporting:
  `apps/web/src/lib/agents/env-helpers.ts`
- Env var cascade and caller-provided env support:
  `apps/web/src/lib/agents/build-tools.ts`
- MCP handler with env-var validation for non-owners:
  `apps/web/src/lib/mcp/handlers.ts`
- Credential encryption utilities and API key storage:
  `apps/web/src/lib/crypto/api-keys.ts`, `apps/web/src/app/api/user/api-keys/route.ts`
- Existing planning tool for generatePlans:
  `packages/tools/official/tool-selection-plan`

## 12) Product Decisions (Initial)
- Primary audience: developers.
- Auth: login required (v0).
- Tool access: entire registry via registry search + execute.
- Model: default `gpt-4.1-mini`; users choose provider/model if they have keys.
- Planning: only on explicit request or when task complexity is high.
- Credentials: stored per-user, scoped to Omega, managed in Omega settings.
- Safety: no additional tool restrictions beyond existing TPMJS policies.
- Sharing: anyone with conversation URL can participate.
- Retention: conversations are stored indefinitely.
- Tool output: summarized by default with "view raw" toggle.
- Cancel: users can stop a running tool or full run.
- Rate limits: system in place, effectively unlimited at launch.
- Participants: show display names + Gravatar avatars.
- API auth: requires standard TPMJS API key.
- Tool selection UX: agent-only (no manual marketplace UI for v0).
- Files: uploads deferred to a later phase.
- Streaming: stream tool outputs where supported by the AI SDK.
- UI: follow TPMJS style guide (no bespoke theme for v0).
- Conversation IDs: UUIDs.
- Credentials: per-user only (no team/workspace creds in v0).
- Conversation context: keep full history (no auto-summarization in v0).
- Compliance: no special compliance requirements at launch.
- Tool budget indicator: not required.
- Shared conversation execution: only owner-stored credentials may run tools.
- Large outputs: lazy-load via virtualization.
- Export: JSON and Markdown supported.
- Memory: per-conversation only.
- Conversation titles: auto-generated after first response (AI SDK).
- Reactions: not required for v0.
- Tool reasoning: show only when model returns reasoning tokens.
- Deletion: users cannot delete conversations in v0.
- API keys: use existing TPMJS API keys only.
- Discovery: conversations are not listed; URL-only access.
- Context control: no reset button, use new chat instead.
- Tool allowlist: no allowlist (pins only).
- Audit/log retention: store all tool I/O indefinitely.
- Shared chat auth: accept session auth or TPMJS API key.
- Landing: intro view before first chat.
- Empty state: creative sample prompts.
- Theme: light/dark via style guide.

## 13) API Response Contracts (Draft)
### Missing Env Vars
```json
{
  "success": false,
  "error": "Missing required environment variables",
  "details": {
    "code": "MISSING_ENV_VARS",
    "missingVars": [
      { "name": "FIRECRAWL_API_KEY", "description": "API key for Firecrawl" }
    ],
    "hint": "Provide these variables in the 'env' field of your request"
  }
}
```

### Plan Response
```json
{
  "plan": [
    { "stepNumber": 1, "toolName": "registrySearchTool", "purpose": "Find tools for web scraping" },
    { "stepNumber": 2, "toolName": "registryExecuteTool", "purpose": "Run the chosen tool" }
  ],
  "confidence": 0.74,
  "reasoning": "Found 2 relevant tools for this task"
}
```

## 14) Performance and Reliability
- SSE streams should stay responsive under load.
- Tool execution timeouts (default 5 minutes).
- Concurrency controls per conversation.
- Circuit breaker for broken tools or executors.

## 15) Observability
- Log tool calls and errors.
- Track token usage per conversation.
- Surface tool success/failure rates.
- Store conversation logs for debugging.

## 16) Risks and Mitigations
- Tool quality variance: provide confidence and fallbacks.
- Missing credentials: pause/resume flow with clear UX.
- Abuse risk: rate limiting + auth.
- Tool execution cost: usage tracking + limits.

## 17) Rollout Plan
1. Internal alpha (team-only)
2. Public beta with rate limits
3. Full public launch

## 18) Open Questions
- System prompt ownership and defaults (versioning and updates)?
- Safe Mode default on/off?
- How many plans should Omega propose by default?
 - Webhook support for API events (future).
 - Profiles for system prompts (future).
