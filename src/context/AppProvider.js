import React from 'react';
import { AuthProvider } from './AuthContext';
import { CallProvider } from './CallContext';
import { AnalyticsProvider } from './AnalyticsContext';
import { ContactProvider } from './ContactContext';
import { LeadsProvider } from './LeadsContext';
import { CallQueueProvider } from './CallQueueContext';
import { ToastProvider } from './ToastContext';
import ToastComponent from '../components/ToastComponent';

export const AppProvider = ({ children }) => (
  <ToastProvider>
    <AuthProvider>
      <LeadsProvider>
        <CallProvider>
          <CallQueueProvider>
            <AnalyticsProvider>
              <ContactProvider>
                {children}
                <ToastComponent />
              </ContactProvider>
            </AnalyticsProvider>
          </CallQueueProvider>
        </CallProvider>
      </LeadsProvider>
    </AuthProvider>
  </ToastProvider>
);

export default AppProvider;
