#!/usr/bin/env node

/**
 * MCP Server for PR Creation Tools
 * Exposes GitHub PR creation tools to AI agents via Model Context Protocol
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { create_pull_request, get_repository_info, generate_pr_summary } from '../tools/github/index.js';
import { get_jira_ticket_details } from '../tools/jira/index.js';
import { execSync } from 'child_process';

// Allow connection to AI service
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Tool configurations
const TOOLS = {
  create_pull_request: {
    name: 'create_pull_request',
    description: 'Create a new pull request on GitHub with enhanced description and analysis. Auto-detects current repository if owner/repo not specified.',
    schema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner (required)' },
        repo: { type: 'string', description: 'Repository name (required)' },
        title: { type: 'string', description: 'PR title (required)' },
        head: { type: 'string', description: 'Source branch (required)' },
        base: { type: 'string', description: 'Target branch (required)' },
        body: { type: 'string', description: 'Custom description (optional)' },
        draft: { type: 'boolean', description: 'Draft PR (optional, default: false)' },
        include_diff_analysis: { type: 'boolean', description: 'Include code analysis (optional, default: true)' },
      },
      required: ['repo', 'title', 'head', 'base'],
    },
    handler: create_pull_request
  },
  get_repository_info: {
    name: 'get_repository_info',
    description: 'Get repository information including branches and details. Auto-detects current repository if owner/repo not specified.',
    schema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner (required)' },
        repo: { type: 'string', description: 'Repository name (required)' },
      },
      required: ['repo'],
    },
    handler: get_repository_info
  },
  get_jira_ticket_details: {
    name: 'get_jira_ticket_details',
    description: 'Fetch detailed information about a JIRA ticket including title, description, status, assignee, and other metadata',
    schema: {
      type: 'object',
      properties: {
        ticketId: { type: 'string', description: 'JIRA ticket ID (e.g., ABC-123, PROJECT-456)' },
      },
      required: ['ticketId'],
    },
    handler: get_jira_ticket_details
  },
  generate_pr_summary: {
    name: 'generate_pr_summary',
    description: 'Generate a detailed PR summary for a branch comparison without creating the actual PR. Analyzes code changes, generates enhanced descriptions, and provides comprehensive analysis including JIRA ticket context, file changes, and impact assessment.',
    schema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner (required)' },
        repo: { type: 'string', description: 'Repository name (required)' },
        head: { type: 'string', description: 'Source branch (required)' },
        base: { type: 'string', description: 'Target branch (required)' },
        title: { type: 'string', description: 'Optional title for the PR (used for context in analysis)' },
        body: { type: 'string', description: 'Additional custom description for context in the analysis' },
      },
      required: ['repo', 'head', 'base'],
    },
    handler: generate_pr_summary
  }
};

// Create MCP server
const server = new Server(
  { name: 'pr-copilot-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// Helper function to detect current repository
function detectCurrentRepo() {
  try {
    const remoteUrl = execSync('git config --get remote.origin.url', { encoding: 'utf8' }).trim();
    const repoMatch = remoteUrl.match(/(?:github\.com|ghe\.[^\/]+\.com)[\/:]([^\/]+)\/([^\/]+?)(?:\.git)?$/);
    return repoMatch ? { owner: repoMatch[1], repo: repoMatch[2] } : null;
  } catch {
    return null;
  }
}

// Helper function to create response
function createResponse(data, isError = false) {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    ...(isError && { isError: true })
  };
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: Object.values(TOOLS).map(tool => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.schema
  }))
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Auto-detect repository if not specified
    const currentRepo = detectCurrentRepo();
    if (currentRepo && !args.owner && !args.repo) {
      args.owner = currentRepo.owner;
      args.repo = currentRepo.repo;
    }

    // Get tool handler
    const tool = TOOLS[name];
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }

    // Execute tool
    const result = await tool.handler.invoke(args);
    return createResponse(result);

  } catch (error) {
    return createResponse({ error: error.message }, true);
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('PR CoPilot MCP Server running on stdio');
  console.error('Available tools:', Object.keys(TOOLS).join(', '));
}

main().catch((error) => {
  console.error('MCP Server error:', error);
  process.exit(1);
});