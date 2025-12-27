import axiosInstance from './axios';

/**
 * Report API Service
 * Handles all report-related API calls
 */

/**
 * Get reports by maintenance team
 * @returns {Promise} API response with team reports
 */
export const getReportsByTeam = async () => {
  const response = await axiosInstance.get('/reports/by-team');
  return response.data;
};

/**
 * Get reports by equipment category
 * @returns {Promise} API response with category reports
 */
export const getReportsByCategory = async () => {
  const response = await axiosInstance.get('/reports/by-category');
  return response.data;
};

/**
 * Export as default object for easier imports
 */
export const reportAPI = {
  getReportsByTeam,
  getReportsByCategory,
};
