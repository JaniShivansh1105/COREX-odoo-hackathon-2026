const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const { permissions } = require('../middleware/roleAuth');

/**
 * User Routes
 * Base: /api/users
 */

// @route   GET /api/users/technicians
// @desc    Get all technicians
// @access  All authenticated users
router.get('/technicians', auth, userController.getTechnicians);

// @route   GET /api/users
// @desc    Get all users with filters
// @access  Admin, Manager
router.get('/', auth, permissions.adminAndManager, userController.getAllUsers);

module.exports = router;
