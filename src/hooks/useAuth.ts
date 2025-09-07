import { useState, useEffect } from 'react';
import { User } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth
    const checkAuth = async () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      setLoading(false);
    };

    checkAuth();

    // Listen for deeplink authentication success
    const handleAuthSuccess = (event: any, userData: any) => {
      console.log('Received auth success:', userData);
      
      if (userData && userData.id && userData.email) {
        const authenticatedUser: User = {
          id: userData.id,
          email: userData.email,
          name: userData.name || userData.email.split('@')[0],
          avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || userData.email)}&background=6366f1&color=fff`
        };
        
        console.log('Setting authenticated user:', authenticatedUser);
        setUser(authenticatedUser);
        localStorage.setItem('user', JSON.stringify(authenticatedUser));
        setLoading(false);
      } else {
        console.log('Invalid user data received:', userData);
        setLoading(false);
      }
    };

    // Set up deeplink listener
    if (window.electronAPI) {
      window.electronAPI.onAuthSuccess(handleAuthSuccess);
    }

    // Cleanup listener on unmount
    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('auth-success');
      }
    };
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    
    try {
      // Open the JiraBridge web authentication URL
      if (window.electronAPI) {
        await window.electronAPI.openAuthUrl();
        // Keep loading state until deeplink is received
        // The loading will be set to false in the handleAuthSuccess callback
      } else {
        // Fallback for web environment
        window.open('https://jirabridge.alchemytech.in/?from=electron', '_blank');
        setLoading(false);
      }
    } catch (error) {
      console.error('Sign in failed:', error);
      setLoading(false);
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return {
    user,
    loading,
    signInWithGoogle,
    signOut
  };
};