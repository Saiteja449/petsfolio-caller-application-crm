import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { API_ENDPOINTS } from '../utils/constants';

const LeadsContext = createContext(null);

export const LeadsProvider = ({ children }) => {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchLeads = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const config = {};
      if (user.token) {
        config.headers = {
          Authorization: `Bearer ${user.token}`,
        };
      }
      const response = await axios.get(API_ENDPOINTS.LEADS.BASE, config);
      setLeads(response.data);
      setHasFetched(true);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLeads();
    } else {
      setLeads([]);
    }
  }, [user]);

  const getMyLeads = () => {
    return leads.filter(lead => lead.assignedTo === user?.name);
  };

  const updateLead = async (id, updatedFields) => {
    try {
      const config = {};
      if (user?.token) {
        config.headers = {
          Authorization: `Bearer ${user.token}`,
        };
      }

      const existingLead = leads.find(l => l.id === id);
      if (!existingLead) return { success: false, error: 'Lead not found' };

      // Optimistic UI Update - Instant visual feedback
      const optimisticLead = { ...existingLead, ...updatedFields };
      setLeads(prev => prev.map(lead => lead.id === id ? optimisticLead : lead));

      // Update standard fields in background
      const leadUpdatePayload = {
        name: updatedFields.name,
        phone: updatedFields.phone,
        status: updatedFields.status,
        service: updatedFields.service,
        nextFollowUp: updatedFields.nextFollowUp,
      };

      if (updatedFields.importantLead !== undefined) {
        leadUpdatePayload.importantLead = updatedFields.importantLead;
      }

      // Fire and forget API calls
      (async () => {
        try {
          const response = await axios.put(`${API_ENDPOINTS.LEADS.BASE}/${id}`, leadUpdatePayload, config);
          const updatedLeadData = response.data;

          const authorName = user?.name || 'Mobile App';

          if (updatedFields.status === 'Follow Up') {
            await axios.post(
              API_ENDPOINTS.FOLLOWUPS.BASE,
              {
                leadId: id,
                leadName: updatedLeadData.name || existingLead.name,
                type: updatedFields.followupType || 'Call',
                date: updatedFields.nextFollowUp,
                time: '11:00 AM',
                priority: updatedFields.importantLead ? 'High' : 'Medium',
                notes: updatedFields.comments || `Routine followup scheduled via ${updatedFields.followupType || 'Call'}`,
                author: authorName,
                done: false,
              },
              config
            );
          } else {
            const changes = [];
            if (updatedFields.assignedTo && updatedFields.assignedTo !== existingLead.assignedTo) {
              changes.push(`assignee from "${existingLead.assignedTo}" to "${updatedFields.assignedTo}"`);
            }
            if (updatedFields.status && updatedFields.status !== existingLead.status) {
              changes.push(`status to "${updatedFields.status}"`);
            }
            if (updatedFields.importantLead !== undefined && updatedFields.importantLead !== existingLead.importantLead) {
              changes.push(updatedFields.importantLead ? 'marked as Important Hot Lead' : 'removed Important Hot Lead status');
            }

            if (changes.length > 0) {
              const now = new Date();
              await axios.post(
                API_ENDPOINTS.FOLLOWUPS.BASE,
                {
                  leadId: id,
                  leadName: updatedLeadData.name || existingLead.name,
                  type: 'Lead Edited',
                  date: now.toISOString().split('T')[0],
                  time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  priority: 'Low',
                  notes: `Updated properties: ${changes.join(', ')} by ${authorName}`,
                  author: authorName,
                  done: true,
                },
                config
              );
            }
          }
        } catch (e) {
          console.error('Background update failed', e);
        }
      })();

      return { success: true, data: optimisticLead };
    } catch (error) {
      console.error('Error updating lead:', error);
      return { success: false, error };
    }
  };

  const createLead = async (leadData) => {
    try {
      const config = {};
      if (user?.token) {
        config.headers = {
          Authorization: `Bearer ${user.token}`,
        };
      }
      
      const payload = {
        name: leadData.name || 'Unknown Caller',
        phone: leadData.phone,
        source: leadData.source || 'Call',
        service: leadData.service || 'Unknown',
        status: leadData.status || 'New',
        assignedTo: user?.name || 'Unassigned',
      };

      // Optimistic create (generate fake ID temporarily)
      const tempId = `temp-${Date.now()}`;
      const optimisticNewLead = { ...payload, id: tempId };
      setLeads(prev => [optimisticNewLead, ...prev]);

      // Fire and forget
      axios.post(API_ENDPOINTS.LEADS.BASE, payload, config)
        .then(response => {
          const actualLead = response.data;
          // Swap temp ID for real ID
          setLeads(prev => prev.map(l => l.id === tempId ? actualLead : l));
        })
        .catch(err => console.error('Background create failed', err));

      return { success: true, data: optimisticNewLead };
    } catch (error) {
      console.error('Error creating lead:', error);
      return { success: false, error };
    }
  };

  const fetchPaginatedLeads = async ({ page = 0, limit = 10, search = '', leadTypeTab = 'New' }) => {
    if (!user) return { leads: [], totalCount: 0, totalPages: 0, tabCounts: {} };
    try {
      const config = {};
      if (user.token) {
        config.headers = {
          Authorization: `Bearer ${user.token}`,
        };
      }
      const response = await axios.get(`${API_ENDPOINTS.LEADS.BASE}/paginated`, {
        params: {
          page,
          limit,
          search,
          leadTypeTab,
          currentUserRole: user.role || '',
          currentUserName: user.name || '',
        },
        ...config,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching paginated leads:', error);
      return { leads: [], totalCount: 0, totalPages: 0, tabCounts: {} };
    }
  };

  return (
    <LeadsContext.Provider
      value={{
        leads,
        loading,
        hasFetched,
        fetchLeads,
        fetchPaginatedLeads,
        getMyLeads,
        setLeads,
        updateLead,
        createLead,
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
