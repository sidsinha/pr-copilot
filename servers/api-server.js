// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

import path from "path";
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import { allTools, toolsMetadata } from "../tools/index.js";
import { getGitHubConfig, validateGitHubConfig } from "../config/githubConfig.js";

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

//@ts-ignore This allows us to connect to CIS. Make sure you're on the network
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Middleware
app.use(cors());
app.use(express.json());

// API-only server - no static files needed

// --- Configuration ---

// Default repository
const DEFAULT_REPO = "officeconnect-ui";

// --- GitHub Configuration ---
const githubConfig = getGitHubConfig();
const githubValidation = validateGitHubConfig();

// --- Routes ---

// API root endpoint
app.get('/', (req, res) => {
    res.json({
        message: "PR CoPilot API Server",
        version: "1.0.0",
        endpoints: {
            health: "GET /health",
            create_pr: "POST /create-pr",
            test_github: "POST /test-github",
            tools: "GET /tools"
        }
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        username: process.env.CIS_USERNAME || 'system',
        github: {
            configured: githubConfig.isConfigured,
            validation: githubValidation
        }
    });
});


// Test GitHub connectivity
app.post('/test-github', async (req, res) => {
    try {
        if (!githubConfig.isConfigured) {
            return res.status(400).json({
                success: false,
                error: "GitHub not configured",
                message: "Please set GITHUB_TOKEN environment variable",
                instructions: githubValidation.instructions
            });
        }

        const { owner = githubConfig.owner, repo = DEFAULT_REPO } = req.body;

        // Test by getting repository info
        const testTool = allTools.find(tool => tool.name === "get_repository_info");
        if (!testTool) {
            return res.status(500).json({
                success: false,
                error: "GitHub tool not found"
            });
        }

        const result = await testTool.invoke({ owner, repo });

        res.json({
            success: result.success,
            message: `GitHub connectivity test for ${owner}/${repo}`,
            result: result,
            github_config: {
                token_configured: !!githubConfig.token
            }
        });

    } catch (error) {
        console.error('GitHub connectivity test error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : String(error),
            message: "GitHub connectivity test failed"
        });
    }
});

// Create PR endpoint - triggers create_pull_request tool
app.post('/create-pr', async (req, res) => {
    try {
        if (!githubConfig.isConfigured) {
            return res.status(400).json({
                success: false,
                error: "GitHub not configured",
                message: "Please set GITHUB_TOKEN environment variable",
                instructions: githubValidation.instructions
            });
        }

        const { 
            owner = githubConfig.owner, 
            repo, 
            title, 
            head, 
            base, 
            body = "", 
            draft = false 
        } = req.body;

        if (!repo || !title || !head || !base) {
            return res.status(400).json({
                success: false,
                error: "Missing required parameters",
                message: "Please provide: repo, title, head, and base branch"
            });
        }

        // Use the existing create_pull_request tool
        const createPRTool = allTools.find(tool => tool.name === "create_pull_request");
        if (!createPRTool) {
            return res.status(500).json({
                success: false,
                error: "Create PR tool not found"
            });
        }

        const result = await createPRTool.invoke({
            owner,
            repo,
            title,
            head,
            base,
            body,
            draft
        });

        res.json({
            success: result.success,
            pull_request: result.pull_request,
            formatted_response: result.formatted_response,
            message: result.message,
            error: result.error
        });

    } catch (error) {
        console.error('Create PR error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : String(error),
            status: "❌ PR creation failed"
        });
    }
});

// Get available tools endpoint
app.get('/tools', (req, res) => {
    const tools = Object.values(toolsMetadata);
    res.json({
        available_tools: tools,
        total_tools: tools.length,
        categories: [...new Set(tools.map(tool => tool.category))],
        tools_by_category: tools.reduce((acc, tool) => {
            if (!acc[tool.category]) acc[tool.category] = [];
            acc[tool.category].push(tool);
            return acc;
        }, {})
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 LangChain Server running on port ${PORT}`);
    console.log(`📁 Server directory: ${__dirname}`);
    console.log(`🌐 API-only server - no client interface`);
    console.log(`\n📋 API Endpoints:`);
    console.log(`   GET  http://localhost:${PORT}/ - API info`);
    console.log(`   GET  http://localhost:${PORT}/health - Health check`);
    console.log(`   POST http://localhost:${PORT}/create-pr - Create GitHub PR`);
    console.log(`   POST http://localhost:${PORT}/test-github - Test GitHub connection`);
    console.log(`   GET  http://localhost:${PORT}/tools - Available tools`);
    console.log(`👤 Username: ${process.env.CIS_USERNAME || 'system'}`);
    
    // GitHub status
    if (githubConfig.isConfigured) {
        console.log(`🐙 GitHub: ✅ Configured (Token set)`);
    } else {
        console.log(`🐙 GitHub: ❌ Not configured - See GITHUB_SETUP.md for setup instructions`);
    }
    
    console.log(`\n💡 Use the API endpoints directly for GitHub operations!`);
    console.log(`📖 GitHub setup guide: GITHUB_SETUP.md`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
}); 