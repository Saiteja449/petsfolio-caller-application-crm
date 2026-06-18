import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const LeadsContext = createContext(null);

export const LeadsProvider = ({ children }) => {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    // Mock leads
    const mockLeads = [
      {
        id: 'lead-1',
        name: 'John Doe',
        phone: '+1 555-123-4567',
        email: 'john@example.com',
        source: 'Website',
        service: 'Grooming',
        stage: 'New Lead',
        assignedTo: 'Sales Agent',
        status: 'New',
        date: new Date().toISOString(),
      },
      {
        id: 'lead-2',
        name: 'Sarah Smith',
        phone: '+1 555-987-6543',
        email: 'sarah@example.com',
        source: 'WhatsApp',
        service: 'Walking',
        stage: 'Discussed',
        assignedTo: 'Sales Agent',
        status: 'Follow Up',
        date: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'lead-3',
        name: 'Mike Johnson',
        phone: '+1 555-456-7890',
        email: 'mike@example.com',
        source: 'Call',
        service: 'Training',
        stage: 'Meeting Scheduled',
        assignedTo: 'Sales Agent',
        status: 'Joined',
        date: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: 'lead-4',
        name: 'Emma Davis',
        phone: '+1 555-222-3333',
        email: 'emma@example.com',
        source: 'Meta Ads',
        service: 'Grooming',
        stage: 'New Lead',
        assignedTo: 'Other Agent', // Different assignee
        status: 'New',
        date: new Date().toISOString(),
      }
    ];

    setLeads(mockLeads);
  }, []);

  const getMyLeads = () => {
    return leads.filter(lead => lead.assignedTo === user?.name);
  };

  const updateLead = (id, updatedFields) => {
    setLeads(prev => prev.map(lead => lead.id === id ? { ...lead, ...updatedFields } : lead));
  };

  return (
    <LeadsContext.Provider
      value={{
        leads,
        getMyLeads,
        setLeads,
        updateLead,
      }}
    >
      {children}
    </LeadsContext.Provider>
  );
};

export const useLeads = () => {
  const context = useContext(LeadsContext);
  if (!context) throw new Error('useLeads must be used within LeadsProvider');
  return context;
};

export default LeadsContext;
