import React, { useState } from 'react';
import { Upload, Link, Loader2, FolderGit2, ExternalLink } from 'lucide-react';

export default function HostingPlatform() {
  const [repoUrl, setRepoUrl] = useState('');
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleDeploy = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Extract project name from repo URL if not provided
      let finalProjectName = projectName;
      if (!finalProjectName && repoUrl) {
        const match = repoUrl.match(/github\.com\/[\w-]+\/([\w-]+)/);
        if (match) {
          finalProjectName = match[1].replace(/\.git$/, '');
        }
      }

      if (!finalProjectName) {
        throw new Error('Please provide a project name or valid GitHub URL');
      }

      // Simulate API call to deploy
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl,
          projectName: finalProjectName
        })
      });

      if (!response.ok) {
        throw new Error('Deployment failed');
      }

      const data = await response.json();
      
      const newProject = {
        id: Date.now(),
        name: finalProjectName,
        url: `/projects/${finalProjectName}`,
        createdAt: new Date().toISOString()
      };

      setProjects([newProject, ...projects]);
      setSuccess(`Project deployed successfully! Access it at /projects/${finalProjectName}`);
      setRepoUrl('');
      setProjectName('');
    } catch (err) {
      setError(err.message || 'Failed to deploy project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <FolderGit2 className="w-12 h-12 text-purple-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Node.js Hosting Platform
          </h1>
          <p className="text-purple-200">
            Deploy GitHub repos instantly. No signup required.
          </p>
        </div>

        {/* Deploy Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                GitHub Repository URL
              </label>
              <input
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/username/repository"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Project Name (optional)
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                placeholder="my-awesome-project"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-sm text-purple-300 mt-1">
                Leave blank to use repository name
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200">
                {success}
              </div>
            )}

            <button
              onClick={handleDeploy}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Deploy Project
                </>
              )}
            </button>
          </div>
        </div>

        {/* Projects List */}
        {projects.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Link className="w-6 h-6" />
              Deployed Projects
            </h2>
            <div className="space-y-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {project.name}
                    </h3>
                    <p className="text-sm text-purple-300">
                      {new Date(project.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    View Project
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-3">How it works</h3>
          <ul className="space-y-2 text-purple-200">
            <li>• Paste your GitHub repository URL</li>
            <li>• Your project will be deployed to /projects/your-project-name</li>
            <li>• Access any file at /projects/your-project-name/index.html</li>
            <li>• Node.js apps run through serverless functions</li>
            <li>• No signup or authentication required</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
