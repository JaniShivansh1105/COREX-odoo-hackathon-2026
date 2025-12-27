import axiosInstance from './axios';

/**
 * Authentication API Service
 * Handles all auth-related API calls
 */

/**
 * Register a new user
 * @param {Object} userData - { name, email, password, role }
 * @returns {Promise} API response
 */
export const register = async (userData) => {
  const response = await axiosInstance.post('/auth/register', userData);
  return response.data;
};

/**
 * Login user
 * @param {Object} credentials - { email, password }
 * @returns {Promise} API response with token and user data
 */
export const login = async (credentials) => {
  const response = await axiosInstance.post('/auth/login', credentials);
  return response.data;
};

/**
 * Get current logged-in user
 * @returns {Promise} API response with user data
 */
export const getCurrentUser = async () => {
  const response = await axiosInstance.get('/auth/me');
  return response.data;
};
