const MaintenanceRequest = require('../models/MaintenanceRequest');
const Equipment = require('../models/Equipment');

/**
 * Create new maintenance request
 * POST /api/requests
 * Access: All authenticated users
 */
exports.createRequest = async (req, res) => {
  try {
    const { equipment: equipmentId, ...requestData } = req.body;

    // Validate equipment exists and is active
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found.',
      });
    }

    if (!equipment.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create request for inactive/scrapped equipment.',
      });
    }

    // Auto-fill fields from equipment
    const request = await MaintenanceRequest.create({
      ...requestData,
      equipment: equipmentId,
      equipmentCategory: equipment.category,
      maintenanceTeam: equipment.maintenanceTeam,
      assignedTechnician: requestData.assignedTechnician || equipment.defaultTechnician,
      createdBy: req.user._id,
    });

    await request.populate([
      { path: 'equipment', select: 'equipmentName serialNumber category' },
      { path: 'maintenanceTeam', select: 'teamName specialization' },
      { path: 'assignedTechnician', select: 'name email' },
      { path: 'createdBy', select: 'name email' },
    ]);

    res.status(201).json({
      success: true,
      message: 'Maintenance request created successfully.',
      data: request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating request.',
      error: error.message,
    });
  }
};

/**
 * Get all maintenance requests with filters
 * GET /api/requests?stage=&priority=&requestType=&equipmentId=&technicianId=
 * Access: Based on role
 */
exports.getAllRequests = async (req, res) => {
  try {
    const { stage, priority, requestType, equipmentId, technicianId } = req.query;
    const filter = {};

    // Role-based filtering
    if (req.user.role === 'User') {
      // Users only see their own requests
      filter.createdBy = req.user._id;
    } else if (req.user.role === 'Technician') {
      // Technicians see assigned requests or requests from their team
      filter.$or = [
        { assignedTechnician: req.user._id },
        { maintenanceTeam: req.user.team },
      ];
    }
    // Admin and Manager see all requests

    // Apply additional filters
    if (stage) filter.stage = stage;
    if (priority) filter.priority = priority;
    if (requestType) filter.requestType = requestType;
    if (equipmentId) filter.equipment = equipmentId;
    if (technicianId) filter.assignedTechnician = technicianId;

    const requests = await MaintenanceRequest.find(filter)
      .populate('equipment', 'equipmentName serialNumber category')
      .populate('maintenanceTeam', 'teamName specialization')
      .populate('assignedTechnician', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching requests.',
      error: error.message,
    });
  }
};

/**
 * Get single request by ID
 * GET /api/requests/:id
 * Access: All authenticated users (with role-based visibility)
 */
exports.getRequestById = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id)
      .populate('equipment', 'equipmentName serialNumber category location')
      .populate('maintenanceTeam', 'teamName specialization members')
      .populate('assignedTechnician', 'name email role')
      .populate('createdBy', 'name email role');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found.',
      });
    }

    // Check access permissions
    if (req.user.role === 'User' && request.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.',
      });
    }

    res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching request.',
      error: error.message,
    });
  }
};

/**
 * Update maintenance request
 * PUT /api/requests/:id
 * Access: Admin, Manager, or assigned Technician
 */
exports.updateRequest = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found.',
      });
    }

    // Check permissions
    const isAssignedTechnician = request.assignedTechnician?.toString() === req.user._id.toString();
    const canUpdate = ['Admin', 'Manager'].includes(req.user.role) || isAssignedTechnician;

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this request.',
      });
    }

    // Update request
    Object.assign(request, req.body);
    await request.save();

    await request.populate([
      { path: 'equipment', select: 'equipmentName serialNumber category' },
      { path: 'maintenanceTeam', select: 'teamName specialization' },
      { path: 'assignedTechnician', select: 'name email' },
      { path: 'createdBy', select: 'name email' },
    ]);

    res.status(200).json({
      success: true,
      message: 'Request updated successfully.',
      data: request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating request.',
      error: error.message,
    });
  }
};

/**
 * Update request stage
 * PATCH /api/requests/:id/stage
 * Body: { stage }
 * Access: Admin, Manager, or assigned Technician
 */
