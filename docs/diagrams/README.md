# TPMJS Architecture Diagrams

Visual documentation of the TPMJS system architecture, optimized for quick understanding.

## Diagram Index

| Diagram | Purpose | View |
|---------|---------|------|
| [System Overview](./01-overview.svg) | 10-second understanding of TPMJS | [SVG](./01-overview.svg) |
| [Tool Discovery](./02-discovery.svg) | How npm packages become tools | [SVG](./02-discovery.svg) |
| [Tool Execution](./03-execution.svg) | How tools get called and run | [SVG](./03-execution.svg) |
| [Data Model](./04-data-model.svg) | Database domain groups | [SVG](./04-data-model.svg) |

---

## 1. System Overview

**Purpose:** Understand what TPMJS is at a glance.

![System Overview](./01-overview.svg)

**Flow:** Inputs → TPMJS Core → Execution → Outputs

- **Inputs:** npm Registry, AI Clients, Web Users, Bridge CLI (WIP)
- **Core:** API Gateway, Tool Registry, Schema Pipeline
- **Execution:** AI Agents, Executor (Railway)
- **Outputs:** Tool Results, MCP Responses, SSE Streams

---

## 2. Tool Discovery Flow

**Purpose:** Show how npm packages become TPMJS tools (Hero Path).

![Tool Discovery](./02-discovery.svg)

**Flow:** npm Registry → Sync Workers → Schema Extraction → Tool Registry → Available

1. **npm Registry** - Packages with `tpmjs` keyword
2. **Sync Workers** - Changes feed (2 min), Keyword search (15 min), Metrics (hourly)
3. **Schema Extraction** - Import via esm.sh, Extract schema, AI assist, Convert to Zod
4. **Tool Registry** - Database storage (Package + Tool tables)
5. **Available** - Web UI, MCP Protocol, REST API

---

## 3. Tool Execution Flow

**Purpose:** Show how tools get called and executed via two paths.

![Tool Execution](./03-execution.svg)

**Path A (Web Playground):**
```
User Prompt → AI Agent → Tool Schema → Executor → SSE Response
```

**Path B (MCP Protocol):**
```
AI Client → JSON-RPC → MCP Handler → Executor → JSON-RPC Response
```

Both paths converge at the **Executor** which handles:
- Resolution (Agent → Collection → Default)
- Railway execution (POST /execute-tool)
- Dynamic import via esm.sh

---

## 4. Data Model

**Purpose:** Database structure reference (domain groups, not individual tables).

![Data Model](./04-data-model.svg)

**6 Domain Groups:**

| Group | Contains |
|-------|----------|
| Packages & Tools | Package, Tool, ToolVersion |
| Users & Auth | User, Session, Account, APIKey |
| Agents & Chats | Agent, Chat, Message, Prompt |
| Collections | Collection, CollectionTool |
| Execution & Usage | Execution, Usage, Feedback |
| Sync & Scenarios | SyncCheckpoint, SyncLog, Scenario |

---

## Visual Legend

### Arrow Styles
| Style | Meaning |
|-------|---------|
| **Solid →** | Synchronous request/response |
| **Dashed ⇢** | Async, event, or cron job |
| **Dotted ··→** | WIP / Future feature |

### Color Coding
| Color | Domain |
|-------|--------|
| Blue | API / Gateway |
| Green | Database / Storage |
| Orange | External Services |
| Purple | AI / LLM |
| Pink | Execution |
| Gray | WIP Features |

---

## Editing Diagrams

Diagrams are written in [D2](https://d2lang.com/) and rendered to SVG.

### Prerequisites
```bash
# Install D2
brew install d2
```

### Render a diagram
```bash
cd docs/diagrams
d2 01-overview.d2 01-overview.svg --layout=elk
```

### Render all diagrams
```bash
for f in *.d2; do d2 "$f" "${f%.d2}.svg" --layout=elk; done
```

### Source Files
- `01-overview.d2` - System Overview
- `02-discovery.d2` - Tool Discovery Flow
- `03-execution.d2` - Tool Execution Flow
- `04-data-model.d2` - Data Model

---

## Version History

- **v2** (Current) - Split into 4 focused diagrams, left-to-right flow
- **v1** - Single comprehensive diagram (archived as `../architecture-v1.d2`)
