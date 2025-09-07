import React from 'react';
import { Calendar, Clock, TrendingUp } from 'lucide-react';
import { DailyTimeTracking } from '../types';

interface TimeTrackingHistoryProps {
  dailyData: DailyTimeTracking[];
  getFormattedTime: (milliseconds: number) => string;
}

export const TimeTrackingHistory: React.FC<TimeTrackingHistoryProps> = ({
  dailyData,
  getFormattedTime
}) => {
  const sortedData = [...dailyData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getTotalTime = () => {
    return dailyData.reduce((sum, day) => sum + day.totalTime, 0);
  };

  const getAverageTime = () => {
    return dailyData.length > 0 ? getTotalTime() / dailyData.length : 0;
  };

  const getMostProductiveDay = () => {
    if (dailyData.length === 0) return null;
    return dailyData.reduce((max, day) => 
      day.totalTime > max.totalTime ? day : max
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
          <Calendar className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Time Tracking History</h3>
          <p className="text-sm text-gray-500">Your productivity over time</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Total Time</span>
          </div>
          <p className="text-xl font-bold text-gray-900">
            {getFormattedTime(getTotalTime())}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Average/Day</span>
          </div>
          <p className="text-xl font-bold text-gray-900">
            {getFormattedTime(getAverageTime())}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Days Tracked</span>
          </div>
          <p className="text-xl font-bold text-gray-900">
            {dailyData.length}
          </p>
        </div>
      </div>

      {/* Daily History */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 mb-3">Recent Days</h4>
        {sortedData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No tracking data yet</p>
            <p className="text-sm">Start tracking to see your history here</p>
          </div>
        ) : (
          sortedData.slice(0, 7).map((day) => (
            <div key={day.date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {new Date(day.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-gray-500">
                    {day.sessions.length} session{day.sessions.length !== 1 ? 's' : ''} • {day.screenshotCount} screenshots
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  {getFormattedTime(day.totalTime)}
                </p>
                {day.totalTime > 0 && (
                  <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min((day.totalTime / (8 * 60 * 60 * 1000)) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {getMostProductiveDay() && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Most Productive Day</span>
          </div>
          <p className="text-green-900">
            {new Date(getMostProductiveDay()!.date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })} - {getFormattedTime(getMostProductiveDay()!.totalTime)}
          </p>
        </div>
      )}
    </div>
  );
};
