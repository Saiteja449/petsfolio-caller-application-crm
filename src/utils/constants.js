// API Base URL - Update this when deploying or changing local IP
export const BASE_URL = 'https://crm-backend-sooty-six.vercel.app/api';

export const API_ENDPOINTS = {
  AUTH: {
    SEND_OTP: `${BASE_URL}/auth/send-otp`,
    VERIFY_OTP: `${BASE_URL}/auth/verify-otp`,
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
};
