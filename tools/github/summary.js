/**
 * LLM integration for GitHub tools
 */

import { getLLMClient } from "../../config/aiConfig.js";
import { get_jira_ticket_details } from "../jira/ticketDetails.js";

/**
 * Categorize file types for better context
 */
const getFileTypeCategory = (extension) => {
  const categories = {
    // Frontend
    'js': 'JavaScript',
    'jsx': 'React Component',
    'ts': 'TypeScript',
    'tsx': 'React TypeScript',
    'vue': 'Vue Component',
    'html': 'HTML',
    'css': 'CSS',
    'scss': 'SCSS',
    'sass': 'SASS',
    'less': 'LESS',
    
    // Backend
    'py': 'Python',
    'java': 'Java',
    'go': 'Go',
    'rs': 'Rust',
    'php': 'PHP',
    'rb': 'Ruby',
    'cs': 'C#',
    'cpp': 'C++',
    'c': 'C',
    
    // Configuration
    'json': 'JSON Config',
    'yaml': 'YAML Config',
    'yml': 'YAML Config',
    'xml': 'XML Config',
    'toml': 'TOML Config',
    'ini': 'INI Config',
    'env': 'Environment Config',
    'properties': 'Properties Config',
    
    // Documentation
    'md': 'Markdown',
    'txt': 'Text',
    'rst': 'reStructuredText',
    
    // Database
    'sql': 'SQL',
    'db': 'Database',
    
    // Build/Deploy
    'dockerfile': 'Docker',
    'sh': 'Shell Script',
    'bat': 'Batch Script',
    'ps1': 'PowerShell',
    
    // Other
    'lock': 'Lock File',
    'log': 'Log File'
  };
  
  return categories[extension.toLowerCase()] || `${extension.toUpperCase()} File`;
};

/**
 * Generate detailed summary and motivation context using AI LLM
 */
