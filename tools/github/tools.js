/**
 * GitHub tools for creating pull requests and managing repositories
 */

import { z } from "zod";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { validateGitHubToken, handleGitHubError, getGitHubHeaders, GITHUB_API_BASE, DEFAULT_OWNER } from './utils.js';
import { analyzeCodeDiff } from './analyzer.js';

/**
 * Create a new pull request on GitHub with enhanced description
 */
export const create_pull_request = new DynamicStructuredTool({
  name: "create_pull_request",
  description: "Create a new pull request on GitHub with enhanced description including code diff analysis, change statistics, and review checklist. Requires GitHub token for authentication. Returns formatted response that should be displayed directly to the user without modification.",
  schema: z.object({
    owner: z.string().optional().describe(`The owner of the repository (username or organization). Defaults to '${DEFAULT_OWNER}' if not specified.`),
    repo: z.string().describe("The name of the repository"),
    title: z.string().describe("The title of the pull request"),
    head: z.string().describe("The branch containing the changes you want to merge"),
    base: z.string().describe("The branch you want the changes pulled into (usually 'main' or 'master')"),
    body: z.string().optional().describe("Additional custom description for the pull request (will be prepended to auto-generated content)"),
    draft: z.boolean().optional().describe("Whether this should be a draft pull request (default: false)"),
    include_diff_analysis: z.boolean().optional().describe("Whether to include automatic code diff analysis in the PR description (default: true)")
  }),
  func: async ({ owner = DEFAULT_OWNER, repo, title, head, base, body = "", draft = false, include_diff_analysis = true }) => {
    const tokenValidation = validateGitHubToken();
    if (!tokenValidation.success) return tokenValidation;

    try {
      let finalBody = body;
      
      // Add enhanced description if requested
      if (include_diff_analysis) {
        const enhancedDescription = await analyzeCodeDiff(owner, repo, head, base, tokenValidation.token, body);
        finalBody = enhancedDescription;
      }

      console.log(`Final body: ${finalBody}`);
      
      // Add AI Agent signature to title
      const aiSignature = " 🤖";
      const finalTitle = title.endsWith(aiSignature) ? title : `${title}${aiSignature}`;
      
      const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls`;
      const payload = { title: finalTitle, head, base, body: finalBody, draft };

      console.log(`Creating enhanced PR for ${owner}/${repo}: ${finalTitle} (${head} → ${base})`);

      const { default: axios } = await import('axios');
      const response = await axios.post(url, payload, {
        headers: getGitHubHeaders(tokenValidation.token)
      });

      const pr = response.data;

      return {
        success: true,
        pull_request: {
          number: pr.number,
          title: pr.title,
          url: pr.html_url,
          state: pr.state,
          draft: pr.draft,
          head: pr.head.ref,
          base: pr.base.ref,
          created_at: pr.created_at,
          user: pr.user.login,
          body_length: finalBody.length,
          includes_diff_analysis: include_diff_analysis
        },
        formatted_response: `🎉 **Enhanced Pull Request Created Successfully!**

📋 **PR Details:**
- **Number:** #${pr.number}
- **Title:** ${pr.title}
- **Status:** ${pr.state} ${pr.draft ? '(Draft)' : ''}
- **From:** \`${pr.head.ref}\` → **To:** \`${pr.base.ref}\`
- **Author:** ${pr.user.login}
- **Created:** ${new Date(pr.created_at).toLocaleString()}
- **Description Length:** ${finalBody.length} characters
- **Includes Diff Analysis:** ${include_diff_analysis ? 'Yes' : 'No'}

🔗 **Links:**
- **View PR:** ${pr.html_url}
- **Repository:** ${pr.html_url.replace(/\/pull\/.*/, '')}

✨ **Enhanced Features:**
- 📊 Automatic code diff analysis
- 📈 File type analysis
- 🎫 JIRA ticket links
- ✅ Review checklist

💡 **Next Steps:**
- Review the enhanced PR description
- Check the automated analysis
- Add reviewers if needed
- Merge when ready`,
        message: `Successfully created enhanced pull request #${pr.number}: "${pr.title}" with ${include_diff_analysis ? 'automatic diff analysis' : 'custom description'}`
      };

    } catch (error) {
      return handleGitHubError(error, 'create pull request');
    }
  }
});

/**
 * Get repository information
 */
