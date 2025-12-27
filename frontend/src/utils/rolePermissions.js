import { ROLES } from './constants';

/**
 * Role-based permission helpers
 */

/**
 * Check if user has permission based on allowed roles
 * @param {string} userRole - Current user's role
 * @param {Array<string>} allowedRoles - Array of allowed roles
 * @returns {boolean}
 */
export const hasPermission = (userRole, allowedRoles) => {
  return allowedRoles.includes(userRole);
};

/**
 * Check if user is Admin
 * @param {string} userRole - Current user's role
 * @returns {boolean}
 */
export const isAdmin = (userRole) => {
  return userRole === ROLES.ADMIN;
};

/**
 * Check if user is Admin or Manager
 * @param {string} userRole - Current user's role
 * @returns {boolean}
 */
export const isAdminOrManager = (userRole) => {
  return [ROLES.ADMIN, ROLES.MANAGER].includes(userRole);
};

/**
 * Check if user can manage equipment
 * @param {string} userRole - Current user's role
 * @returns {boolean}
 */
export const canManageEquipment = (userRole) => {
  return isAdminOrManager(userRole);
};

/**
 * Check if user can manage teams
 * @param {string} userRole - Current user's role
 * @returns {boolean}
 */
export const canManageTeams = (userRole) => {
  return isAdminOrManager(userRole);
};

/**
 * Check if user can delete resources
 * @param {string} userRole - Current user's role
 * @returns {boolean}
 */
export const canDelete = (userRole) => {
  return isAdmin(userRole);
};

/**
 * Check if user can view reports
 * @param {string} userRole - Current user's role
 * @returns {boolean}
 */
export const canViewReports = (userRole) => {
  return isAdminOrManager(userRole);
};

/**
 * Check if user can assign technicians
 * @param {string} userRole - Current user's role
 * @returns {boolean}
 */
export const canAssignTechnicians = (userRole) => {
  return isAdminOrManager(userRole);
};

/**
 * Check if user can create maintenance requests
 * @param {string} userRole - Current user's role
 * @returns {boolean}
 */
export const canCreateMaintenanceRequest = (userRole) => {
  return true; // All authenticated users can create requests
};

/**
 * Check if user can edit maintenance requests
 * @param {string} userRole - Current user's role
 * @returns {boolean}
 */
export const canEditMaintenanceRequest = (userRole) => {
  return isAdminOrManager(userRole);
};

/**
 * Check if user can delete maintenance requests
 * @param {string} userRole - Current user's role
 * @returns {boolean}
 */
export const canDeleteMaintenanceRequest = (userRole) => {
  return isAdmin(userRole);
};

/**
 * Check if user can assign technicians to requests
 * @param {string} userRole - Current user's role
 * @returns {boolean}
 */
export const canAssignTechnician = (userRole) => {
  return isAdminOrManager(userRole);
};

/**
 * Check if user can update request stage
 * @param {string} userRole - Current user's role
 * @returns {boolean}
 */
export const canUpdateStage = (userRole) => {
  return isAdminOrManager(userRole);
};
