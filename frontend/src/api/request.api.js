import axiosInstance from './axios';

/**
 * Maintenance Request API Service
 * Handles all request-related API calls
 */

/**
 * Get all maintenance requests with optional filters
 * @param {Object} params - { stage, priority, requestType, equipmentId, technicianId }
 * @returns {Promise} API response with requests list
 */
export const getAllRequests = async (params = {}) => {
  const response = await axiosInstance.get('/requests', { params });
  return response.data;
};

/**
 * Get single request by ID
 * @param {string} id - Request ID
 * @returns {Promise} API response with request data
 */
export const getRequestById = async (id) => {
  const response = await axiosInstance.get(`/requests/${id}`);
  return response.data;
};

/**
 * Create new maintenance request
 * @param {Object} requestData - Request data
 * @returns {Promise} API response
 */
export const createRequest = async (requestData) => {
  const response = await axiosInstance.post('/requests', requestData);
  return response.data;
};

/**
 * Update maintenance request
 * @param {string} id - Request ID
 * @param {Object} requestData - Updated request data
 * @returns {Promise} API response
 */
export const updateRequest = async (id, requestData) => {
  const response = await axiosInstance.put(`/requests/${id}`, requestData);
  return response.data;
};

/**
 * Update request stage
 * @param {string} id - Request ID
 * @param {string} stage - New stage (New, In Progress, Repaired, Scrap)
 * @returns {Promise} API response
 */
export const updateRequestStage = async (id, stage) => {
  const response = await axiosInstance.patch(`/requests/${id}/stage`, { stage });
  return response.data;
};

/**
 * Assign technician to request
 * @param {string} id - Request ID
 * @param {string} technicianId - Technician user ID
 * @returns {Promise} API response
 */
export const assignTechnician = async (id, technicianId) => {
  const response = await axiosInstance.patch(`/requests/${id}/assign`, { technicianId });
  return response.data;
};

/**
 * Delete request
 * @param {string} id - Request ID
 * @returns {Promise} API response
 */
export const deleteRequest = async (id) => {
  const response = await axiosInstance.delete(`/requests/${id}`);
  return response.data;
};

/**
 * Get calendar view of scheduled requests
 * @param {Object} params - { startDate, endDate }
 * @returns {Promise} API response with scheduled requests
 */
export const getCalendarRequests = async (params = {}) => {
  const response = await axiosInstance.get('/requests/calendar', { params });
  return response.data;
};

/**
 * Get overdue requests
 * @returns {Promise} API response with overdue requests
 */
export const getOverdueRequests = async () => {
  const response = await axiosInstance.get('/requests/overdue');
  return response.data;
};

/**
 * Update request resolution (duration and notes)
 * @param {string} id - Request ID
 * @param {Object} resolutionData - { durationHours, resolutionNotes }
 * @returns {Promise} API response
 */
export const updateResolution = async (id, resolutionData) => {
  const response = await axiosInstance.put(`/requests/${id}`, resolutionData);
  return response.data;
};

// Export as default object
export const requestAPI = {
  getAllRequests,
  getRequestById,
  createRequest,
  updateRequest,
  updateRequestStage,
  assignTechnician,
  deleteRequest,
  getCalendarRequests,
  getOverdueRequests,
  updateResolution
};
