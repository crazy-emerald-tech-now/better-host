// Route: POST /api/deploy
// Handles GitHub repository deployment
// Clones repos and stores metadata for routing

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { repoUrl, projectName } = req.body;

  if (!repoUrl || !projectName) {
    return res.status(400).json({ error: 'Missing repoUrl or projectName' });
  }

  // Validate project name
  const validProjectName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  
  try {
    // Create temporary directory for cloning
    const tmpDir = `/tmp/projects/${validProjectName}`;
    
    // Clone the repository
    await execAsync(`rm -rf ${tmpDir} && mkdir -p ${tmpDir}`);
    await execAsync(`git clone ${repoUrl} ${tmpDir}`);
    
    // Store project metadata
    const projectsDir = '/tmp/project-metadata';
    await execAsync(`mkdir -p ${projectsDir}`);
    
    const metadata = {
      name: validProjectName,
      repoUrl,
      deployedAt: new Date().toISOString(),
      path: tmpDir
    };
    
    await fs.writeFile(
      `${projectsDir}/${validProjectName}.json`,
      JSON.stringify(metadata, null, 2)
    );

    res.status(200).json({
      success: true,
      projectName: validProjectName,
      url: `/projects/${validProjectName}`
    });
  } catch (error) {
    console.error('Deployment error:', error);
    res.status(500).json({ error: 'Deployment failed', details: error.message });
  }
}
