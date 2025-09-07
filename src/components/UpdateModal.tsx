import React from 'react';
import { Download, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { UpdateInfo } from '../types';

interface UpdateModalProps {
  updateInfo: UpdateInfo;
  downloading: boolean;
  downloadProgress: number;
  installing: boolean;
  onDownload: () => void;
  onInstall: () => void;
  onDismiss: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  updateInfo,
  downloading,
  downloadProgress,
  installing,
  onDownload,
  onInstall,
  onDismiss
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {updateInfo.mandatory ? (
              <AlertTriangle className="w-6 h-6 text-orange-500" />
            ) : (
              <Download className="w-6 h-6 text-blue-500" />
            )}
            <h2 className="text-xl font-bold text-gray-900">
              Update Available
            </h2>
          </div>
          {!updateInfo.mandatory && (
            <button
              onClick={onDismiss}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Version {updateInfo.version}</span>
            {updateInfo.mandatory && (
              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                Required
              </span>
            )}
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-gray-900 mb-2">What's New:</h3>
            <div className="text-sm text-gray-700 whitespace-pre-line">
              {updateInfo.releaseNotes}
            </div>
          </div>
        </div>

        {downloading && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Downloading...</span>
              <span className="text-sm text-gray-500">{downloadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {installing && (
          <div className="mb-6 text-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Installing update...</p>
          </div>
        )}

        <div className="flex space-x-3">
          {!downloading && !installing && downloadProgress === 0 && (
            <button
              onClick={onDownload}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Update</span>
            </button>
          )}
          
          {downloadProgress === 100 && !installing && (
            <button
              onClick={onInstall}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Install & Restart</span>
            </button>
          )}
          
          {!updateInfo.mandatory && !downloading && !installing && (
            <button
              onClick={onDismiss}
              className="px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Later
            </button>
          )}
        </div>
      </div>
    </div>
  );
};