/**
 * GitHub Configuration
 */

import dotenv from 'dotenv';
dotenv.config();

export function getGitHubConfig() {
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const apiBase = process.env.GITHUB_API_BASE;
    const jiraBaseUrl = process.env.JIRA_BASE_URL;
    
    if (!token) {
        throw new Error('GITHUB_TOKEN environment variable is required');
    }
    
    if (!owner) {
        throw new Error('GITHUB_OWNER environment variable is required');
    }
    
    if (!apiBase) {
        throw new Error('GITHUB_API_BASE environment variable is required');
    }
    
    if (!jiraBaseUrl) {
        throw new Error('JIRA_BASE_URL environment variable is required');
    }
    
    const config = {
        token,
        owner,
        apiBase,
        jiraBaseUrl,
        isConfigured: true
    };
    
    return config;
}

export function validateGitHubConfig() {
    try {
        const config = getGitHubConfig();
        return {
            valid: true,
            message: 'GitHub configuration is valid',
            owner: config.owner
        };
    } catch (error) {
        return {
            valid: false,
            message: 'GitHub configuration error',
            error: error.message,
            instructions: [
                '1. Set GITHUB_TOKEN environment variable',
                '2. Set GITHUB_OWNER environment variable',
                '3. Set GITHUB_API_BASE environment variable',
                '4. Set JIRA_BASE_URL environment variable',
                '5. Restart the server'
            ]
        };
    }
}

export function getGitHubHeaders() {
    const config = getGitHubConfig();
    
    return {
        'Authorization': `token ${config.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'PR-CoPilot-Agent/1.0'
    };
}
