import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { jiraService, JiraConfig, JiraProject } from '../services/jira.service';

interface JiraConfigProps {
  userEmail: string;
  onJiraConnected: (config: JiraConfig | null) => void;
  onProjectChange?: (projectKey: string | null) => void;
}

const ADMIN_TOKEN = 'Njc2NTgyNjY3MDA2Ops2sKkM9s+DmPPkvcdyeX7pri5n';
const SELF_HOSTED_URL = 'https://jira.alchemytech.in';

export default function JiraConfig({ userEmail, onJiraConnected, onProjectChange }: JiraConfigProps) {
  const [jiraUrl, setJiraUrl] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [jiraType, setJiraType] = useState<'atlassian' | 'self-hosted'>('self-hosted');
  const [project, setProject] = useState('');
  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [userKey, setUserKey] = useState<string | null>(null);

  useEffect(() => {
    // Load saved credentials from localStorage
    const savedConfig = localStorage.getItem('jiraConfig');
    if (savedConfig) {
      const config: JiraConfig = JSON.parse(savedConfig);
      setJiraUrl(config.url);
      setApiToken(config.token);
      setUserKey(config.userKey || null);
      setJiraType(config.type);
      setProject(config.project || '');
      setIsConnected(true);
      jiraService.setConfig(config);
      onJiraConnected(config);
    }
  }, [onJiraConnected]);

  useEffect(() => {
    if (jiraType === 'self-hosted' && userEmail && !isConnected) {
      fetchUserProjects();
    }
  }, [jiraType, userEmail, isConnected]);

  const fetchUserProjects = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Set up config for self-hosted
      const config: JiraConfig = {
        url: SELF_HOSTED_URL,
        email: userEmail,
        token: ADMIN_TOKEN,
        type: 'self-hosted'
      };
      
      jiraService.setConfig(config);
      
      // Test connection and get user details
      const userData = await jiraService.testConnection();
      setUserKey(userData.key);
      
      // Get user projects
      const userProjects = await jiraService.getUserProjects();
      setProjects(userProjects);
      
      // Save credentials to localStorage
      const fullConfig: JiraConfig = {
        ...config,
        project: project,
        displayName: userData.displayName,
        userKey: userData.key
      };
      
      localStorage.setItem('jiraConfig', JSON.stringify(fullConfig));
      
      // If there's only one project, select it automatically
      if (userProjects.length === 1) {
        setProject(userProjects[0].key);
        handleProjectSelect(userProjects[0].key);
      }
    } catch (err) {
      setError('Failed to connect to self-hosted Jira. Please check your access.');
      console.error('Error fetching projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (jiraType === 'self-hosted') {
        await fetchUserProjects();
      } else {
        const config: JiraConfig = {
          url: jiraUrl,
          email: userEmail,
          token: apiToken,
          type: 'atlassian'
        };
        
        jiraService.setConfig(config);
        const userData = await jiraService.testConnection();
        
        const fullConfig: JiraConfig = {
          ...config,
          displayName: userData.displayName,
          userKey: userData.key
        };
        
        localStorage.setItem('jiraConfig', JSON.stringify(fullConfig));
        setIsConnected(true);
        onJiraConnected(fullConfig);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Jira. Please check your credentials.');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('jiraConfig');
    setIsConnected(false);
    setJiraUrl('');
    setApiToken('');
    setProject('');
    setProjects([]);
    setUserKey(null);
    jiraService.setConfig(null as any);
    onJiraConnected(null);
    
    // Notify parent component about project change (clearing)
    if (onProjectChange) {
      onProjectChange(null);
    }
  };

  const handleProjectSelect = async (selectedProject: string) => {
    setProject(selectedProject);
    
    try {
      const config: JiraConfig = {
        url: SELF_HOSTED_URL,
        email: userEmail,
        token: ADMIN_TOKEN,
        type: 'self-hosted',
        project: selectedProject,
        userKey: userKey || undefined
      };
      
      jiraService.setConfig(config);
      localStorage.setItem('jiraConfig', JSON.stringify(config));
      setIsConnected(true);
      onJiraConnected(config);
      
      // Notify parent component about project change
      if (onProjectChange) {
        onProjectChange(selectedProject);
      }
    } catch (err) {
      setError('Failed to select project');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full flex flex-col">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Jira Project</h2>
          <p className="text-xs text-gray-500">Select your project</p>
        </div>
      </div>
      
      {isConnected ? (
        <div>
          <div className="flex items-center space-x-2 mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <div>
              <span className="text-green-800 font-medium text-sm">Connected</span>
              <p className="text-xs text-green-600">Ready to track time</p>
            </div>
          </div>
          
          {jiraType === 'self-hosted' && (
            <div className="mb-4">
              <label className="block text-xs font-medium mb-2 text-gray-700">
                Select Project
              </label>
              <select
                value={project}
                onChange={(e) => handleProjectSelect(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 text-sm"
              >
                <option value="">Choose a project...</option>
                {projects.map(proj => (
                  <option key={proj.id} value={proj.key}>
                    {proj.name} ({proj.key})
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <button
            onClick={handleDisconnect}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Jira Type
            </label>
            <select
              value={jiraType}
              onChange={(e) => setJiraType(e.target.value as 'atlassian' | 'self-hosted')}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
            >
              <option value="atlassian">Atlassian Cloud</option>
              <option value="self-hosted">Self Hosted</option>
            </select>
          </div>

          {jiraType === 'atlassian' && (
            <form onSubmit={handleConnect} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Jira URL
                  <span className="text-gray-500 text-xs ml-2">
                    (e.g., https://your-domain.atlassian.net)
                  </span>
                </label>
                <input
                  type="url"
                  value={jiraUrl}
                  onChange={(e) => setJiraUrl(e.target.value)}
                  placeholder="https://your-domain.atlassian.net"
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  API Token
                  <a
                    href="https://id.atlassian.com/manage-profile/security/api-tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-xs ml-2 hover:text-blue-700 transition-colors inline-flex items-center"
                  >
                    Generate token <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </label>
                <input
                  type="password"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 rounded-lg transition-all duration-200 font-medium ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Connecting...</span>
                  </div>
                ) : (
                  'Connect to Jira'
                )}
              </button>
            </form>
          )}

          {jiraType === 'self-hosted' && (
            <div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-800 font-medium">Self-Hosted Jira</span>
                </div>
                <p className="text-blue-700 text-sm">
                  Using admin credentials to access your tasks from {SELF_HOSTED_URL}
                </p>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center p-6 bg-gray-50 border border-gray-200 rounded-lg">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-3 text-gray-600">Loading your projects...</span>
                </div>
              ) : projects.length > 0 ? (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Select Project
                  </label>
                  <select
                    value={project}
                    onChange={(e) => handleProjectSelect(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
                  >
                    <option value="">Choose a project...</option>
                    {projects.map(proj => (
                      <option key={proj.id} value={proj.key}>
                        {proj.name} ({proj.key})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="text-center p-6 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                  No projects found for your account
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
