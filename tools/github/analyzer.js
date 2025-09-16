/**
 * Code diff analysis utilities
 */

import { generateDetailedSummary } from './summary.js';
import { extractJiraTickets, getJiraUrl } from './utils.js';

/**
 * Analyze code diff and generate enhanced PR description
 */
export const analyzeCodeDiff = async (owner, repo, head, base, token, body = "") => {
  try {
    const { getGitHubHeaders } = await import('./utils.js');
    const headers = getGitHubHeaders(token);
    
    // Get comparison between branches
    const { GITHUB_API_BASE } = await import('./utils.js');
    const compareUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/compare/${base}...${head}`;
    const { default: axios } = await import('axios');
    const compareResponse = await axios.get(compareUrl, { headers });
    const compareData = compareResponse.data;
    
    
    // Analyze files changed
    const filesChanged = compareData.files || [];
    const stats = compareData.stats || { additions: 0, deletions: 0, total: 0 };
    
    // Categorize file changes
    const newFiles = filesChanged.filter(f => f.status === 'added');
    const modifiedFiles = filesChanged.filter(f => f.status === 'modified');
    const deletedFiles = filesChanged.filter(f => f.status === 'removed');
    const renamedFiles = filesChanged.filter(f => f.status === 'renamed');
    
    // Analyze file types
    const fileTypes = {};
    filesChanged.forEach(file => {
      const ext = file.filename.split('.').pop() || 'no-extension';
      fileTypes[ext] = (fileTypes[ext] || 0) + 1;
    });
    
    // Generate enhanced description
    const branchJiraTickets = extractJiraTickets(head);
    
    // Generate detailed summary and motivation using LLM
    const { detailedSummary, keyChanges, motivationContext } = await generateDetailedSummary(filesChanged, stats, head, base, branchJiraTickets, body);
    
    // Extract JIRA tickets from description and branch name
    const jiraTicketsFromDescription = extractJiraTickets(detailedSummary);
    const jiraTicketsFromBranch = extractJiraTickets(head);
    const allJiraTickets = [...new Set([...jiraTicketsFromDescription, ...jiraTicketsFromBranch])];
    
    // Build JIRA ticket section and extract Figma links
    let jiraSection = "";
    let figmaSection = "";
    if (allJiraTickets.length > 0) {
      jiraSection = allJiraTickets.map(ticket => `- [${ticket}](${getJiraUrl(ticket)})`).join('\n');
      
      // Try to get Figma links from the first JIRA ticket
      try {
        const { get_jira_ticket_details } = await import('../jira/ticketDetails.js');
        const jiraResult = await get_jira_ticket_details.invoke({ ticketId: allJiraTickets[0] });
        if (jiraResult.success && jiraResult.ticket.figmaLinks && jiraResult.ticket.figmaLinks.length > 0) {
          figmaSection = jiraResult.ticket.figmaLinks.map(link => `- [Figma Design](${link})`).join('\n');
        }
      } catch (error) {
        console.warn('Failed to fetch Figma links from JIRA:', error.message);
      }
    } else {
      jiraSection = "<!-- Please add Jira Link here -->";
    }
    
    // Build file statistics and type analysis under same heading
    let changeAnalysis = `- **New Files Added:** ${newFiles.length}
- **Files Modified:** ${modifiedFiles.length}
- **Files Deleted:** ${deletedFiles.length}
- **Total Files Changed:** ${filesChanged.length}`;
    
    // Add file type analysis to the same section
    if (Object.keys(fileTypes).length > 0) {
      changeAnalysis += `\n\n**File Type Analysis:**
${Object.entries(fileTypes)
  .sort(([,a], [,b]) => b - a)
  .map(([ext, count]) => `- **.${ext}:** ${count} files`)
  .join('\n')}`;
    }
    
    // Use the new template format
    let enhancedDescription = `<!--- Provide a general summary of your changes in the Title above by starting with Jira Ticket -->

## Description:
${detailedSummary}

   ### Key Changes:
   ${keyChanges}

## Motivation and Context:
${motivationContext}

## Jira Ticket: 
${jiraSection}

${figmaSection ? `## Figma Links:
${figmaSection}

` : ''}## Screenshots:
| Before | After |
| ------ | ----- |
|--before-image--|--after-image-- |

## Change Analysis:
${changeAnalysis}

---

> 🤖 **Created by AI Agent** - This PR was automatically generated with enhanced analysis and formatting.`;
    
    return enhancedDescription;
    
  } catch (error) {
    console.warn('Failed to analyze code diff:', error.message);
    return `<!--- Provide a general summary of your changes in the Title above by starting with Jira Ticket -->

## Description:
This PR introduces changes from \`${head}\` to \`${base}\` branch.

*Note: Unable to analyze code diff automatically. Please review the changes manually.*

   ### Key Changes:
   • Modified files with additions and deletions

## Motivation and Context:
This change addresses the requirements specified in the JIRA ticket(s) mentioned below. The modifications improve system functionality and user experience.

## Jira Ticket: 
<!-- Please add Jira Link here -->

## Screenshots:
| Before | After |
| ------ | ----- |
|--before-image--|--after-image-- |

## Change Analysis:
- **New Files Added:** 0
- **Files Modified:** 0
- **Files Deleted:** 0
- **Total Files Changed:** 0


---

> 🤖 **Created by AI Agent** - This PR was automatically generated with enhanced analysis and formatting.`;
  }
};
