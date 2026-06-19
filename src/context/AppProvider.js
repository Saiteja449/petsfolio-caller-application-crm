import React from 'react';
import { AuthProvider } from './AuthContext';
import { CallProvider } from './CallContext';
import { AnalyticsProvider } from './AnalyticsContext';
import { ContactProvider } from './ContactContext';
import { LeadsProvider } from './LeadsContext';

export const AppProvider = ({ children }) => (
  <AuthProvider>
    <LeadsProvider>
      <CallProvider>
        <AnalyticsProvider>
          <ContactProvider>
            {children}
          </ContactProvider>
        </AnalyticsProvider>
      </CallProvider>
    </LeadsProvider>
  </AuthProvider>
);

export default AppProvider;
