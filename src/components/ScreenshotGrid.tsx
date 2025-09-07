import React, { useState } from 'react';
import { Trash2, Cloud, CloudOff, Download, Tag, Eye, Grid3X3, ChevronRight } from 'lucide-react';
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
  const [showAll, setShowAll] = useState(false);
  const maxVisible = 4; // Show only 4 screenshots initially

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

  const handleViewAll = () => {
    setShowAll(!showAll);
    logger.info('Toggle view all screenshots:', { showAll: !showAll });
  };

  const visibleScreenshots = showAll ? screenshots : screenshots.slice(0, maxVisible);

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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {visibleScreenshots.map((screenshot) => (
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
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-900">
                {formatUtils.time(screenshot.timestamp)}
              </span>
              <div className="flex items-center space-x-1">
                {screenshot.synced ? (
                  <Cloud className="w-3 h-3 text-green-500" title="Synced" />
                ) : (
                  <CloudOff className="w-3 h-3 text-gray-400" title="Not synced" />
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
            
            <div className="text-xs text-gray-500 truncate">
              {formatUtils.fileSize(screenshot.size)}
            </div>
          </div>
        </div>
      ))}
      </div>
      
      {/* View All Button */}
      {screenshots.length > maxVisible && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleViewAll}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            {showAll ? (
              <>
                <Grid3X3 className="w-4 h-4" />
                <span>Show Less</span>
              </>
            ) : (
              <>
                <span>View All ({screenshots.length})</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};