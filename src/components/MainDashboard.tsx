import React, { useState, useEffect } from 'react';
import { Play, Square, Settings, TrendingUp } from 'lucide-react';
import { ScreenshotGrid } from './ScreenshotGrid';
import JiraConfig from './JiraConfig';
import TaskSelector from './TaskSelector';
import { WorkLogModal } from './WorkLogModal';
import { useScreenshots } from '../hooks/useScreenshots';
import { useTimeTracking } from '../hooks/useTimeTracking';
import { useJira } from '../hooks/useJira';
import { useWorkLog } from '../hooks/useWorkLog';
import { useAuth } from '../hooks/useAuth';
import { AppSettings } from '../types';

interface MainDashboardProps {
  onSettingsClick: () => void;
  settings: AppSettings;
  onTimeTrackingUpdate?: (data: { isTracking: boolean; totalTimeToday: string; lastCapture: Date | null; isCapturing: boolean }) => void;
  onScreenshotsUpdate?: (data: { screenshots: any[]; unsyncedCount: number; failedUploadsCount: number; isSyncing: boolean }) => void;
  syncTrigger?: number;
  retryTrigger?: number;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({ onSettingsClick, settings, onTimeTrackingUpdate, onScreenshotsUpdate, syncTrigger, retryTrigger }) => {
  const { user } = useAuth();
  const { 
    config: jiraConfig,
    selectedTask, 
    connectJira, 
    selectTask 
  } = useJira();
  
  const {
    currentSession,
    isTracking,
    totalTimeToday,
    dailyData,
    startTracking,
    stopTracking,
    addScreenshotToSession,
    getFormattedTime,
    getWeeklyStats,
    clearCurrentSession
  } = useTimeTracking(selectedTask);

  const {
    screenshots,
    isCapturing,
    lastCapture,
    captureScreenshot,
    deleteScreenshot,
    syncScreenshots,
    retryFailedUploads,
    getScreenshotStats
  } = useScreenshots(
    addScreenshotToSession,
    user?.email,
    '4d07e62f7c9f7822f3a76f9ad1c085bc', // Machine ID from logs
    selectedTask?.key,
    selectedTask
  );

  const [nextCapture, setNextCapture] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showWorkLogModal, setShowWorkLogModal] = useState(false);
  const [pendingSession, setPendingSession] = useState<{
    startTime: Date;
    endTime: Date;
    timeSpentSeconds: number;
  } | null>(null);

  const { logWorkToTempo, updateTaskStatus } = useWorkLog();