exports.updateRequestStage = async (req, res) => {
  try {
    const { stage } = req.body;

    if (!stage) {
      return res.status(400).json({
        success: false,
        message: 'Stage is required.',
      });
    }

    const request = await MaintenanceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found.',
      });
    }

    // Check permissions
    const isAssignedTechnician = request.assignedTechnician?.toString() === req.user._id.toString();
    const canUpdate = ['Admin', 'Manager'].includes(req.user.role) || isAssignedTechnician;

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this request.',
      });
    }

    // Handle Scrap stage - mark equipment as inactive
    if (stage === 'Scrap') {
      await Equipment.findByIdAndUpdate(request.equipment, { isActive: false });
    }

    request.stage = stage;
    await request.save();

    await request.populate([
      { path: 'equipment', select: 'equipmentName serialNumber category isActive' },
      { path: 'maintenanceTeam', select: 'teamName' },
      { path: 'assignedTechnician', select: 'name email' },
      { path: 'createdBy', select: 'name email' },
    ]);

    res.status(200).json({
      success: true,
      message: `Request stage updated to ${stage}.`,
      data: request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating request stage.',
      error: error.message,
    });
  }
};

/**
 * Assign technician to request
 * PATCH /api/requests/:id/assign
 * Body: { technicianId }
 * Access: Admin, Manager
 */
exports.assignTechnician = async (req, res) => {
  try {
    const { technicianId } = req.body;

    if (!technicianId) {
      return res.status(400).json({
        success: false,
        message: 'Technician ID is required.',
      });
    }

    const request = await MaintenanceRequest.findByIdAndUpdate(
      req.params.id,
      { assignedTechnician: technicianId },
      { new: true }
    )
      .populate('equipment', 'equipmentName serialNumber')
      .populate('assignedTechnician', 'name email')
      .populate('maintenanceTeam', 'teamName')
      .populate('createdBy', 'name email');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Technician assigned successfully.',
      data: request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error assigning technician.',
      error: error.message,
    });
  }
};

/**
 * Delete maintenance request
 * DELETE /api/requests/:id
 * Access: Admin, Manager
 */
exports.deleteRequest = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findByIdAndDelete(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Request deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting request.',
      error: error.message,
    });
  }
};

/**
 * Get calendar view of scheduled requests
 * GET /api/requests/calendar?startDate=&endDate=
 * Access: All authenticated users
 */
exports.getCalendarRequests = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { scheduledDate: { $ne: null } };

    if (startDate) filter.scheduledDate.$gte = new Date(startDate);
    if (endDate) filter.scheduledDate.$lte = new Date(endDate);

    // Role-based filtering
    if (req.user.role === 'Technician') {
      filter.$or = [
        { assignedTechnician: req.user._id },
        { maintenanceTeam: req.user.team },
      ];
    } else if (req.user.role === 'User') {
      filter.createdBy = req.user._id;
    }

    const requests = await MaintenanceRequest.find(filter)
      .populate('equipment', 'equipmentName serialNumber')
      .populate('assignedTechnician', 'name')
      .select('subject equipment stage priority scheduledDate durationHours')
      .sort({ scheduledDate: 1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching calendar requests.',
      error: error.message,
    });
  }
};

/**
 * Get overdue requests
 * GET /api/requests/overdue
 * Access: Admin, Manager, Technician
 */
exports.getOverdueRequests = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filter = {
      scheduledDate: { $lt: today },
      stage: { $nin: ['Repaired', 'Scrap'] },
    };

    // Role-based filtering
    if (req.user.role === 'Technician') {
      filter.$or = [
        { assignedTechnician: req.user._id },
        { maintenanceTeam: req.user.team },
      ];
    }

    const requests = await MaintenanceRequest.find(filter)
      .populate('equipment', 'equipmentName serialNumber category')
      .populate('assignedTechnician', 'name email')
      .populate('maintenanceTeam', 'teamName')
      .sort({ scheduledDate: 1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching overdue requests.',
      error: error.message,
    });
  }
};
