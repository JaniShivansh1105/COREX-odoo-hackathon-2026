const MaintenanceTeam = require('../models/MaintenanceTeam');
const User = require('../models/User');

/**
 * Create new maintenance team
 * POST /api/teams
 * Access: Admin, Manager
 */
exports.createTeam = async (req, res) => {
  try {
    const team = await MaintenanceTeam.create(req.body);
    
    await team.populate([
      { path: 'members', select: 'name email role' },
      { path: 'teamLead', select: 'name email role' },
    ]);

    res.status(201).json({
      success: true,
      message: 'Maintenance team created successfully.',
      data: team,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Team with this name already exists.',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating team.',
      error: error.message,
    });
  }
};

/**
 * Get all maintenance teams
 * GET /api/teams
 * Access: All authenticated users
 */
exports.getAllTeams = async (req, res) => {
  try {
    const teams = await MaintenanceTeam.find()
      .populate('members', 'name email role')
      .populate('teamLead', 'name email role')
      .sort({ teamName: 1 });

    res.status(200).json({
      success: true,
      count: teams.length,
      data: teams,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching teams.',
      error: error.message,
    });
  }
};

/**
 * Get single team by ID
 * GET /api/teams/:id
 * Access: All authenticated users
 */
exports.getTeamById = async (req, res) => {
  try {
    const team = await MaintenanceTeam.findById(req.params.id)
      .populate('members', 'name email role avatar')
      .populate('teamLead', 'name email role avatar');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: team,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching team.',
      error: error.message,
    });
  }
};

/**
 * Update team
 * PUT /api/teams/:id
 * Access: Admin, Manager
 */
exports.updateTeam = async (req, res) => {
  try {
    const team = await MaintenanceTeam.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('members', 'name email role')
      .populate('teamLead', 'name email role');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Team updated successfully.',
      data: team,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating team.',
      error: error.message,
    });
  }
};

/**
 * Delete team
 * DELETE /api/teams/:id
 * Access: Admin
 */
exports.deleteTeam = async (req, res) => {
  try {
    const team = await MaintenanceTeam.findByIdAndDelete(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Team deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting team.',
      error: error.message,
    });
  }
};

/**
 * Add member to team
 * POST /api/teams/:id/members
 * Body: { userId }
 * Access: Admin, Manager
 */
exports.addTeamMember = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required.',
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Add member to team
    const team = await MaintenanceTeam.findById(req.params.id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found.',
      });
    }

    // Check if already a member
    if (team.members.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this team.',
      });
    }

    team.members.push(userId);
    await team.save();

    // Update user's team reference
    user.team = team._id;
    await user.save();

    await team.populate([
      { path: 'members', select: 'name email role' },
      { path: 'teamLead', select: 'name email role' },
    ]);

    res.status(200).json({
      success: true,
      message: 'Member added to team successfully.',
      data: team,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding team member.',
      error: error.message,
    });
  }
};

/**
 * Remove member from team
 * DELETE /api/teams/:id/members/:userId
 * Access: Admin, Manager
 */
exports.removeTeamMember = async (req, res) => {
  try {
    const { id, userId } = req.params;

    const team = await MaintenanceTeam.findById(id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found.',
      });
    }

    // Remove member from team
    team.members = team.members.filter((memberId) => memberId.toString() !== userId);
    await team.save();

    // Update user's team reference
    await User.findByIdAndUpdate(userId, { team: null });

    await team.populate([
      { path: 'members', select: 'name email role' },
      { path: 'teamLead', select: 'name email role' },
    ]);

    res.status(200).json({
      success: true,
      message: 'Member removed from team successfully.',
      data: team,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing team member.',
      error: error.message,
    });
  }
};
