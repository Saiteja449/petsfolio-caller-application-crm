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
      setLeads(response.data.data || response.data);
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
      const optimisticLead = {
        ...existingLead,
        ...updatedFields,
        notes:
          updatedFields.comments !== undefined
            ? updatedFields.comments
            : existingLead.notes,
      };
      setLeads(prev =>
        prev.map(lead => (lead.id === id ? optimisticLead : lead)),
      );

      // Update standard fields in background
      const leadUpdatePayload = {
        name: updatedFields.name,
        phone: updatedFields.phone,
        status: updatedFields.status,
        service: updatedFields.service,
        nextFollowUp: updatedFields.nextFollowUp,
        notes: updatedFields.comments,
      };

      if (updatedFields.importantLead !== undefined) {
        leadUpdatePayload.importantLead = updatedFields.importantLead;
      }

      let requestPayload = leadUpdatePayload;
      let requestConfig = config;

      if (updatedFields.recordingPath) {
        requestPayload = new FormData();
        Object.keys(leadUpdatePayload).forEach(key => {
          if (leadUpdatePayload[key] !== undefined) {
            requestPayload.append(key, leadUpdatePayload[key]);
          }
        });
        const filename = updatedFields.recordingPath.split('/').pop();
        requestPayload.append('recording', {
          uri: 'file://' + updatedFields.recordingPath,
          name: filename,
          type: 'audio/mp4',
        });
        requestConfig = {
          ...config,
          headers: {
            ...config.headers,
            'Content-Type': 'multipart/form-data',
          },
        };
      }

      // Fire and forget API calls
      (async () => {
        try {
          let updatedLeadData;
          
          if (updatedFields.recordingPath) {
            const fetchResponse = await fetch(`${API_ENDPOINTS.LEADS.BASE}/${id}`, {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${user?.token}`,
              },
              body: requestPayload,
            });
            const jsonResponse = await fetchResponse.json();
            if (!fetchResponse.ok) throw new Error(jsonResponse.message || 'Update failed');
            updatedLeadData = jsonResponse.data || jsonResponse;
          } else {
            const response = await axios.put(
              `${API_ENDPOINTS.LEADS.BASE}/${id}`,
              requestPayload,
              requestConfig,
            );
            updatedLeadData = response.data.data || response.data;
          }

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
                notes:
                  updatedFields.comments ||
                  `Routine followup scheduled via ${
                    updatedFields.followupType || 'Call'
                  }`,
                author: authorName,
                done: false,
              },
              config,
            );
          } else {
            const changes = [];
            if (
              updatedFields.assignedTo &&
              updatedFields.assignedTo !== existingLead.assignedTo
            ) {
              changes.push(
                `assignee from "${existingLead.assignedTo}" to "${updatedFields.assignedTo}"`,
              );
            }
            if (
              updatedFields.status &&
              updatedFields.status !== existingLead.status
            ) {
              changes.push(`status to "${updatedFields.status}"`);
            }
            if (
              updatedFields.importantLead !== undefined &&
              updatedFields.importantLead !== existingLead.importantLead
            ) {
              changes.push(
                updatedFields.importantLead
                  ? 'marked as Important Hot Lead'
                  : 'removed Important Hot Lead status',
              );
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
                  time: now.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                  priority: 'Low',
                  notes: `Updated properties: ${changes.join(
                    ', ',
                  )} by ${authorName}`,
                  author: authorName,
                  done: true,
                },
                config,
              );
            }
          }
        } catch (e) {
          console.error('Background update failed', e?.response?.data || e.message || e);
        }
      })();

      return { success: true, data: optimisticLead };
    } catch (error) {
      console.error('Error updating lead:', error);
      return { success: false, error };
    }
  };

  const createLead = async leadData => {
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
        service: leadData.service || 'General Enquiry',
        status: leadData.status || 'New',
        assignedTo: user?.name || 'Unassigned',
        nextFollowUp: leadData.nextFollowUp || '',
        notes: leadData.comments || leadData.notes || '',
      };

      // Optimistic create (generate fake ID temporarily)
      const tempId = `temp-${Date.now()}`;
      const optimisticNewLead = { ...payload, id: tempId };
      setLeads(prev => [optimisticNewLead, ...prev]);

      let requestPayload = payload;
      let requestConfig = config;

      if (leadData.recordingPath) {
        requestPayload = new FormData();
        Object.keys(payload).forEach(key => {
          if (payload[key] !== undefined) {
            requestPayload.append(key, payload[key]);
          }
        });
        const filename = leadData.recordingPath.split('/').pop();
        requestPayload.append('recording', {
          uri: 'file://' + leadData.recordingPath,
          name: filename,
          type: 'audio/mp4',
        });
        requestConfig = {
          ...config,
          headers: {
            ...config.headers,
            'Content-Type': 'multipart/form-data',
          },
        };
      }

      // Fire and forget
      if (leadData.recordingPath) {
        fetch(API_ENDPOINTS.LEADS.BASE, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
          body: requestPayload,
        })
          .then(async (response) => {
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Create failed');
            const actualLead = data.data || data;
            setLeads(prev => prev.map(l => (l.id === tempId ? actualLead : l)));
          })
          .catch(err => {
            console.error('Background create failed (fetch)', err);
            setLeads(prev => prev.filter(l => l.id !== tempId));
            fetchLeads();
          });
      } else {
        axios
          .post(API_ENDPOINTS.LEADS.BASE, requestPayload, requestConfig)
          .then(response => {
            const actualLead = response.data.data || response.data;
            setLeads(prev => prev.map(l => (l.id === tempId ? actualLead : l)));
          })
          .catch(err => {
            console.error('Background create failed (axios)', err?.response?.data || err);
            setLeads(prev => prev.filter(l => l.id !== tempId));
            if (err.response && err.response.status === 400) fetchLeads();
          });
      }

      return { success: true, data: optimisticNewLead };
    } catch (error) {
      console.error('Error creating lead:', error);
      return { success: false, error };
    }
  };

  const fetchPaginatedLeads = async ({
    page = 0,
    limit = 10,
    search = '',
    leadTypeTab = 'New',
  }) => {
    if (!user)
      return { leads: [], totalCount: 0, totalPages: 0, tabCounts: {} };
    try {
      const config = {};
      if (user.token) {
        config.headers = {
          Authorization: `Bearer ${user.token}`,
        };
      }
      const response = await axios.get(
        `${API_ENDPOINTS.LEADS.BASE}/paginated`,
        {
          params: {
            page,
            limit,
            search,
            leadTypeTab,
            currentUserRole: user.role || '',
            currentUserName: user.name || '',
          },
          ...config,
        },
      );
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
