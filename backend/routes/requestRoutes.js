const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const auth = require('../middleware/auth');
const { permissions } = require('../middleware/roleAuth');

/**
 * Maintenance Request Routes
 * Base: /api/requests
 */

// Special routes must come before parameterized routes

// @route   GET /api/requests/calendar
// @desc    Get calendar view of scheduled requests
// @access  All authenticated users
router.get('/calendar', auth, requestController.getCalendarRequests);

// @route   GET /api/requests/overdue
// @desc    Get overdue requests
// @access  Admin, Manager, Technician
router.get('/overdue', auth, permissions.adminManagerTechnician, requestController.getOverdueRequests);

// @route   POST /api/requests
// @desc    Create new maintenance request
// @access  All authenticated users
router.post('/', auth, requestController.createRequest);

// @route   GET /api/requests
// @desc    Get all maintenance requests with filters
// @access  Role-based access
router.get('/', auth, requestController.getAllRequests);

// @route   GET /api/requests/:id
// @desc    Get single request by ID
// @access  All authenticated users (with role-based visibility)
router.get('/:id', auth, requestController.getRequestById);

// @route   PUT /api/requests/:id
// @desc    Update maintenance request
// @access  Admin, Manager, or assigned Technician
router.put('/:id', auth, requestController.updateRequest);

// @route   PATCH /api/requests/:id/stage
// @desc    Update request stage
// @access  Admin, Manager, or assigned Technician
router.patch('/:id/stage', auth, requestController.updateRequestStage);

// @route   PATCH /api/requests/:id/assign
// @desc    Assign technician to request
// @access  Admin, Manager
router.patch('/:id/assign', auth, permissions.adminAndManager, requestController.assignTechnician);

// @route   DELETE /api/requests/:id
// @desc    Delete maintenance request
// @access  Admin, Manager
router.delete('/:id', auth, permissions.adminAndManager, requestController.deleteRequest);

module.exports = router;
