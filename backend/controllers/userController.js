const User = require('../models/User');

/**
 * Get all users with filters
 * GET /api/users?role=
 * Access: Admin, Manager
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = {};

    if (role) filter.role = role;

    const users = await User.find(filter)
      .populate('team', 'teamName specialization')
      .select('-password')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users.',
      error: error.message,
    });
  }
};

/**
 * Get all technicians
 * GET /api/users/technicians
 * Access: All authenticated users
 */
exports.getTechnicians = async (req, res) => {
  try {
    const technicians = await User.find({ role: 'Technician' })
      .populate('team', 'teamName specialization')
      .select('name email team')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: technicians.length,
      data: technicians,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching technicians.',
      error: error.message,
    });
  }
};
