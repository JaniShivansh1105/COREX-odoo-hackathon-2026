import axiosInstance from './axios';

/**
 * User API Service
 * Handles all user-related API calls
 */

/**
 * Get all users with optional role filter
 * @param {Object} params - { role }
 * @returns {Promise} API response with users list
 */
export const getAllUsers = async (params = {}) => {
  const response = await axiosInstance.get('/users', { params });
  return response.data;
};

/**
 * Get all technicians
 * @returns {Promise} API response with technicians list
 */
export const getTechnicians = async () => {
  const response = await axiosInstance.get('/users/technicians');
  return response.data;
};
