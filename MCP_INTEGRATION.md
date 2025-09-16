# MCP Integration for PR CoPilot

## Setup

1. Configure Cursor (`~/.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "pr-copilot": {
      "command": "/path/to/node",
      "args": [
        "--env-file",
        "/path/to/PR_CoPilot/.env",
        "/path/to/PR_CoPilot/dist/index.js"
      ]
    }
  }
}
```

2. Create a `.env` file in the PR_CoPilot directory with your configuration:
```env
GITHUB_TOKEN=your_github_token
GITHUB_OWNER=your-org
JIRA_API_TOKEN=your_jira_api_token
```

3. Restart Cursor to load the MCP configuration.

## Available Tools

### create_pull_request
- `repo`, `title`, `head`, `base` (required)
- `owner`, `body`, `draft`, `include_diff_analysis` (optional)

### get_repository_info
- `repo` (required)
- `owner` (optional)

### get_jira_ticket_details
- `ticketId` (required) - JIRA ticket ID (e.g., ABC-123, PROJECT-456)

### generate_pr_summary
- `repo`, `head`, `base` (required)
- `owner`, `title`, `body` (optional)

## Usage Examples

```
Create a PR for branch TICKET-12345-feature targeting develop
Get information about the your-repo repository
Create a draft PR for my feature branch
Get details for JIRA ticket TICKET-12345
Generate PR summary for feature-branch compared to main
```

