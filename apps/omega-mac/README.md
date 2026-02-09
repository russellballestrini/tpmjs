# Omega Mac

Native macOS chat app powered by the [TPMJS tool registry](https://tpmjs.com) — 1M+ AI-ready tools at your fingertips.

Omega Mac is the desktop counterpart to the web-based Omega agent. It connects directly to the OpenAI API and the TPMJS registry to search, discover, and execute tools in a secure remote sandbox — all from a native SwiftUI interface.

## Requirements

- macOS 15 (Sequoia) or later
- Xcode 16+
- An OpenAI API key

## Getting Started

1. Open `Package.swift` in Xcode
2. Wait for Swift Package Manager to resolve dependencies
3. Build and run (Cmd+R)
4. Open Settings (Cmd+,) and enter your OpenAI API key
5. Press Cmd+N to start a new conversation

## How It Works

Omega Mac implements a full **agentic tool-use loop**:

```
User message
    → Auto-discover relevant tools (BM25 search against tpmjs.com)
    → Build tool list (registrySearch + registryExecute + discovered tools)
    → Stream OpenAI response
    → If tool calls returned:
        → Execute tools via remote sandbox (executor.tpmjs.com)
        → Feed results back to OpenAI
        → Loop (up to 10 iterations)
    → Display final response
```

### Two Core Tools

Every conversation has access to two meta-tools that unlock the entire registry:

- **registrySearch** — Search 1M+ tools by keyword. Returns tool IDs and metadata.
- **registryExecute** — Execute any tool by its ID. Runs in a secure remote sandbox.

When you send a message, Omega also auto-discovers relevant tools via BM25 search and injects them as directly-callable functions — so the AI can call them without going through registryExecute.

## Architecture

```
OmegaMac/
├── Models/              SwiftData persistence
│   ├── Conversation     Chat sessions with token tracking
│   ├── Message          User/assistant/tool messages with JSON tool call data
│   ├── ToolCallRecord   Individual tool execution records
│   ├── EnvVar           Environment variable metadata (values in Keychain)
│   └── UserSettings     Model selection, system prompt, pinned tools
├── Services/            Actor-based networking
│   ├── OpenAIService    Streaming chat completions via SSE
│   ├── StreamParser     Server-Sent Events line parser
│   ├── TPMJSRegistry    Tool search + remote execution
│   ├── KeychainService  Secure storage for API keys and env vars
│   └── ChatOrchestrator @Observable coordinator for the agentic loop
├── Views/               SwiftUI interface
│   ├── Sidebar/         Conversation list with @Query
│   ├── Chat/            Messages, input bar, streaming indicator
│   ├── Tools/           Tool call cards with collapsible JSON
│   ├── Settings/        API key, env vars, system prompt, model picker
│   └── Shared/          Markdown rendering, empty state
└── Utilities/           Tool name sanitization, system prompt builder
```

### Key Design Decisions

- **SwiftData** for local persistence — no server, no auth, everything on-device
- **Keychain** for secrets — API keys and env var values are encrypted at rest
- **Actors** for networking — `OpenAIService` and `TPMJSRegistryService` are actors for safe concurrent access
- **@Observable** — `ChatOrchestrator` drives all UI state with zero Combine boilerplate
- **Dark theme** by default — matches the web Omega aesthetic

## Settings

### API Key (required)

Your OpenAI API key is stored in the macOS Keychain. Omega Mac calls the OpenAI API directly — no proxy server.

### Model Selection

Choose from: `gpt-4.1-mini` (default), `gpt-4.1`, `gpt-4.1-nano`, `gpt-4o`, `gpt-4o-mini`, `o4-mini`.

### Environment Variables

Many tools in the TPMJS registry require API keys (e.g., `WEATHER_API_KEY`, `GITHUB_TOKEN`). Add them in Settings → Environment. Values are stored in Keychain; only key names and last-4-char hints are visible in the app.

All stored env vars are automatically passed to every tool execution.

### Custom System Prompt

Append custom instructions to Omega's default system prompt. Useful for constraining behavior, adding domain context, or specifying preferred tools.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd+N | New conversation |
| Cmd+, | Open settings |
| Enter | Send message |
| Shift+Enter | New line in input |

## Dependencies

- [MarkdownUI](https://github.com/gonzalezreal/swift-markdown-ui) — GitHub-flavored markdown rendering
- Everything else uses Apple frameworks (SwiftUI, SwiftData, Security, Foundation)

## Relationship to Web Omega

This app ports the core logic from the web implementation at `apps/web/src/app/api/omega/`. The agentic loop, system prompt, tool name sanitization, and search/execute flow are all faithful Swift translations of the TypeScript originals. The key difference is that web Omega uses server-side auth and a database, while Omega Mac stores everything locally with SwiftData and Keychain.
