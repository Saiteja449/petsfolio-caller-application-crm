import React from 'react';
import { AuthProvider } from './AuthContext';
import { CallProvider } from './CallContext';
import { AnalyticsProvider } from './AnalyticsContext';
import { ContactProvider } from './ContactContext';

export const AppProvider = ({ children }) => (
  <AuthProvider>
    <CallProvider>
      <AnalyticsProvider>
        <ContactProvider>
          {children}
        </ContactProvider>
      </AnalyticsProvider>
    </CallProvider>
  </AuthProvider>
);

export default AppProvider;
