import { useState, useEffect } from 'react';
import { User } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate checking for existing auth
    const checkAuth = async () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    
    // Simulate Google OAuth flow
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockUser: User = {
        id: '1',
        email: 'user@example.com',
        name: 'John Doe',
        avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2'
      };
      
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
    } catch (error) {
      console.error('Sign in failed:', error);
    } finally {
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