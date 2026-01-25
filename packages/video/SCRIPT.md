# TPMJS Marketing Video Script
## Duration: 5 minutes (300 seconds / 9000 frames @ 30fps)

---

## ACT 1: THE HOOK (0:00 - 0:30)

### Scene 1: Opening Impact (0:00 - 0:10)
**Visual:** Dark screen. Single copper accent line draws across. Text fades in.

**On Screen:**
```
What if every AI tool
was just one command away?
```

**Timing:** 3 seconds black → 7 seconds text reveal

---

### Scene 2: The Problem (0:10 - 0:30)
**Visual:** Fast montage of pain points with glitch/shake effects

**On Screen (rapid sequence):**
```
Building AI tools is painful.

❌ Write boilerplate for every tool
❌ No standard format
❌ Hard to discover
❌ Impossible to share
❌ Manual documentation
❌ Framework lock-in
```

**Transition:** Sharp cut to black

---

## ACT 2: THE SOLUTION (0:30 - 1:30)

### Scene 3: Introducing TPMJS (0:30 - 0:50)
**Visual:** Logo reveal with particle burst. Copper accent glow.

**On Screen:**
```
TPMJS
Tools Package Manager for JavaScript

The npm for AI tools.
```

**Voice-over concept:** "Meet TPMJS—the universal platform for AI tools."

---

### Scene 4: The Three Pillars (0:50 - 1:30)
**Visual:** Three cards animate in sequence, each with icon and description

**Card 1 (0:50 - 0:57):**
```
📦 DISCOVER
185+ tools ready to use
Auto-synced from npm every 2 minutes
```

**Card 2 (0:57 - 1:04):**
```
⚡ EXECUTE
Sandboxed runtime
42+ programming languages
```

**Card 3 (1:04 - 1:11):**
```
🔗 CONNECT
MCP Protocol
Works with Claude, GPT, Cursor & more
```

**Summary (1:11 - 1:30):**
```
One platform.
Every AI tool.
Any framework.
```

---

## ACT 3: HOW IT WORKS (1:30 - 3:00)

### Scene 5: Publishing a Tool (1:30 - 2:10)
**Visual:** Terminal/code editor aesthetic with typing animation

**On Screen:**
```
Publishing a tool takes 60 seconds.

Step 1: Add to package.json
─────────────────────────────
{
  "name": "my-tool",
  "keywords": ["tpmjs"],
  "tpmjs": {
    "category": "text-analysis",
    "description": "Analyzes sentiment"
  }
}

Step 2: Publish
─────────────────────────────
$ npm publish

✓ Tool live on tpmjs.com in 15 minutes
```

**Key message:** "That's it. No proprietary registry. Just npm."

---

### Scene 6: Using the CLI (2:10 - 2:40)
**Visual:** Terminal commands with real output

**On Screen:**
```
$ npm install -g @tpmjs/cli

$ tpm tool search "web scraping"
Found 12 tools:
  1. firecrawl-aisdk    ★★★★★  Web crawling & scraping
  2. page-brief         ★★★★☆  Summarize any webpage
  3. search             ★★★★☆  Web search integration

$ tpm tool execute firecrawl-aisdk
✓ Executing with default parameters...
✓ Result returned in 2.3s
```

**Transition:** Show CLI transforming into web UI

---

### Scene 7: The Web Platform (2:40 - 3:00)
**Visual:** tpmjs.com interface showcase - search, categories, tool cards

**On Screen:**
```
tpmjs.com

Browse 185+ tools
Filter by category
Sort by quality score
One-click MCP integration

[Visual: Tool cards with quality scores, categories, download counts]
```

---

## ACT 4: ADVANCED FEATURES (3:00 - 4:00)

### Scene 8: Collections (3:00 - 3:20)
**Visual:** Collection creation flow

**On Screen:**
```
COLLECTIONS
Curate your own tool sets

Create "Web Research Kit"
├── firecrawl-aisdk
├── page-brief
├── search
└── sentiment-analysis

Share as MCP endpoint:
https://tpmjs.com/api/mcp/you/web-research-kit/sse
```

---

### Scene 9: MCP Integration (3:20 - 3:40)
**Visual:** Config files for Claude Desktop and Cursor

**On Screen:**
```
INSTANT AI INTEGRATION

Claude Desktop:
{
  "mcpServers": {
    "tpmjs": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-remote",
        "https://tpmjs.com/api/mcp/ajax/ajax-collection/sse"]
    }
  }
}

One config. 185+ tools.
```

