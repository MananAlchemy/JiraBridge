import React, { useState, useEffect } from 'react';
import { X, Users, Clock, CheckCircle, AlertCircle, Send } from 'lucide-react';
import { useStandup } from '../hooks/useStandup';
import { StandupData } from '../services/standup.service';

interface StandupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StandupModal: React.FC<StandupModalProps> = ({ isOpen, onClose }) => {
  const { sendStandup, getTodayStandupData, isSubmitting, lastSubmission } = useStandup();
  const [standupData, setStandupData] = useState<StandupData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadStandupData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (lastSubmission) {
      if (lastSubmission.success) {
        setShowSuccess(true);
        // Auto close after 3 seconds on success
        setTimeout(() => {
          handleClose();
        }, 3000);
      }
    }
  }, [lastSubmission]);

  const loadStandupData = async () => {
    setIsLoading(true);
    try {
      const data = await getTodayStandupData();
      setStandupData(data);
    } catch (error) {
      console.error('Failed to load standup data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendStandup = async () => {
    try {
      await sendStandup();
    } catch (error) {
      console.error('Failed to send standup:', error);
    }
  };

  const handleClose = () => {
    setShowSuccess(false);
    setStandupData(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Daily Standup</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600 text-sm">Loading...</span>
            </div>
          ) : standupData ? (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total Time:</span>
                <span className="font-medium text-gray-900">{standupData.totalTimeToday}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Tasks:</span>
                <span className="font-medium text-gray-900">{standupData.tasks.length}</span>
              </div>

              {/* Tasks List */}
              {standupData.tasks.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-700">Tasks worked on:</h3>
                  {standupData.tasks.map((task, index) => (
                    <div key={index} className="bg-gray-50 rounded p-3 text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-blue-600">{task.taskKey}</span>
                        <span className="text-gray-600">{task.timeSpentFormatted}</span>
                      </div>
                      <p className="text-gray-700 text-xs">{task.taskSummary}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No tasks tracked today</p>
                </div>
              )}

              {/* Success/Error Messages */}
              {showSuccess && lastSubmission?.success && (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <p className="text-sm font-medium text-green-900">Sent successfully!</p>
                  </div>
                </div>
              )}

              {lastSubmission && !lastSubmission.success && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-sm font-medium text-red-900">Failed to send</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No data available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSendStandup}
            disabled={isSubmitting || !standupData || standupData.tasks.length === 0}
            className={`px-3 py-1.5 text-sm rounded font-medium transition-colors flex items-center space-x-1 ${
              isSubmitting || !standupData || standupData.tasks.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-3 h-3" />
                <span>Send</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
