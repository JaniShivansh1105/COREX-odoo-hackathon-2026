const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');
const { permissions } = require('../middleware/roleAuth');

/**
 * Report Routes
 * Base: /api/reports
 */

// @route   GET /api/reports/by-team
// @desc    Get reports by maintenance team
// @access  Admin, Manager
router.get('/by-team', auth, permissions.adminAndManager, reportController.getReportsByTeam);

// @route   GET /api/reports/by-category
// @desc    Get reports by equipment category
// @access  Admin, Manager
router.get('/by-category', auth, permissions.adminAndManager, reportController.getReportsByCategory);

module.exports = router;