---

### Scene 10: Meet Omega (3:40 - 4:00)
**Visual:** Chat interface with Omega agent executing tools

**On Screen:**
```
OMEGA
Your AI assistant with access to every tool

User: "Analyze this CSV and create a summary report"

Omega: Planning execution...
  1. csv-parse → Parse the data
  2. linear-regression → Find trends
  3. executive-brief → Generate report

[Execute Plan]

✓ Task completed in 4.2 seconds
```

---

## ACT 5: THE ECOSYSTEM (4:00 - 4:30)

### Scene 11: Tool Categories (4:00 - 4:15)
**Visual:** Category grid with icons and counts

**On Screen:**
```
8 CATEGORIES OF TOOLS

📝 Text Analysis     │ 🔧 Code Generation
📊 Data Processing   │ 🖼️ Image Generation
🔊 Audio Processing  │ 🔍 Search
🔗 Integrations      │ ⚙️ Utilities

From sentiment analysis to code execution.
From web scraping to proposal writing.
```

---

### Scene 12: Security & Scale (4:15 - 4:30)
**Visual:** Shield icon, encryption visualization, metrics

**On Screen:**
```
ENTERPRISE READY

🔒 AES-256 encryption
🏖️ Sandboxed execution
📋 Full audit logging
🔑 API key scoping
🌐 Self-hostable

Performance:
• <2s first token latency
• <1s tool search
• 99.9% uptime
```

---

## ACT 6: CALL TO ACTION (4:30 - 5:00)

### Scene 13: Get Started (4:30 - 4:45)
**Visual:** Three paths with clear CTAs

**On Screen:**
```
GET STARTED IN 5 MINUTES

For Users:
$ npm install -g @tpmjs/cli
$ tpm tool search "your need"

For Publishers:
Add "tpmjs" keyword → npm publish

For Teams:
Create collections → Share MCP endpoint
```

---

### Scene 14: Closing (4:45 - 5:00)
**Visual:** Logo with tagline, URL prominent

**On Screen:**
```
TPMJS

Discover. Execute. Connect.

185+ tools. 42+ languages. Any AI framework.

tpmjs.com
github.com/tpmjs

Start building today.
```

**Final frame:** Logo holds for 3 seconds with subtle pulse animation

---

## DESIGN NOTES

### Color Palette (from TPMJS design system)
- Background: #0F0E0D (warm dark)
- Surface: #171514
- Primary/Accent: #C96A38 (copper)
- Text Primary: #E8E5E2
- Text Secondary: #9A9592
- Success: hsl(145 50% 45%)
- Error: hsl(0 60% 55%)

### Typography
- Headlines: Geist, 700 weight, -0.03em tracking
- Body: Geist, 400 weight
- Code: Geist Mono

### Animation Principles
- Base duration: 200ms
- Easing: cubic-bezier(0.4, 0, 0.2, 1)
- Spring animations for emphasis
- Sharp cuts between major sections (brutalist aesthetic)

### Visual Style
- Minimal border radius (brutalist)
- Generous whitespace
- Copper accent for CTAs and highlights
- Warm, earthy color temperature
- Subtle grain texture overlay

---

## FRAME BREAKDOWN

| Scene | Start | End | Frames | Duration |
|-------|-------|-----|--------|----------|
| 1. Opening | 0:00 | 0:10 | 0-300 | 10s |
| 2. Problem | 0:10 | 0:30 | 300-900 | 20s |
| 3. Intro | 0:30 | 0:50 | 900-1500 | 20s |
| 4. Pillars | 0:50 | 1:30 | 1500-2700 | 40s |
| 5. Publishing | 1:30 | 2:10 | 2700-3900 | 40s |
| 6. CLI | 2:10 | 2:40 | 3900-4800 | 30s |
| 7. Web | 2:40 | 3:00 | 4800-5400 | 20s |
| 8. Collections | 3:00 | 3:20 | 5400-6000 | 20s |
| 9. MCP | 3:20 | 3:40 | 6000-6600 | 20s |
| 10. Omega | 3:40 | 4:00 | 6600-7200 | 20s |
| 11. Categories | 4:00 | 4:15 | 7200-7650 | 15s |
| 12. Security | 4:15 | 4:30 | 7650-8100 | 15s |
| 13. Get Started | 4:30 | 4:45 | 8100-8550 | 15s |
| 14. Closing | 4:45 | 5:00 | 8550-9000 | 15s |

**Total: 9000 frames @ 30fps = 5 minutes**
