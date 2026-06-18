import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    id: 'emp_001',
    name: 'Sales Agent',
    designation: 'Sales Executive',
    employeeId: 'EMP-001',
    mobile: '+1 234 567 8900',
    email: 'agent@company.com',
    photo: 'https://i.pravatar.cc/150?img=11',
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = (email) => {
    setIsAuthenticated(true);
    setUser((prev) => ({ ...prev, email }));
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const updateProfile = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
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
