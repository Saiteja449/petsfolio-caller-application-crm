import React from 'react';
import { AuthProvider } from './AuthContext';
import { CallProvider } from './CallContext';
import { AnalyticsProvider } from './AnalyticsContext';
import { ContactProvider } from './ContactContext';
import { LeadsProvider } from './LeadsContext';

export const AppProvider = ({ children }) => (
  <AuthProvider>
    <CallProvider>
      <AnalyticsProvider>
        <ContactProvider>
          <LeadsProvider>
            {children}
          </LeadsProvider>
        </ContactProvider>
      </AnalyticsProvider>
    </CallProvider>
  </AuthProvider>
);

export default AppProvider;
