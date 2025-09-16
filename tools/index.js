/**
 * Tools index - exports GitHub tools only
 */

// Import and export GitHub tools
import { create_pull_request, get_repository_info } from './github/index.js';

// Export individual tools
export { create_pull_request, get_repository_info };

// Export array of all tools (GitHub only)
export const allTools = [
  create_pull_request,
  get_repository_info,
];

// Export tools metadata (GitHub only)
export const toolsMetadata = {
  create_pull_request: {
    name: "create_pull_request",
    description: "Create a new pull request on GitHub with enhanced description and analysis",
    category: "github",
    parameters: {
      owner: "Repository owner (required)",
      repo: "Repository name (required)",
      title: "PR title (required)",
      head: "Source branch (required)",
      base: "Target branch (required)",
      body: "Custom description (optional)",
      draft: "Draft PR (optional, default: false)",
      include_diff_analysis: "Include code analysis (optional, default: true)"
    }
  },
  get_repository_info: {
    name: "get_repository_info",
    description: "Get repository information including branches and details",
    category: "github",
    parameters: {
      owner: "Repository owner (required)",
      repo: "Repository name (required)"
    }
  }
};