export const generateDetailedSummary = async (filesChanged, stats, head, base, jiraTickets, customBody = "") => {
  try {
    // Use existing AI LLM client
    const llm = getLLMClient();

    // Prepare context for LLM with more detailed file analysis
    const fileSummary = filesChanged.map(file => {
      const ext = file.filename.split('.').pop() || 'no-extension';
      const fileType = getFileTypeCategory(ext);
      return `- ${file.filename} (${file.status}, ${fileType}): +${file.additions}/-${file.deletions} lines`;
    }).join('\n');

    // Fetch JIRA ticket details for enhanced context
    let jiraContext = 'No JIRA tickets found in branch name';
    let jiraTicketDetails = '';
    
    if (jiraTickets.length > 0) {
      jiraContext = `JIRA Tickets: ${jiraTickets.join(', ')}`;
      
      // Fetch details for the first JIRA ticket (most relevant)
      const primaryTicket = jiraTickets[0];
      try {
        const jiraResult = await get_jira_ticket_details.invoke({ ticketId: primaryTicket });
        if (jiraResult.success) {
          const ticket = jiraResult.ticket;
          jiraTicketDetails = `
JIRA Ticket Details (${ticket.key}):
- Title: ${ticket.summary}
- Status: ${ticket.status}
- Priority: ${ticket.priority}
- Assignee: ${ticket.assignee}
- Issue Type: ${ticket.issueType}
- Description: ${ticket.description}
- Components: ${ticket.components.join(', ') || 'None'}
- Labels: ${ticket.labels.join(', ') || 'None'}
- Figma Links: ${ticket.figmaLinks && ticket.figmaLinks.length > 0 ? ticket.figmaLinks.join(', ') : 'None'}`;
        }
      } catch (error) {
        console.warn('Failed to fetch JIRA ticket details:', error.message);
        jiraTicketDetails = `\nJIRA Ticket: ${primaryTicket} (details unavailable)`;
      }
    }

    const customContext = customBody ? 
      `\nCustom Description Provided:\n${customBody}` : 
      '';

    // Generate description
    const descriptionPrompt = `You are an expert software engineer assistant. Your task is to write a concise description for the "Description:" section of a pull request.

Context:
- Branch: ${head} → ${base}
- Files Changed: ${filesChanged.length}
- Lines Added: +${stats.additions}
- Lines Deleted: -${stats.deletions}
- Net Change: ${stats.additions - stats.deletions}
- ${jiraContext}${jiraTicketDetails}${customContext}

Files Modified:
${fileSummary}

Please provide a concise description (2-3 sentences maximum) that:
   - Use the provided JIRA ticket details to understand the "why" and the business requirements.
   - Use the provided Git Diff to understand the "how" and the technical implementation.
   - Reference the JIRA ticket title and requirements when explaining the changes.
   - Incorporate any custom description provided above into the summary.
   - Write ONLY the content for the "Description:" section - do NOT include any markdown headers like "## Description:" or "## Summary:".
   - Do not make up information; base the description strictly on the context provided.
   - Keep it brief, focused, and professional.
   - Focus on the main purpose and impact of the changes.
   `;

    // Generate key changes
    const keyChangesPrompt = `You are an expert software engineer assistant. Your task is to write a detailed "Key Changes:" section for a pull request.

Context:
- Branch: ${head} → ${base}
- Files Changed: ${filesChanged.length}
- Lines Added: +${stats.additions}
- Lines Deleted: -${stats.deletions}
- Net Change: ${stats.additions - stats.deletions}
- ${jiraContext}${jiraTicketDetails}${customContext}

Files Modified:
${fileSummary}

Based on the specific files and changes above, provide a detailed bulleted list of key changes that:
   - Analyzes the file names, extensions, and change patterns to understand the technical scope
   - Correlates the file changes with the JIRA ticket requirements and business context
   - Describes specific features, functionality, and business value added
   - Explains what new capabilities, improvements, or fixes were implemented
   - References the JIRA ticket details (title, description, components, labels) to understand the business requirements
   - Groups related changes logically (e.g., "Frontend Updates", "API Changes", "Configuration Updates")
   - Provides context about the impact and scope of each change category
   - Avoids mentioning specific file names, line numbers, or technical implementation details
   - Write ONLY the bulleted list content - do NOT include "Key Changes:" header or any markdown headers
   - Use bullet points (• or -) to list each key change
   - Keep each point detailed but focused on user-facing features or business impact
   - Do not make up information; base the content strictly on the actual files and changes provided
   - Limit to 4-6 most important changes
   - Start directly with the first bullet point, no introductory text
   - Focus on "what" was added/improved and "why" it matters, not "how" it was implemented
   - Include specific details about the functionality being added or improved
   `;

    // Generate motivation context
    const motivationPrompt = `You are an expert software engineer assistant. Your task is to write a concise "Motivation and Context:" section for a pull request.

Context:
- Branch: ${head} → ${base}
- Files Changed: ${filesChanged.length}
- Lines Added: +${stats.additions}
- Lines Deleted: -${stats.deletions}
- Net Change: ${stats.additions - stats.deletions}
- ${jiraContext}${jiraTicketDetails}${customContext}

Files Modified:
${fileSummary}

Based on the specific files and changes above, provide a concise motivation and context (2-3 sentences maximum) that explains:
   - WHY is this specific change required? What business problem does it solve?
   - What specific functionality or capability is being added/improved?
   - What will be the immediate impact for users or the system?
   - Analyze the file names and changes to understand the actual purpose
   - Use the JIRA ticket details (title, description, status, priority) to understand the business requirements
   - Reference the JIRA ticket context when explaining the motivation
   - Write ONLY the content for the "Motivation and Context:" section - do NOT include any markdown headers
   - Keep it brief, direct, and focused on the specific changes being made
   - Do not make up information; base the content strictly on the actual files and changes provided
   `;

    // Make LLM calls sequential to avoid potential issues
    const descriptionResponse = await llm.invoke(descriptionPrompt);
    const keyChangesResponse = await llm.invoke(keyChangesPrompt);
    const motivationResponse = await llm.invoke(motivationPrompt);

    return {
      detailedSummary: descriptionResponse.content,
      keyChanges: keyChangesResponse.content,
      motivationContext: motivationResponse.content
    };
  } catch (error) {
    console.warn('Failed to generate LLM summary:', error.message);
    return {
      detailedSummary: `This PR introduces changes from \`${head}\` to \`${base}\` branch with ${filesChanged.length} files modified (${stats.additions} additions, ${stats.deletions} deletions).`,
      keyChanges: `• Modified ${filesChanged.length} files with ${stats.additions} additions and ${stats.deletions} deletions`,
      motivationContext: `This change addresses the requirements specified in the JIRA ticket(s) mentioned below. The modifications improve system functionality and user experience.`
    };
  }
};
