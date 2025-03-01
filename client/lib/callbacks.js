'use client';

import { api } from '@/lib/api';
import { getCookie } from '@/lib/cookie';

/**
 * Task related callbacks
 */
export const taskCallbacks = {
  /**
   * Handle task submission
   * @param {string} task - The task content
   * @param {Function} router - Next.js router
   * @param {Function} setError - Function to set error state
   * @returns {Promise<void>}
   */
  handleTaskSubmit: async (task, router, setError) => {
    try {
      const response = await api.tasks.create(task);

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      const data = await response.json();
      router.push(`/app/task/${data.id}`);
    } catch (error) {
      setError('Failed to create task');
      console.error('Error:', error);
    }
  },
};

/**
 * Authentication related callbacks
 */
export const authCallbacks = {
  /**
   * Handle login form submission
   * @param {Object} formData - The login form data
   * @param {Function} router - Next.js router
   * @param {Function} setError - Function to set error state
   * @param {Function} setIsLoading - Function to set loading state
   * @returns {Promise<void>}
   */
  handleLogin: async (formData, router, setError, setIsLoading) => {
    setError('');
    setIsLoading(true);
    
    try {
      const res = await api.auth.login(formData);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.details || data.error || 'Login failed');
      }
      
      // The token is set by the API function
      router.push('/app');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  },

  /**
   * Handle registration form submission
   * @param {Object} formData - The registration form data
   * @param {Function} router - Next.js router
   * @param {Function} setError - Function to set error state
   * @param {Function} setIsLoading - Function to set loading state
   * @returns {Promise<void>}
   */
  handleRegister: async (formData, router, setError, setIsLoading) => {
    setError('');
    setIsLoading(true);
    
    try {
      const res = await api.auth.register(formData);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.details || data.error || 'Registration failed');
      }
      
      router.push('/auth/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  },

  /**
   * Handle logout
   */
  handleLogout: () => {
    api.auth.logout();
  },
};

/**
 * Input related callbacks
 */
export const inputCallbacks = {
  /**
   * Handle textarea change
   * @param {Event} e - The change event
   * @param {Function} setRows - Function to set rows state
   * @param {Function} setTask - Function to set task state
   */
  handleTextareaChange: (e, setRows, setTask) => {
    const textareaLineHeight = 24;
    const previousRows = e.target.rows;
    e.target.rows = 2;
    const currentRows = ~~(e.target.scrollHeight / textareaLineHeight);
    if (currentRows === previousRows) {
      e.target.rows = currentRows;
    }
    setRows(currentRows);
    setTask(e.target.value);
  },

  /**
   * Handle key down event
   * @param {Event} e - The keydown event
   * @param {string} task - The task content
   * @param {Function} setActive - Function to set active state
   */
  handleKeyDown: (e, task, setActive) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (task.trim() !== '') {   
        setActive(true);
      }
    }
  },

  /**
   * Handle global key down event for keyboard shortcuts
   * @param {Event} e - The keydown event
   * @param {Object} textareaRef - Reference to the textarea element
   */
  handleGlobalKeyDown: (e, textareaRef) => {
    // Check for Command+K (Mac) or Control+K (Windows/Linux)
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault(); // Prevent default browser behavior
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  },

  /**
   * Make task active
   * @param {string} task - The task content
   * @param {Function} setActive - Function to set active state
   */
  makeTaskActive: (task, setActive) => {
    if (task.trim() !== '') {   
      setActive(true);
    }
  },

  /**
   * Handle container click
   * @param {Event} e - The click event
   * @param {Object} textareaRef - Reference to the textarea element
   */
  handleContainerClick: (e, textareaRef) => {
    if (e.target.tagName !== 'P' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'SVG') {
      textareaRef.current.focus();
    }
  },
};
