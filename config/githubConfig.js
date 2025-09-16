/**
 * GitHub Configuration
 */

import dotenv from 'dotenv';
dotenv.config();

export function getGitHubConfig() {
    const config = {
        token: process.env.GITHUB_TOKEN,
        owner: process.env.GITHUB_OWNER || "wday-planning",
        apiBase: "https://ghe.megaleo.com/api/v3",
        jiraBaseUrl: "https://jira2.workday.com",
        isConfigured: !!process.env.GITHUB_TOKEN
    };
    
    if (!config.token) {
        console.warn('⚠️  GITHUB_TOKEN not found in environment variables');
    }
    
    return config;
}

export function validateGitHubConfig() {
    const config = getGitHubConfig();
    
    if (!config.isConfigured) {
        return {
            valid: false,
            message: 'GitHub token not configured',
            instructions: [
                '1. Go to https://ghe.megaleo.com/settings/tokens',
                '2. Generate new token with "repo" scope',
                '3. Set GITHUB_TOKEN environment variable',
                '4. Restart the server'
            ]
        };
    }
    
    return {
        valid: true,
        message: 'GitHub configuration is valid',
        owner: config.owner
    };
}

export function getGitHubHeaders() {
    const config = getGitHubConfig();
    
    if (!config.isConfigured) {
        throw new Error('GitHub token not configured');
    }
    
    return {
        'Authorization': `token ${config.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'PR-CoPilot-Agent/1.0'
    };
}
