# Marketing Subdomain Deployment

The Marketing module can be deployed under a dedicated subdomain (e.g. `marketing.agentos.com`) while using the main AgentOS backend.

## Configuration

1. **Backend URL**: Set `NEXT_PUBLIC_GATEWAY_URL` to the main AgentOS gateway (e.g. `https://api.agentos.com`). The Marketing UI will call all APIs from this backend.

2. **Base Path** (optional): If serving Marketing UI from a path like `https://app.agentos.com/marketing`, uncomment and set `basePath: '/marketing'` in `apps/web/next.config.mjs`.

3. **Subdomain**: For `marketing.agentos.com`, deploy the Marketing app as a separate Next.js build. Configure your routing to serve the Marketing app for that subdomain.

## Environment Variables

```env
NEXT_PUBLIC_GATEWAY_URL=https://api.agentos.com
# Optional: MARKETING_SUBDOMAIN=true for basePath
```

## Architecture

- Marketing UI: Next.js app (can be deployed to marketing subdomain)
- Backend: Main AgentOS gateway (shared)
- All marketing workflows, executions, and analytics flow through the same backend
