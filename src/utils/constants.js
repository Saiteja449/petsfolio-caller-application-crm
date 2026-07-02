// API Base URL - Update this when deploying or changing local IP
export const BASE_URL = 'https://crm-backend-14p9.onrender.com/api';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${BASE_URL}/auth/login`,
  },
  LEADS: {
    BASE: `${BASE_URL}/leads`,
  },
  USERS: {
    BASE: `${BASE_URL}/users`,
  },
  FOLLOWUPS: {
    BASE: `${BASE_URL}/followups`,
  },
  ANALYTICS: {
    LOG_CALL: `${BASE_URL}/analytics/log-call`,
  },
};
