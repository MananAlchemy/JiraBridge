import React, { useState } from 'react';
import { Trash2, Cloud, CloudOff, Download, Tag, Eye, Grid3X3, ChevronRight, AlertCircle, CheckCircle, Folder, Calendar } from 'lucide-react';
import { Screenshot } from '../types';
import { formatUtils } from '../utils/format';
import { logger } from '../utils/logger';

interface ScreenshotGridProps {
  screenshots: Screenshot[];
  onDelete: (id: string) => void;
  onView?: (screenshot: Screenshot) => void;
  className?: string;
}

export const ScreenshotGrid: React.FC<ScreenshotGridProps> = ({ 
  screenshots, 
  onDelete, 
  onView,
  className = '' 
}) => {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const handleDelete = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    logger.info('Delete screenshot requested:', { id });
    onDelete(id);
  };

  const handleView = (screenshot: Screenshot) => {
    if (onView) {
      logger.info('View screenshot requested:', { id: screenshot.id });
      onView(screenshot);
    }
  };

  const toggleDateExpansion = (dateKey: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(dateKey)) {
      newExpanded.delete(dateKey);
    } else {
      newExpanded.add(dateKey);
    }
    setExpandedDates(newExpanded);
  };

  const toggleTaskExpansion = (taskKey: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskKey)) {
      newExpanded.delete(taskKey);
    } else {
      newExpanded.add(taskKey);
    }
    setExpandedTasks(newExpanded);
  };

  // Helper function to get date string
  const getDateString = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const screenshotDate = new Date(date);
    screenshotDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    
    if (screenshotDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (screenshotDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return screenshotDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  // Group screenshots by date first, then by Jira task
  const groupedScreenshots = screenshots.reduce((dateGroups, screenshot) => {
    const dateKey = getDateString(screenshot.timestamp);
    const taskKey = screenshot.jiraTask?.key || 'No Task';
    
    if (!dateGroups[dateKey]) {
      dateGroups[dateKey] = {};
    }
    
    if (!dateGroups[dateKey][taskKey]) {
      dateGroups[dateKey][taskKey] = {
        task: screenshot.jiraTask,
        screenshots: []
      };
    }
    
    dateGroups[dateKey][taskKey].screenshots.push(screenshot);
    return dateGroups;
  }, {} as Record<string, Record<string, { task?: { key: string; summary: string; project: string }; screenshots: Screenshot[] }>>);

  // Sort screenshots within each task by timestamp (newest first)
  Object.values(groupedScreenshots).forEach(dateGroup => {
    Object.values(dateGroup).forEach(taskGroup => {
      taskGroup.screenshots.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    });
  });

  // Sort dates (today first, then yesterday, then by date)
  const sortedDates = Object.keys(groupedScreenshots).sort((a, b) => {
    if (a === 'Today') return -1;
    if (b === 'Today') return 1;
    if (a === 'Yesterday') return -1;
    if (b === 'Yesterday') return 1;
    return new Date(b).getTime() - new Date(a).getTime();
  });

  if (screenshots.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Download className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Screenshots Yet</h3>
        <p className="text-gray-600">Screenshots will appear here once capture begins</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {sortedDates.map((dateKey) => {
        const dateGroup = groupedScreenshots[dateKey];
        const isDateExpanded = expandedDates.has(dateKey);
        const totalScreenshotsForDate = Object.values(dateGroup).reduce((sum, taskGroup) => sum + taskGroup.screenshots.length, 0);
        
        return (
          <div key={dateKey} className="mb-8">
            {/* Date Header */}
            <div 
              className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg cursor-pointer hover:bg-indigo-100 transition-colors border border-indigo-200"
              onClick={() => toggleDateExpansion(dateKey)}
            >
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <div>
                  <h2 className="text-lg font-semibold text-indigo-900">
                    {dateKey}
                  </h2>
                  <p className="text-sm text-indigo-700">
                    {totalScreenshotsForDate} screenshot{totalScreenshotsForDate !== 1 ? 's' : ''} across {Object.keys(dateGroup).length} task{Object.keys(dateGroup).length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <ChevronRight 
                className={`w-5 h-5 text-indigo-600 transition-transform ${isDateExpanded ? 'rotate-90' : ''}`} 
              />
            </div>

            {/* Tasks within Date */}
            {isDateExpanded && (
              <div className="mt-4 space-y-4">
                {Object.entries(dateGroup).map(([taskKey, taskGroup]) => {
                  const isTaskExpanded = expandedTasks.has(`${dateKey}-${taskKey}`);
                  const displayScreenshots = isTaskExpanded ? taskGroup.screenshots : taskGroup.screenshots.slice(0, 4);
                  const hasMore = taskGroup.screenshots.length > 4;

                  return (
                    <div key={taskKey} className="ml-4">
                      {/* Task Header */}
                      <div 
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => toggleTaskExpansion(`${dateKey}-${taskKey}`)}
                      >
                        <div className="flex items-center space-x-3">
                          <Folder className="w-4 h-4 text-gray-500" />
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {taskKey === 'No Task' ? 'No Task Selected' : taskKey}
                            </h3>
                            {taskGroup.task && (
                              <p className="text-sm text-gray-600 truncate max-w-xs">
                                {taskGroup.task.summary}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">
                            {taskGroup.screenshots.length} screenshot{taskGroup.screenshots.length !== 1 ? 's' : ''}
                          </span>
                          {hasMore && (
                            <ChevronRight 
                              className={`w-4 h-4 text-gray-400 transition-transform ${isTaskExpanded ? 'rotate-90' : ''}`} 
                            />
                          )}
                        </div>
                      </div>

                      {/* Screenshots Grid */}
                      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {displayScreenshots.map((screenshot) => (
                          <div
                            key={screenshot.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group"
                            onClick={() => handleView(screenshot)}
                          >
                            <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden relative">
                              {screenshot.dataURL ? (
                                <img 
                                  src={screenshot.dataURL} 
                                  alt="Screenshot" 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                              ) : (
                                <div className="text-center">
                                  <Download className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                  <p className="text-xs text-gray-500">Screenshot Preview</p>
                                </div>
                              )}
                              
                              {/* Overlay with view button */}
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                                <button
                                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-90 rounded-full p-2 hover:bg-opacity-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleView(screenshot);
                                  }}
                                  title="View screenshot"
                                >
                                  <Eye className="w-4 h-4 text-gray-700" />
                                </button>
                              </div>
                            </div>
                            
                            <div className="p-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-900">
                                  {formatUtils.time(screenshot.timestamp)}
                                </span>
                                <div className="flex items-center space-x-1">
                                  {screenshot.synced ? (
                                    <CheckCircle className="w-3 h-3 text-green-500" title="Synced to S3" />
                                  ) : screenshot.uploadError ? (
                                    <AlertCircle className="w-3 h-3 text-red-500" title={`Upload failed: ${screenshot.uploadError}`} />
                                  ) : (
                                    <CloudOff className="w-3 h-3 text-yellow-500" title="Uploading..." />
                                  )}
                                  <button
                                    onClick={(e) => handleDelete(screenshot.id, e)}
                                    className="p-1 hover:bg-red-50 rounded transition-colors group"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3 h-3 text-gray-400 group-hover:text-red-500" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Show More/Less Button for Task */}
                      {hasMore && (
                        <div className="mt-3 flex justify-center">
                          <button
                            onClick={() => toggleTaskExpansion(`${dateKey}-${taskKey}`)}
                            className="flex items-center space-x-2 px-3 py-1 text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
                          >
                            {isTaskExpanded ? (
                              <>
                                <span>Show Less</span>
                                <ChevronRight className="w-3 h-3 rotate-90" />
                              </>
                            ) : (
                              <>
                                <span>Show {taskGroup.screenshots.length - 4} More</span>
                                <ChevronRight className="w-3 h-3" />
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};