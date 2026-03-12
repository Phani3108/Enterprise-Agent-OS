# AgentOS Demo Videos

Executive presentation demos for AgentOS.

## Output Files

| File | Description |
|------|-------------|
| `agentos-screens-demo.mp4` | Platform walkthrough — Command Center, Personas, Marketplace, **Marketing** (extended), Observability, Governance |
| `agentos-guided-tour-demo.mp4` | Guided tour — 17-step persona-first walkthrough |

## How to Record

1. **Start the app** (in separate terminals):
   ```bash
   # Terminal 1 — Gateway (port 3000)
   cd services/gateway && npx tsx src/server.ts

   # Terminal 2 — Web (port 3010)
   cd apps/web && pnpm dev
   ```

2. **Install dependencies** (if needed):
   ```bash
   pip install playwright
   playwright install chromium
   ```

3. **Install ffmpeg** (for mp4 conversion):
   - macOS: `brew install ffmpeg`
   - Ubuntu: `apt install ffmpeg`

4. **Run the recorder**:
   ```bash
   python3 scripts/record-demos.py
   ```

   Options:
   - `--screens-only` — Record only the screens demo
   - `--tour-only` — Record only the guided tour demo

## Marketing Section Coverage

The screens demo spends extra time in Marketing:

- Command Center (workflow launch)
- Campaigns
- Content Studio
- Creative Studio
- Research Hub
- Analytics Hub
- Campaign Pipeline
- Projects & Graph
- Community
- Integrations
- Execution Timeline
