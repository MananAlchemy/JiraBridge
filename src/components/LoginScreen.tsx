import React from 'react';
import { Camera, Shield, Zap, Chrome } from 'lucide-react';

interface LoginScreenProps {
  onGoogleSignIn: () => void;
  loading: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onGoogleSignIn, loading }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">ScreenCapture Pro</h1>
            <p className="text-gray-600">Secure screenshot management with automatic sync</p>
          </div>

          <div className="space-y-6 mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Secure & Private</h3>
                <p className="text-sm text-gray-600">End-to-end encrypted storage</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Auto Updates</h3>
                <p className="text-sm text-gray-600">Always stay up to date</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Camera className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Smart Capture</h3>
                <p className="text-sm text-gray-600">Automated screenshot management</p>
              </div>
            </div>
          </div>

          <button
            onClick={onGoogleSignIn}
            disabled={loading}
            className="w-full bg-white border-2 border-gray-200 rounded-xl py-3 px-4 flex items-center justify-center space-x-3 hover:border-gray-300 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
            ) : (
              <Chrome className="w-5 h-5 text-gray-700" />
            )}
            <span className="font-medium text-gray-700">
              {loading ? 'Signing in...' : 'Continue with Google'}
            </span>
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};