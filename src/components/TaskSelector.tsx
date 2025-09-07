import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, User, Calendar, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { jiraService, JiraTask } from '../services/jira.service';

interface TaskSelectorProps {
  userEmail: string;
  onTaskSelect: (task: JiraTask | null) => void;
  selectedTask: JiraTask | null;
  isProjectSelected: boolean;
  selectedProject?: string;
}

export default function TaskSelector({ userEmail, onTaskSelect, selectedTask, isProjectSelected, selectedProject }: TaskSelectorProps) {
  const [tasks, setTasks] = useState<JiraTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isProjectSelected && selectedProject) {
      // Clear current task selection when project changes
      if (selectedTask && selectedTask.project.key !== selectedProject) {
        onTaskSelect(null);
      }
      fetchTasks();
    } else {
      // Clear tasks when no project is selected
      setTasks([]);
      setError(null);
    }
  }, [userEmail, isProjectSelected, selectedProject, selectedTask, onTaskSelect]);

  const fetchTasks = async () => {
    if (!selectedProject) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const userTasks = await jiraService.getUserTasks(selectedProject);
      setTasks(userTasks);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task =>
    task.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (seconds: number): string => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority.toLowerCase()) {
      case 'highest':
      case 'critical':
        return 'text-red-400 bg-red-900/20 border-red-500/30';
      case 'high':
        return 'text-orange-400 bg-orange-900/20 border-orange-500/30';
      case 'medium':
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      case 'low':
        return 'text-green-400 bg-green-900/20 border-green-500/30';
      default:
        return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'in progress':
        return 'text-blue-400 bg-blue-900/20 border-blue-500/30';
      case 'to do':
      case 'open':
        return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
      case 'done':
      case 'closed':
        return 'text-green-400 bg-green-900/20 border-green-500/30';
      default:
        return 'text-purple-400 bg-purple-900/20 border-purple-500/30';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Jira Task</h2>
            <p className="text-xs text-gray-500">Choose a task</p>
          </div>
        </div>
        {isProjectSelected && (
          <button
            onClick={fetchTasks}
            disabled={isLoading}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Loader2 className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {!isProjectSelected ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Please Select Project</h3>
            <p className="text-sm text-gray-500">
              Choose a project from the Jira Project box to view and select tasks.
            </p>
          </div>
        </div>
      ) : (
        <>
          {selectedTask && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-green-800 font-medium text-sm">Selected</span>
              </div>
              <div className="text-green-700">
                <div className="font-medium text-sm">{selectedTask.key}</div>
                <div className="text-xs text-green-600 mt-1 truncate">
                  {selectedTask.summary}
                </div>
              </div>
            </div>
          )}

          <div className="mb-3">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 text-sm"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-4 flex-1">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600 text-sm">Loading...</span>
            </div>
          ) : error ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center space-x-2 flex-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center p-4 text-gray-500 text-sm flex-1 flex items-center justify-center">
              {searchTerm ? 'No tasks found' : 'No tasks available'}
            </div>
          ) : (
            <div className="space-y-2 flex-1 overflow-y-auto">
              <AnimatePresence>
                {filteredTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onTaskSelect(task)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                      selectedTask?.id === task.id
                        ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                        : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-1 mb-1">
                          <span className="font-medium text-gray-900 text-sm">{task.key}</span>
                          <span className={`px-1 py-0.5 text-xs rounded border ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                        </div>
                        <h3 className="text-gray-800 font-medium text-sm mb-1 truncate">{task.summary}</h3>
                        <div className="text-xs text-gray-600">{task.project.name}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      {task.timeSpent > 0 && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(task.timeSpent)} logged</span>
                        </div>
                      )}
                      {task.timeEstimate > 0 && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatTime(task.timeEstimate)} estimated</span>
                        </div>
                      )}
                      {task.assignee && (
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{task.assignee.displayName}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {selectedTask && (
            <button
              onClick={() => onTaskSelect(null)}
              className="w-full mt-3 py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 rounded-lg transition-all duration-200 text-sm"
            >
              Clear Selection
            </button>
          )}
        </>
      )}
    </div>
  );
}
