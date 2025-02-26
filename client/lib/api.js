export const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = {
  register: async (userData) => {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return res;
  },

  login: async (credentials) => {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    return res;
  },

  protected: async (token) => {
    const res = await fetch(`${API_URL}/protected`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res;
  },

  userData: async (token) => {
    const res = await fetch(`${API_URL}/user-data`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res;
  },

  tasks: {
    create: async (token, name) => {
      const res = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      });
      return res;
    },

    getById: async (token, taskId) => {
      const res = await fetch(`${API_URL}/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return res;
    },

    list: async (token) => {
      const res = await fetch(`${API_URL}/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return res;
    },

    delete: async (token, taskId) => {
      const res = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return res;
    }
  }
};
