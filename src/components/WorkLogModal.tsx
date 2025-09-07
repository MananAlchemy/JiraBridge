import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  X, 
  Save, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Calendar,
  User,
  FileText,
  ArrowRight
} from 'lucide-react';
import { JiraTask } from '../services/jira.service';
import { JIRA_CONFIG, JIRA_ERRORS, JIRA_SUCCESS, TASK_STATUS_TRANSITIONS } from '../constants/jira';
import { JiraError } from '../utils/errorHandler';

interface WorkLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: JiraTask | null;
  startTime: Date;
  endTime: Date;
  timeSpentSeconds: number;
  onWorkLogSubmit: (data: WorkLogData) => Promise<void>;
  onStatusChange?: (taskKey: string, newStatus: string) => Promise<void>;
}

interface WorkLogData {
  description: string;
  startTime: Date;
  endTime: Date;
  taskKey: string;
  timeSpentSeconds: number;
}

interface Transition {
  id: string;
  name: string;
  to: {
    name: string;
    id: string;
  };
}

export const WorkLogModal: React.FC<WorkLogModalProps> = ({
  isOpen,
  onClose,
  task,
  startTime,
  endTime,
  timeSpentSeconds,
  onWorkLogSubmit,
  onStatusChange
}) => {
  const [description, setDescription] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [availableTransitions, setAvailableTransitions] = useState<Transition[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTransitions, setIsLoadingTransitions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Format time duration
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Format time for display
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Fetch available transitions for the task
  const fetchTransitions = async () => {
    if (!task || !onStatusChange) return;
    
    setIsLoadingTransitions(true);
    setError(null);
    
    try {
      // This would typically call the Jira service to get transitions
      // For now, we'll use the predefined transitions based on current status
      const currentStatus = task.status;
      const transitions = TASK_STATUS_TRANSITIONS[currentStatus as keyof typeof TASK_STATUS_TRANSITIONS] || [];
      
      const transitionObjects = transitions.map((status, index) => ({
        id: `transition-${index}`,
        name: `Transition to ${status}`,
        to: {
          name: status,
          id: `status-${status.toLowerCase().replace(' ', '-')}`
        }
      }));
      
      setAvailableTransitions(transitionObjects);
    } catch (err) {
      console.error('Error fetching transitions:', err);
      setError('Failed to load available status changes');
    } finally {
      setIsLoadingTransitions(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!task) {
      setError('No task selected');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a description for your work');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Submit work log
      await onWorkLogSubmit({
        description: description.trim(),
        startTime,
        endTime,
        taskKey: task.key,
        timeSpentSeconds
      });

      // Change status if selected
      if (selectedStatus && onStatusChange) {
        await onStatusChange(task.key, selectedStatus);
      }

      setSuccess('Work logged and status updated successfully!');
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        setDescription('');
        setSelectedStatus('');
        setError(null);
        setSuccess(null);
      }, 1500);

    } catch (err) {
      const errorMessage = err instanceof JiraError 
        ? err.message 
        : 'Failed to log work. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load transitions when modal opens
  useEffect(() => {
    if (isOpen && task) {
      fetchTransitions();
      // Set default description
      setDescription(`Worked on ${task.summary}`);
    }
  }, [isOpen, task]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setDescription('');
      setSelectedStatus('');
      setError(null);
      setSuccess(null);
      setAvailableTransitions([]);
    }
  }, [isOpen]);

  if (!isOpen || !task) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Log Work Time</h2>
                <p className="text-sm text-gray-500">Record your work and update task status</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Task Information */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-900">{task.key}</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                  task.status === 'Done' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {task.status}
                </span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">{task.summary}</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <User className="w-3 h-3" />
                  <span>{task.assignee?.displayName || 'Unassigned'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{task.project.name}</span>
                </div>
              </div>
            </div>

            {/* Time Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Start Time</span>
                </div>
                <p className="text-lg font-bold text-blue-900">{formatTime(startTime)}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">End Time</span>
                </div>
                <p className="text-lg font-bold text-green-900">{formatTime(endTime)}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">Duration</span>
                </div>
                <p className="text-lg font-bold text-purple-900">{formatDuration(timeSpentSeconds)}</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Work Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Work Description *
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you worked on..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                  required
                />
              </div>

              {/* Status Change */}
              {onStatusChange && availableTransitions.length > 0 && (
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                    Update Task Status (Optional)
                  </label>
                  {isLoadingTransitions ? (
                    <div className="flex items-center space-x-2 text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading available status changes...</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <select
                        id="status"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Keep current status ({task.status})</option>
                        {availableTransitions.map((transition) => (
                          <option key={transition.id} value={transition.to.name}>
                            {transition.to.name}
                          </option>
                        ))}
                      </select>
                      {selectedStatus && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <ArrowRight className="w-3 h-3" />
                          <span>Status will change from <strong>{task.status}</strong> to <strong>{selectedStatus}</strong></span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Error/Success Messages */}
              {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700">{success}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !description.trim()}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Logging Work...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Log Work & Update Status</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