  useEffect(() => {
    // Set up automatic screenshot capture only when tracking is active
    let interval: NodeJS.Timeout | null = null;
    
    if (isTracking) {
      interval = setInterval(() => {
        captureScreenshot();
      }, settings.screenshotInterval * 1000); // Convert seconds to milliseconds

      // Calculate next capture time
      if (lastCapture) {
        const next = new Date(lastCapture.getTime() + settings.screenshotInterval * 1000);
        setNextCapture(next);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [settings.screenshotInterval, lastCapture, captureScreenshot, isTracking]);

  useEffect(() => {
    // Handle electron toggle tracking event
    const handleToggleTracking = () => {
      handleStartStopTracking();
    };

    window.addEventListener('toggle-tracking', handleToggleTracking);

    return () => {
      window.removeEventListener('toggle-tracking', handleToggleTracking);
    };
  }, [isTracking]);

  const handleSync = async () => {
    setIsSyncing(true);
    await syncScreenshots();
    setIsSyncing(false);
  };

  const unsyncedCount = screenshots.filter(s => !s.synced).length;
  const failedUploadsCount = screenshots.filter(s => !s.synced && s.uploadError).length;

  // Update parent component with time tracking data
  useEffect(() => {
    if (onTimeTrackingUpdate) {
      onTimeTrackingUpdate({
        isTracking,
        totalTimeToday: getFormattedTime(totalTimeToday),
        lastCapture,
        isCapturing
      });
    }
  }, [isTracking, totalTimeToday, lastCapture, isCapturing, getFormattedTime, onTimeTrackingUpdate]);

  // Update parent component with screenshots data
  useEffect(() => {
    if (onScreenshotsUpdate) {
      onScreenshotsUpdate({
        screenshots,
        unsyncedCount,
        failedUploadsCount,
        isSyncing
      });
    }
  }, [screenshots, unsyncedCount, failedUploadsCount, isSyncing, onScreenshotsUpdate]);

  // Handle sync trigger from StatusBar
  useEffect(() => {
    if (syncTrigger && syncTrigger > 0) {
      handleSync();
    }
  }, [syncTrigger]);

  // Handle retry trigger from StatusBar
  useEffect(() => {
    if (retryTrigger && retryTrigger > 0) {
      handleRetryFailedUploads();
    }
  }, [retryTrigger]);

  const handleRetryFailedUploads = async () => {
    setIsSyncing(true);
    await retryFailedUploads();
    setIsSyncing(false);
  };
  const weeklyStats = getWeeklyStats();

  const handleStartStopTracking = () => {
    console.log('handleStartStopTracking called:', { isTracking, hasCurrentSession: !!currentSession, hasSelectedTask: !!selectedTask });
    
    if (isTracking) {
      // Show work log modal when stopping tracking
      if (currentSession && selectedTask) {
        const now = new Date();
        const timeSpentSeconds = Math.floor((now.getTime() - currentSession.startTime.getTime()) / 1000);
        
        console.log('Stopping tracking with work log modal:', { timeSpentSeconds });
        
        setPendingSession({
          startTime: currentSession.startTime,
          endTime: now,
          timeSpentSeconds
        });
        setShowWorkLogModal(true);
      } else {
        console.log('Stopping tracking without work log modal');
        stopTracking();
      }
    } else {
      console.log('Starting tracking');
      startTracking();
    }
  };

  const handleWorkLogSubmit = async (workLogData: {
    description: string;
    startTime: Date;
    endTime: Date;
    taskKey: string;
    timeSpentSeconds: number;
  }) => {
    if (!jiraConfig?.userKey) {
      throw new Error('Jira user key not found. Please reconnect to Jira to get your user key.');
    }

    try {
      await logWorkToTempo(workLogData, jiraConfig.userKey);
    } catch (error) {
      console.error('Work log submission error:', error);
      // Re-throw with more context
      if (error instanceof Error) {
        throw new Error(`Failed to log work to Tempo: ${error.message}`);
      }
      throw error;
    }
  };

  const handleStatusChange = async (taskKey: string, newStatus: string) => {
    await updateTaskStatus(taskKey, newStatus);
  };

  const handleWorkLogModalClose = () => {
    setShowWorkLogModal(false);
    setPendingSession(null);
    // Stop tracking after modal is closed
    if (isTracking) {
      stopTracking();
    }
  };

  return (
    <div className="bg-gray-50">
      <div className="p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Time Tracking Dashboard</h1>
              <p className="text-gray-600">Monitor your work time with automatic screenshot capture</p>
            </div>
            <button
              onClick={onSettingsClick}
              className="bg-orange-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Jira Project Box - First */}
          {user && (
            <div className="h-96 flex flex-col">
              <JiraConfig 
                userEmail={user.email} 
                onJiraConnected={(config) => connectJira(config!)}
                onProjectChange={(projectKey) => {
                  // Clear task selection when project changes
                  if (selectedTask && selectedTask.project.key !== projectKey) {
                    selectTask(null);
                  }
                }}
              />
            </div>
          )}

          {/* Jira Task Box - Second */}
          {user && (
            <div className="h-96 flex flex-col">
              <TaskSelector 
                userEmail={user.email}
                onTaskSelect={selectTask}
                selectedTask={selectedTask}
                isProjectSelected={!!jiraConfig?.project}
                selectedProject={jiraConfig?.project}
              />
            </div>
          )}

          {/* Time Tracking Box - Third */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-96 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isTracking ? 'bg-green-100' : 'bg-gray-100'}`}>
                  {isTracking ? (
                    <Square className="w-5 h-5 text-green-600" />
                  ) : (
                    <Play className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Time Tracking</h3>
                  <p className={`text-lg font-bold ${isTracking ? 'text-green-600' : 'text-gray-600'}`}>
                    {isTracking ? 'Active' : 'Stopped'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Today</div>
                <div className="text-lg font-bold text-blue-600">
                  {getFormattedTime(totalTimeToday)}
                </div>
              </div>
            </div>
            
            <div className="space-y-3 flex-1">
              {currentSession && isTracking && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Current session:</span>
                  <span className="font-medium text-gray-900">
                    {getFormattedTime(currentSession.duration || 0)}
                  </span>
                </div>
              )}
              
              {selectedTask ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Selected task:</span>
                  <span className="font-medium text-blue-600">
                    {selectedTask.key}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Selected task:</span>
                  <span className="font-medium text-gray-400">
                    No task selected
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Screenshots today:</span>
                <span className="font-medium text-gray-900">
                  {screenshots.filter(s => {
                    const today = new Date().toDateString();
                    return new Date(s.timestamp).toDateString() === today;
                  }).length}
                </span>
              </div>
              
              <button
                onClick={handleStartStopTracking}
                disabled={!selectedTask && !isTracking}
                className={`w-full text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                  !selectedTask && !isTracking
                    ? 'bg-gray-400 cursor-not-allowed'
                    : isTracking 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isTracking ? (
                  <>
                    <Square className="w-4 h-4" />
                    <span>Stop Tracking</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>{selectedTask ? 'Start Tracking' : 'Select Task First'}</span>
                  </>
                )}
              </button>
              
              {/* Debug: Clear session button - only show if there's a current session */}
              {currentSession && (
                <button
                  onClick={clearCurrentSession}
                  className="w-full text-gray-600 bg-gray-100 hover:bg-gray-200 py-1 px-3 rounded text-sm transition-colors"
                  title="Clear current session (debug)"
                >
                  Clear Session
                </button>
              )}
              
              {/* Debug: DevTools button - only show in development */}
              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={async () => {
                    if (window.electronAPI?.toggleDevTools) {
                      await window.electronAPI.toggleDevTools();
                    }
                  }}
                  className="w-full text-blue-600 bg-blue-50 hover:bg-blue-100 py-1 px-3 rounded text-sm transition-colors"
                  title="Toggle DevTools (F12)"
                >
                  Toggle DevTools (F12)
                </button>
              )}
            </div>

            {/* Weekly Stats Section - Non-collapsible */}
            <div className="border-t border-gray-100 pt-4 mt-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">Weekly Stats</h4>
                  <p className="text-sm font-bold text-purple-600">
                    {weeklyStats.formattedTotalTime}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Days tracked:</span>
                  <span className="font-medium text-gray-900">{weeklyStats.daysTracked}/7</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Average/day:</span>
                  <span className="font-medium text-gray-900">{weeklyStats.formattedAverageTime}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Task Display */}
        {selectedTask && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900">Selected Jira Task</h3>
                <p className="text-blue-700">
                  <span className="font-medium">{selectedTask.key}</span>: {selectedTask.summary}
                </p>
                <p className="text-sm text-blue-600">
                  {selectedTask.project.name} • {selectedTask.status}
                </p>
              </div>
              <button
                onClick={() => selectTask(null)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Screenshots</h2>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {isTracking ? (
                  <>Capturing every {settings.screenshotInterval} second{settings.screenshotInterval !== 1 ? 's' : ''}</>
                ) : (
                  'Tracking stopped'
                )}
              </span>
              {nextCapture && isTracking && (
                <span className="text-sm text-gray-500">
                  Next: {nextCapture.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </span>
              )}
            </div>
          </div>
          
          <ScreenshotGrid
            screenshots={screenshots}
            onDelete={deleteScreenshot}
          />
        </div>


        {/* Work Log Modal */}
        {showWorkLogModal && pendingSession && selectedTask && (
          <WorkLogModal
            isOpen={showWorkLogModal}
            onClose={handleWorkLogModalClose}
            task={selectedTask}
            startTime={pendingSession.startTime}
            endTime={pendingSession.endTime}
            timeSpentSeconds={pendingSession.timeSpentSeconds}
            onWorkLogSubmit={handleWorkLogSubmit}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>
    </div>
  );
};