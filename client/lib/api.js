export const API_URL = process.env.NEXT_PUBLIC_API_URL;

import { setCookie, removeCookie, getCookie } from '@/lib/cookie';

// Wrapper function to handle API responses and check for unauthorized errors
const apiRequest = async (url, options = {}) => {
  try {
    const res = await fetch(url, options);
    
    // Check if response is ok
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      
      // Handle unauthorized token error
      if (errorData.error === "Unauthorized - Invalid token") {
        // Clear token and other auth data
        removeCookie('token');
        removeCookie('userData');
        
        // Force redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
      }
      
      // Still return the response for further handling
      return res;
    }
    
    return res;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Function to get the auth token
const getToken = () => {
  return getCookie('token');
};

// Function to add auth header to request options if token exists
const withAuth = (options = {}) => {
  const token = getToken();
  if (token) {
    return {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    };
  }
  return options;
};

export const auth = {
  register: async (userData) => {
    return apiRequest(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
  },

  login: async (credentials) => {
    const response = await apiRequest(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    // If login was successful, set the token cookie
    if (response.ok) {
      const data = await response.json();
      if (data.token) {
        setCookie('token', data.token, 1); // Store token for 1 day
        
        // Store basic user data if available
        try {
          const payload = JSON.parse(atob(data.token.split('.')[1]));
          if (payload) {
            setCookie('userData', JSON.stringify({
              userId: payload.userId,
              email: payload.email
            }), 1);
          }
        } catch (e) {
          console.error('Error parsing JWT token:', e);
        }
      }
      
      // Return a new Response object with the same status and headers
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: response.headers
      });
    }
    
    return response;
  },

  logout: () => {
    removeCookie('token');
    removeCookie('userData');
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  },

  protected: async () => {
    return apiRequest(`${API_URL}/protected`, withAuth());
  },

  userData: async () => {
    return apiRequest(`${API_URL}/user-data`, withAuth());
  }
};

export const api = {
  auth,
  
  tasks: {
    create: async (name) => {
      return apiRequest(`${API_URL}/tasks`, withAuth({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name })
      }));
    },

    getById: async (taskId) => {
      return apiRequest(`${API_URL}/tasks/${taskId}`, withAuth());
    },

    list: async () => {
      return apiRequest(`${API_URL}/tasks`, withAuth());
    },

    delete: async (taskId) => {
      return apiRequest(`${API_URL}/tasks/${taskId}`, withAuth({
        method: 'DELETE'
      }));
    },
    
    getSteps: async (taskId) => {
      return apiRequest(`${API_URL}/tasks/${taskId}/steps`, withAuth());
    }
  }
};
