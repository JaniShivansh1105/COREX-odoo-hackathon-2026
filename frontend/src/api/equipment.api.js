import axiosInstance from './axios';

/**
 * Equipment API Service
 * Handles all equipment-related API calls
 */

/**
 * Get all equipment with optional filters
 * @param {Object} params - { category, isActive, search }
 * @returns {Promise} API response with equipment list
 */
export const getAllEquipment = async (params = {}) => {
  const response = await axiosInstance.get('/equipment', { params });
  return response.data;
};

/**
 * Get single equipment by ID
 * @param {string} id - Equipment ID
 * @returns {Promise} API response with equipment data
 */
export const getEquipmentById = async (id) => {
  const response = await axiosInstance.get(`/equipment/${id}`);
  return response.data;
};

/**
 * Create new equipment
 * @param {Object} equipmentData - Equipment data
 * @returns {Promise} API response
 */
export const createEquipment = async (equipmentData) => {
  const response = await axiosInstance.post('/equipment', equipmentData);
  return response.data;
};

/**
 * Update equipment
 * @param {string} id - Equipment ID
 * @param {Object} equipmentData - Updated equipment data
 * @returns {Promise} API response
 */
export const updateEquipment = async (id, equipmentData) => {
  const response = await axiosInstance.put(`/equipment/${id}`, equipmentData);
  return response.data;
};

/**
 * Delete equipment
 * @param {string} id - Equipment ID
 * @returns {Promise} API response
 */
export const deleteEquipment = async (id) => {
  const response = await axiosInstance.delete(`/equipment/${id}`);
  return response.data;
};

/**
 * Get all requests for an equipment
 * @param {string} id - Equipment ID
 * @returns {Promise} API response with requests list
 */
export const getEquipmentRequests = async (id) => {
  const response = await axiosInstance.get(`/equipment/${id}/requests`);
  return response.data;
};

/**
 * Get open requests for an equipment
 * @param {string} id - Equipment ID
 * @returns {Promise} API response with open requests
 */
export const getEquipmentOpenRequests = async (id) => {
  const response = await axiosInstance.get(`/equipment/${id}/requests/open`);
  return response.data;
};

/**
 * Get auto-fill data for maintenance request
 * @param {string} id - Equipment ID
 * @returns {Promise} API response with auto-fill data
 */
export const getEquipmentAutoFill = async (id) => {
  const response = await axiosInstance.get(`/equipment/${id}/auto-fill`);
  return response.data;
};
