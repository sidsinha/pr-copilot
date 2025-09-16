#!/usr/bin/env node

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const distPath = join(projectRoot, 'dist');

// Create the main entrypoint file
const entrypointContent = `#!/usr/bin/env node

/**
 * PR CoPilot MCP Server Entrypoint
 * Generated entrypoint for the MCP server
 */

import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Start the MCP server
const serverPath = join(__dirname, 'servers', 'mcp-server.js');

console.log('🚀 Starting PR CoPilot MCP Server...');
console.log('📁 Server path:', serverPath);

const child = spawn('node', [serverPath], {
  stdio: 'inherit',
  cwd: __dirname
});

child.on('error', (error) => {
  console.error('❌ Failed to start MCP server:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  console.log(\`📊 MCP server exited with code: \${code}\`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\\n🛑 Shutting down MCP server...');
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\\n🛑 Shutting down MCP server...');
  child.kill('SIGTERM');
});
`;

// Write the entrypoint file
const entrypointPath = join(distPath, 'index.js');
writeFileSync(entrypointPath, entrypointContent, 'utf8');

// Make it executable
import { chmodSync } from 'fs';
chmodSync(entrypointPath, '755');

console.log('✅ Created entrypoint file:', entrypointPath);
console.log('🎯 Build complete! You can now use:');
console.log('   npm start          # Start the built server');
console.log('   node dist/index.js # Direct execution');
