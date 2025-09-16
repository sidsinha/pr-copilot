/**
 * JIRA Ticket Details API
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import axios from 'axios';

/**
 * Get JIRA ticket details including title, description, status, and assignee
 */
export const get_jira_ticket_details = new DynamicStructuredTool({
  name: 'get_jira_ticket_details',
  description: 'Fetch detailed information about a JIRA ticket including title, description, status, assignee, and other metadata',
  schema: z.object({
    ticketId: z.string().describe('JIRA ticket ID (e.g., ABC-123, PROJECT-456)'),
  }),
  func: async ({ ticketId }) => {
    try {
      const jiraBaseUrl = "https://jira2.workday.com";

      // JIRA REST API endpoint for ticket details
      const jiraApiUrl = `${jiraBaseUrl}/rest/api/2/issue/${ticketId}`;
      
      // Bearer token authentication for JIRA
      const apiToken = process.env.JIRA_API_TOKEN;
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };

      if (apiToken) {
        headers['Authorization'] = `Bearer ${apiToken}`;
      }

      const response = await axios.get(jiraApiUrl, { headers });
      const issue = response.data;

      // Extract Figma links from description and other text fields
      const extractFigmaLinks = (text) => {
        if (!text) return [];
        const figmaRegex = /https?:\/\/(?:www\.)?figma\.com\/(?:file|design)\/[a-zA-Z0-9]+\/[^?\s]*/g;
        return text.match(figmaRegex) || [];
      };

      const description = issue.fields.description || 'No description provided';
      const summary = issue.fields.summary || '';
      const allText = `${summary} ${description}`;
      const figmaLinks = extractFigmaLinks(allText);

      // Extract relevant information
      const ticketDetails = {
        key: issue.key,
        summary: issue.fields.summary,
        description: description,
        status: issue.fields.status.name,
        priority: issue.fields.priority?.name || 'Not set',
        assignee: issue.fields.assignee?.displayName || 'Unassigned',
        reporter: issue.fields.reporter?.displayName || 'Unknown',
        issueType: issue.fields.issuetype.name,
        created: issue.fields.created,
        updated: issue.fields.updated,
        labels: issue.fields.labels || [],
        components: issue.fields.components?.map(c => c.name) || [],
        fixVersions: issue.fields.fixVersions?.map(v => v.name) || [],
        figmaLinks: figmaLinks,
        url: `${jiraBaseUrl}/browse/${ticketId}`
      };

      return {
        success: true,
        ticket: ticketDetails
      };

    } catch (error) {
      console.error('Failed to fetch JIRA ticket details:', error.message);
      
      // Return a fallback response with basic ticket info
      return {
        success: false,
        error: error.message,
        ticket: {
          key: ticketId,
          summary: `JIRA ticket ${ticketId}`,
          description: 'Unable to fetch ticket details from JIRA API',
          status: 'Unknown',
          figmaLinks: [],
          url: `https://jira2.workday.com/browse/${ticketId}`
        }
      };
    }
  }
});
