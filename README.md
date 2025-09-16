# PR CoPilot

AI-powered PR creation with GitHub integration and CIS LLM support.

## Features

- MCP server for AI agents
- REST API for PR creation
- AI-generated PR summaries with JIRA ticket context
- JIRA ticket detection and API integration
- Code diff analysis

## Prerequisites

- Node.js 20.0.0+
- GitHub token with repo permissions
- CIS LLM access

## Setup

```bash
npm install
```

## Usage

```bash
npm run build  # Build the project
npm start      # Start the built MCP server
npm run mcp    # Run MCP server directly (development)
npm run api    # Run REST API server
```

## Configuration

Create a `.env` file with the following variables:

```env
GITHUB_TOKEN=your_github_token
GITHUB_OWNER=your-org
JIRA_API_TOKEN=your_jira_api_token
```

**Required:**
- `GITHUB_TOKEN` - GitHub authentication token with repository permissions

**Optional:**
- `GITHUB_OWNER` - Default repository owner (defaults to "wday-planning")
- `JIRA_API_TOKEN` - JIRA API token for ticket integration

## Documentation

- [MCP Integration Guide](MCP_INTEGRATION.md) - Setup for AI agents