export const get_repository_info = new DynamicStructuredTool({
  name: "get_repository_info",
  description: "Get information about a GitHub repository including branches, default branch, and recent commits. Returns a pre-formatted response with emojis and structure that should be displayed exactly as-is to the user. Do not summarize or modify this response.",
  schema: z.object({
    owner: z.string().optional().describe(`The owner of the repository (username or organization). Defaults to '${DEFAULT_OWNER}' if not specified.`),
    repo: z.string().describe("The name of the repository")
  }),
  func: async ({ owner = DEFAULT_OWNER, repo }) => {
    const tokenValidation = validateGitHubToken();
    if (!tokenValidation.success) return tokenValidation;

    try {
      const [repoUrl, branchesUrl] = [
        `${GITHUB_API_BASE}/repos/${owner}/${repo}`,
        `${GITHUB_API_BASE}/repos/${owner}/${repo}/branches`
      ];
      
      const headers = getGitHubHeaders(tokenValidation.token);
      const { default: axios } = await import('axios');
      const [repoResponse, branchesResponse] = await Promise.all([
        axios.get(repoUrl, { headers }),
        axios.get(branchesUrl, { headers })
      ]);

      const repoData = repoResponse.data;
      const branches = branchesResponse.data;
      const branchNames = branches.map(branch => `  - ${branch.name}`).join('\n');
      
      const formattedResponse = `✅ Repository Information for ${repoData.full_name}:

📁 **Repository Details:**
- **Name:** ${repoData.name}
- **Description:** ${repoData.description || 'No description'}
- **Default Branch:** ${repoData.default_branch}
- **Private:** ${repoData.private ? 'Yes' : 'No'}

🔗 **URLs:**
- **Repository:** ${repoData.html_url}
- **Clone URL:** ${repoData.clone_url}

🌿 **Available Branches (${branches.length} total):**
${branchNames}

💡 **Quick Actions:**
- View repository: ${repoData.html_url}
- Clone repository: \`git clone ${repoData.clone_url}\``;

      return {
        success: true,
        repository: {
          name: repoData.name,
          full_name: repoData.full_name,
          description: repoData.description,
          default_branch: repoData.default_branch,
          private: repoData.private,
          html_url: repoData.html_url,
          clone_url: repoData.clone_url,
          branches: branches.map(branch => ({
            name: branch.name,
            protected: branch.protected
          }))
        },
        formatted_response: formattedResponse,
        message: formattedResponse
      };

    } catch (error) {
      return handleGitHubError(error, 'get repository information');
    }
  }
});

/**
 * Generate PR summary for a branch comparison
 */
export const generate_pr_summary = new DynamicStructuredTool({
  name: "generate_pr_summary",
  description: "Generate a detailed PR summary for a branch comparison without creating the actual PR. This tool analyzes code changes, generates enhanced descriptions, and provides comprehensive analysis including JIRA ticket context, file changes, and impact assessment. Returns formatted response that should be displayed directly to the user.",
  schema: z.object({
    owner: z.string().optional().describe(`The owner of the repository (username or organization). Defaults to '${DEFAULT_OWNER}' if not specified.`),
    repo: z.string().describe("The name of the repository"),
    head: z.string().describe("The branch containing the changes you want to analyze"),
    base: z.string().describe("The branch you want to compare against (usually 'main' or 'master')"),
    title: z.string().optional().describe("Optional title for the PR (used for context in analysis)"),
    body: z.string().optional().describe("Additional custom description for context in the analysis")
  }),
  func: async ({ owner = DEFAULT_OWNER, repo, head, base, title = "", body = "" }) => {
    const tokenValidation = validateGitHubToken();
    if (!tokenValidation.success) return tokenValidation;

    try {
      // Generate enhanced description using existing logic
      const enhancedDescription = await analyzeCodeDiff(owner, repo, head, base, tokenValidation.token, body);
      
      // Get additional repository context
      const repoUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}`;
      const headers = getGitHubHeaders(tokenValidation.token);
      const { default: axios } = await import('axios');
      const repoResponse = await axios.get(repoUrl, { headers });
      const repoData = repoResponse.data;

      // Generate a suggested title if not provided
      const suggestedTitle = title || `Update from ${head} to ${base}`;

      const formattedResponse = `📋 **PR Summary Generated Successfully!**

🎯 **Analysis Details:**
- **Repository:** ${repoData.full_name}
- **Comparison:** \`${head}\` → \`${base}\`
- **Suggested Title:** ${suggestedTitle}
- **Analysis Generated:** ${new Date().toLocaleString()}

---

## 📝 **Generated PR Description:**

${enhancedDescription}

---

💡 **Next Steps:**
- Review the generated description above
- Use this analysis to create the actual PR if needed
- Customize the title and description as required
- The analysis includes JIRA ticket context, file changes, and impact assessment

🔗 **Repository Links:**
- **Repository:** ${repoData.html_url}
- **Compare View:** ${repoData.html_url}/compare/${base}...${head}`;

      return {
        success: true,
        summary: {
          repository: repoData.full_name,
          head_branch: head,
          base_branch: base,
          suggested_title: suggestedTitle,
          generated_description: enhancedDescription,
          analysis_timestamp: new Date().toISOString()
        },
        formatted_response: formattedResponse,
        message: `Successfully generated PR summary for ${owner}/${repo}: ${head} → ${base}`
      };

    } catch (error) {
      return handleGitHubError(error, 'generate PR summary');
    }
  }
});
