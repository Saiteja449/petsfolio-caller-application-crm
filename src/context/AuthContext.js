import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_ENDPOINTS } from '../utils/constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for saved session on app start
  useEffect(() => {
    const loadSession = async () => {
      try {
        const savedSession = await AsyncStorage.getItem('petsfolio_session_user');
        if (savedSession) {
          const parsedUser = JSON.parse(savedSession);
          setUser(parsedUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Failed to load session:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSession();
  }, []);



  const login = async (email, password) => {
    try {
      const response = await axios.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
      const data = response.data;

      if (data.success === false) {
        return { success: false, message: data.message || 'Login failed' };
      }

      const roleMap = {
        'sales manager': 'Sales Manager',
        'sales person': 'Sales Representative',
        user: 'User',
      };

      const userWithToken = {
        id: data._id,
        name: data.name || email.split('@')[0],
        email: data.email,
        role: roleMap[data.role?.toLowerCase()] || data.role,
        token: data.token,
        avatar: data.name
          ? data.name.substring(0, 2).toUpperCase()
          : email.substring(0, 2).toUpperCase(),
      };

      setUser(userWithToken);
      setIsAuthenticated(true);
      await AsyncStorage.setItem('petsfolio_session_user', JSON.stringify(userWithToken));
      await AsyncStorage.setItem('petsfolio_token', data.token);

      return { success: data.success ?? true, user: userWithToken };
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Network error connecting to server.';
      const success = error.response?.data?.success ?? false;
      return { success, message };
    }
  };

  const logout = async () => {
    setUser(null);
    setIsAuthenticated(false);
    await AsyncStorage.removeItem('petsfolio_session_user');
    await AsyncStorage.removeItem('petsfolio_token');
  };

  const updateProfile = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default AuthContext;
