import React from 'react';
import { AuthProvider } from './AuthContext';
import { CallProvider } from './CallContext';
import { AnalyticsProvider } from './AnalyticsContext';
import { ContactProvider } from './ContactContext';
import { LeadsProvider } from './LeadsContext';
import { ToastProvider } from './ToastContext';
import ToastComponent from '../components/ToastComponent';

export const AppProvider = ({ children }) => (
  <ToastProvider>
    <AuthProvider>
      <LeadsProvider>
        <CallProvider>
          <AnalyticsProvider>
            <ContactProvider>
              {children}
              <ToastComponent />
            </ContactProvider>
          </AnalyticsProvider>
        </CallProvider>
      </LeadsProvider>
    </AuthProvider>
  </ToastProvider>
);

export default AppProvider;
