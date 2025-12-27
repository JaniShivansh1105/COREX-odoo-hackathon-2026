const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const auth = require('../middleware/auth');
const { permissions } = require('../middleware/roleAuth');

/**
 * Equipment Routes
 * Base: /api/equipment
 */

// @route   POST /api/equipment
// @desc    Create new equipment
// @access  Admin, Manager
router.post('/', auth, permissions.adminAndManager, equipmentController.createEquipment);

// @route   GET /api/equipment
// @desc    Get all equipment with filters
// @access  All authenticated users
router.get('/', auth, equipmentController.getAllEquipment);

// @route   GET /api/equipment/:id
// @desc    Get single equipment by ID
// @access  All authenticated users
router.get('/:id', auth, equipmentController.getEquipmentById);

// @route   PUT /api/equipment/:id
// @desc    Update equipment
// @access  Admin, Manager
router.put('/:id', auth, permissions.adminAndManager, equipmentController.updateEquipment);

// @route   DELETE /api/equipment/:id
// @desc    Delete equipment
// @access  Admin
router.delete('/:id', auth, permissions.adminOnly, equipmentController.deleteEquipment);

// @route   GET /api/equipment/:id/requests
// @desc    Get all maintenance requests for equipment
// @access  All authenticated users
router.get('/:id/requests', auth, equipmentController.getEquipmentRequests);

// @route   GET /api/equipment/:id/requests/open
// @desc    Get open maintenance requests for equipment
// @access  All authenticated users
router.get('/:id/requests/open', auth, equipmentController.getEquipmentOpenRequests);

// @route   GET /api/equipment/:id/auto-fill
// @desc    Get auto-fill data for maintenance request form
// @access  All authenticated users
router.get('/:id/auto-fill', auth, equipmentController.getEquipmentAutoFill);

module.exports = router;
