import axiosInstance from './axios';

/**
 * Maintenance Team API Service
 * Handles all team-related API calls
 */

/**
 * Get all maintenance teams
 * @returns {Promise} API response with teams list
 */
export const getAllTeams = async () => {
  const response = await axiosInstance.get('/teams');
  return response.data;
};

/**
 * Get single team by ID
 * @param {string} id - Team ID
 * @returns {Promise} API response with team data
 */
export const getTeamById = async (id) => {
  const response = await axiosInstance.get(`/teams/${id}`);
  return response.data;
};

/**
 * Create new maintenance team
 * @param {Object} teamData - Team data
 * @returns {Promise} API response
 */
export const createTeam = async (teamData) => {
  const response = await axiosInstance.post('/teams', teamData);
  return response.data;
};

/**
 * Update team
 * @param {string} id - Team ID
 * @param {Object} teamData - Updated team data
 * @returns {Promise} API response
 */
export const updateTeam = async (id, teamData) => {
  const response = await axiosInstance.put(`/teams/${id}`, teamData);
  return response.data;
};

/**
 * Delete team
 * @param {string} id - Team ID
 * @returns {Promise} API response
 */
export const deleteTeam = async (id) => {
  const response = await axiosInstance.delete(`/teams/${id}`);
  return response.data;
};

/**
 * Add member to team
 * @param {string} id - Team ID
 * @param {string} userId - User ID to add
 * @returns {Promise} API response
 */
export const addTeamMember = async (id, userId) => {
  const response = await axiosInstance.post(`/teams/${id}/members`, { userId });
  return response.data;
};

/**
 * Remove member from team
 * @param {string} teamId - Team ID
 * @param {string} userId - User ID to remove
 * @returns {Promise} API response
 */
export const removeTeamMember = async (teamId, userId) => {
  const response = await axiosInstance.delete(`/teams/${teamId}/members/${userId}`);
  return response.data;
};
