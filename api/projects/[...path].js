// Route: GET /api/projects/[projectName]/[...path]
// Examples:
//   - /api/projects/my-app → serves /my-app/index.html
//   - /api/projects/my-app/index.html → serves /my-app/index.html
//   - /api/projects/my-app/style.css → serves /my-app/style.css
//   - /api/projects/my-app/api/data → proxies to Node.js server
// Handles both static file serving and Node.js server proxying

import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';

export default async function handler(req, res) {
  const { path: pathSegments } = req.query;
  
  if (!pathSegments || pathSegments.length === 0) {
    return res.status(400).json({ error: 'Invalid project path' });
  }

  const projectName = pathSegments[0];
  const filePath = pathSegments.slice(1).join('/') || 'index.html';

  try {
    // Get project metadata
    const metadataPath = `/tmp/project-metadata/${projectName}.json`;
    const metadataContent = await fs.readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataContent);
    
    const projectDir = metadata.path;
    const fullPath = path.join(projectDir, filePath);

    // Security check: ensure path is within project directory
    const resolvedPath = path.resolve(fullPath);
    if (!resolvedPath.startsWith(path.resolve(projectDir))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if it's a Node.js server file
    if (filePath.endsWith('.js') || filePath === 'server.js' || filePath === 'index.js') {
      // Check if there's a package.json with a start script
      const packageJsonPath = path.join(projectDir, 'package.json');
      let shouldRunAsServer = false;
      
      try {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        if (packageJson.scripts && packageJson.scripts.start) {
          shouldRunAsServer = true;
        }
      } catch (e) {
        // No package.json or no start script
      }

      if (shouldRunAsServer) {
        // Run as Node.js server and proxy the request
        return proxyToNodeServer(req, res, projectDir, projectName);
      }
    }

    // Serve static file
    const stat = await fs.stat(resolvedPath);
    
    if (stat.isDirectory()) {
      // Try to serve index.html from directory
      const indexPath = path.join(resolvedPath, 'index.html');
      try {
        const content = await fs.readFile(indexPath, 'utf-8');
        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(content);
      } catch (e) {
        return res.status(404).json({ error: 'No index.html found in directory' });
      }
    }

    // Determine content type
    const ext = path.extname(resolvedPath).toLowerCase();
    const contentTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon'
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';
    const content = await fs.readFile(resolvedPath);
    
    res.setHeader('Content-Type', contentType);
    res.status(200).send(content);

  } catch (error) {
    console.error('Error serving project:', error);
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: 'File not found' });
    }
    res.status(500).json({ error: 'Server error', details: error.message });
  }
}

// Store running servers
const runningServers = new Map();

async function proxyToNodeServer(req, res, projectDir, projectName) {
  const port = 3000 + Math.floor(Math.random() * 1000);
  
  // Check if server is already running
  if (!runningServers.has(projectName)) {
    // Start the Node.js server
    const serverProcess = spawn('npm', ['start'], {
      cwd: projectDir,
      env: { ...process.env, PORT: port }
    });

    serverProcess.stdout.on('data', (data) => {
      console.log(`[${projectName}] ${data}`);
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`[${projectName}] ${data}`);
    });

    runningServers.set(projectName, { process: serverProcess, port });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  const serverInfo = runningServers.get(projectName);
  
  // Proxy the request to the running Node.js server
  try {
    const fetch = (await import('node-fetch')).default;
    const targetUrl = `http://localhost:${serverInfo.port}${req.url}`;
    const proxyRes = await fetch(targetUrl, {
      method: req.method,
      headers: req.headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
    });

    const body = await proxyRes.text();
    res.status(proxyRes.status);
    proxyRes.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    res.send(body);
  } catch (error) {
    res.status(502).json({ error: 'Failed to proxy to Node.js server' });
  }
}
