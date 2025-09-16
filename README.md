# PR CoPilot

AI-powered PR creation with GitHub integration and AI LLM support.

## Features

- MCP server for AI agents
- REST API for PR creation
- AI-generated PR summaries with JIRA ticket context
- JIRA ticket detection and API integration
- Code diff analysis

## Prerequisites

- Node.js 20.0.0+
- GitHub token with repo permissions
- AI LLM access

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

Create a `.env` file with the following variables (copy from `env.example`):

```env
# GitHub Configuration
GITHUB_TOKEN=your_github_token_here
GITHUB_OWNER=your_github_owner_here
GITHUB_API_BASE=https://api.github.com

# JIRA Configuration
JIRA_API_TOKEN=your_jira_api_token_here
JIRA_BASE_URL=https://your-company.atlassian.net

# AI Configuration
AI_USERNAME=your_ai_username_here
AI_BASE_URL=https://your-ai-service.com/api/v1/
AI_API_KEY=your_ai_api_key_here
AI_MODEL=your-ai-model-name

# Server Configuration
PORT=3000
DEFAULT_REPO=your-default-repo

# Security
NODE_TLS_REJECT_UNAUTHORIZED=0
```

**Required Environment Variables:**
- `GITHUB_TOKEN` - GitHub authentication token with repository permissions
- `GITHUB_OWNER` - Default repository owner
- `GITHUB_API_BASE` - GitHub API base URL
- `JIRA_BASE_URL` - JIRA base URL
- `AI_USERNAME` - AI service username for authentication
- `AI_BASE_URL` - AI service API base URL
- `AI_API_KEY` - AI service API key
- `AI_MODEL` - AI model name
- `PORT` - Server port
- `DEFAULT_REPO` - Default repository name

**Optional:**
- `JIRA_API_TOKEN` - JIRA API token for ticket integration

## Documentation

- [MCP Integration Guide](MCP_INTEGRATION.md) - Setup for AI agents
