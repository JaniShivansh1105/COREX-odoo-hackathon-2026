/**
 * Application Constants
 */

// User Roles
export const ROLES = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  TECHNICIAN: 'Technician',
  USER: 'User',
};

// Request Stages
export const REQUEST_STAGES = {
  NEW: 'New',
  IN_PROGRESS: 'In Progress',
  REPAIRED: 'Repaired',
  SCRAP: 'Scrap',
};

// Request Priorities
export const PRIORITIES = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

// Request Types
export const REQUEST_TYPES = {
  CORRECTIVE: 'Corrective',
  PREVENTIVE: 'Preventive',
};

// Ownership Types
export const OWNERSHIP_TYPES = {
  DEPARTMENT: 'Department',
  EMPLOYEE: 'Employee',
};

// Stage Colors for UI
export const STAGE_COLORS = {
  [REQUEST_STAGES.NEW]: 'bg-blue-100 text-blue-800',
  [REQUEST_STAGES.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800',
  [REQUEST_STAGES.REPAIRED]: 'bg-green-100 text-green-800',
  [REQUEST_STAGES.SCRAP]: 'bg-red-100 text-red-800',
};

// Priority Colors for UI
export const PRIORITY_COLORS = {
  [PRIORITIES.LOW]: 'bg-gray-100 text-gray-800',
  [PRIORITIES.MEDIUM]: 'bg-blue-100 text-blue-800',
  [PRIORITIES.HIGH]: 'bg-orange-100 text-orange-800',
  [PRIORITIES.URGENT]: 'bg-red-100 text-red-800',
};
