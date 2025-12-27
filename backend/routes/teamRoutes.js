const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const auth = require('../middleware/auth');
const { permissions } = require('../middleware/roleAuth');

/**
 * Maintenance Team Routes
 * Base: /api/teams
 */

// @route   POST /api/teams
// @desc    Create new maintenance team
// @access  Admin, Manager
router.post('/', auth, permissions.adminAndManager, teamController.createTeam);

// @route   GET /api/teams
// @desc    Get all maintenance teams
// @access  All authenticated users
router.get('/', auth, teamController.getAllTeams);

// @route   GET /api/teams/:id
// @desc    Get single team by ID
// @access  All authenticated users
router.get('/:id', auth, teamController.getTeamById);

// @route   PUT /api/teams/:id
// @desc    Update team
// @access  Admin, Manager
router.put('/:id', auth, permissions.adminAndManager, teamController.updateTeam);

// @route   DELETE /api/teams/:id
// @desc    Delete team
// @access  Admin
router.delete('/:id', auth, permissions.adminOnly, teamController.deleteTeam);

// @route   POST /api/teams/:id/members
// @desc    Add member to team
// @access  Admin, Manager
router.post('/:id/members', auth, permissions.adminAndManager, teamController.addTeamMember);

// @route   DELETE /api/teams/:id/members/:userId
// @desc    Remove member from team
// @access  Admin, Manager
router.delete('/:id/members/:userId', auth, permissions.adminAndManager, teamController.removeTeamMember);

module.exports = router;
