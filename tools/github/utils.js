/**
 * GitHub and JIRA utility functions
 */

// Load environment variables (safety measure for when imported before main server)
import dotenv from 'dotenv';
dotenv.config();

// GitHub API configuration
export const GITHUB_API_BASE = "https://ghe.megaleo.com/api/v3";
export const DEFAULT_OWNER = process.env.GITHUB_OWNER || "wday-planning";

/**
 * Get GitHub headers for API requests
 */
export const getGitHubHeaders = (token) => ({
  'Authorization': `token ${token}`,
  'Accept': 'application/vnd.github.v3+json',
  'Content-Type': 'application/json'
});

/**
 * Validate GitHub token
 */
export const validateGitHubToken = () => {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return {
      success: false,
      error: "GitHub token not found. Please set GITHUB_TOKEN environment variable.",
      instructions: "To get a GitHub token: 1) Go to GitHub Settings > Developer settings > Personal access tokens, 2) Generate new token with 'repo' scope, 3) Set GITHUB_TOKEN environment variable"
    };
  }
  return { success: true, token };
};

/**
 * Handle GitHub API errors
 */
export const handleGitHubError = (error, operation) => {
  console.error(`Error ${operation}:`, error);
  
  if (error.response) {
    const status = error.response.status;
    const errorData = error.response.data;
    
    const errorMessages = {
      401: "Authentication failed. Check your GitHub token.",
      403: "Access forbidden. Token may lack required permissions.",
      404: "Repository not found or you don't have access to it.",
      422: "Validation failed. " + (errorData.message || "Check your parameters.")
    };
    
    return {
      success: false,
      error: `GitHub API error (${status}): ${errorMessages[status] || errorData.message || "Unknown error occurred."}`,
      details: errorData
    };
  }
  
  return {
    success: false,
    error: error.message || `Failed to ${operation}`
  };
};

/**
 * Extract JIRA ticket numbers from text
 */
export const extractJiraTickets = (text) => {
  // Common JIRA ticket patterns: ABC-123, PROJECT-456, TICKET-789
  // Updated pattern to handle various separators after ticket numbers including forward slashes
  const jiraPattern = /\b([A-Z][A-Z0-9]*-\d+)(?=[_\-\s\/]|$)/g;
  const matches = text.match(jiraPattern) || [];
  return [...new Set(matches)]; // Remove duplicates
};

/**
 * Generate JIRA URL for a ticket
 */
export const getJiraUrl = (ticket) => {
  // Hardcoded JIRA base URL
  const jiraBaseUrl = "https://jira2.workday.com";
  return `${jiraBaseUrl}/browse/${ticket}`;
};
