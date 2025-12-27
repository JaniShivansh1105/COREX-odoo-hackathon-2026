const Equipment = require('../models/Equipment');
const MaintenanceRequest = require('../models/MaintenanceRequest');

/**
 * Create new equipment
 * POST /api/equipment
 * Access: Admin, Manager
 */
exports.createEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.create(req.body);
    
    await equipment.populate([
      { path: 'maintenanceTeam', select: 'teamName specialization' },
      { path: 'defaultTechnician', select: 'name email' },
      { path: 'assignedEmployee', select: 'name email' },
    ]);

    res.status(201).json({
      success: true,
      message: 'Equipment created successfully.',
      data: equipment,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Equipment with this serial number already exists.',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating equipment.',
      error: error.message,
    });
  }
};

/**
 * Get all equipment with filters
 * GET /api/equipment?category=&isActive=&search=
 * Access: All authenticated users
 */
exports.getAllEquipment = async (req, res) => {
  try {
    const { category, isActive, search } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { equipmentName: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const equipment = await Equipment.find(filter)
      .populate('maintenanceTeam', 'teamName specialization')
      .populate('defaultTechnician', 'name email')
      .populate('assignedEmployee', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: equipment.length,
      data: equipment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching equipment.',
      error: error.message,
    });
  }
};

/**
 * Get single equipment by ID
 * GET /api/equipment/:id
 * Access: All authenticated users
 */
exports.getEquipmentById = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id)
      .populate('maintenanceTeam', 'teamName specialization members')
      .populate('defaultTechnician', 'name email role')
      .populate('assignedEmployee', 'name email');

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: equipment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching equipment.',
      error: error.message,
    });
  }
};

/**
 * Update equipment
 * PUT /api/equipment/:id
 * Access: Admin, Manager
 */
exports.updateEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('maintenanceTeam', 'teamName specialization')
      .populate('defaultTechnician', 'name email')
      .populate('assignedEmployee', 'name email');

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Equipment updated successfully.',
      data: equipment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating equipment.',
      error: error.message,
    });
  }
};

/**
 * Delete equipment
 * DELETE /api/equipment/:id
 * Access: Admin
 */
exports.deleteEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndDelete(req.params.id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Equipment deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting equipment.',
      error: error.message,
    });
  }
};

/**
 * Get all maintenance requests for an equipment
 * GET /api/equipment/:id/requests
 * Access: All authenticated users
 */
exports.getEquipmentRequests = async (req, res) => {
  try {
    const requests = await MaintenanceRequest.find({ equipment: req.params.id })
      .populate('assignedTechnician', 'name email')
      .populate('createdBy', 'name email')
      .populate('maintenanceTeam', 'teamName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching equipment requests.',
      error: error.message,
    });
  }
};

/**
 * Get open maintenance requests for an equipment
 * GET /api/equipment/:id/requests/open
 * Access: All authenticated users
 */
exports.getEquipmentOpenRequests = async (req, res) => {
  try {
    const requests = await MaintenanceRequest.find({
      equipment: req.params.id,
      stage: { $nin: ['Repaired', 'Scrap'] },
    })
      .populate('assignedTechnician', 'name email')
      .populate('createdBy', 'name email')
      .populate('maintenanceTeam', 'teamName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching open requests.',
      error: error.message,
    });
  }
};

/**
 * Get auto-fill data for maintenance request form
 * GET /api/equipment/:id/auto-fill
 * Access: All authenticated users
 */
exports.getEquipmentAutoFill = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id)
      .populate('maintenanceTeam', 'teamName specialization')
      .populate('defaultTechnician', 'name email');

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found.',
      });
    }

    if (!equipment.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This equipment is marked as scrapped/inactive and cannot have new requests.',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        equipmentCategory: equipment.category,
        maintenanceTeam: equipment.maintenanceTeam,
        defaultTechnician: equipment.defaultTechnician,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching auto-fill data.',
      error: error.message,
    });
  }
};
