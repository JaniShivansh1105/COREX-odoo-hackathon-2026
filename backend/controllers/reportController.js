const MaintenanceRequest = require('../models/MaintenanceRequest');

/**
 * Get reports by maintenance team
 * GET /api/reports/by-team
 * Access: Admin, Manager
 */
exports.getReportsByTeam = async (req, res) => {
  try {
    const reports = await MaintenanceRequest.aggregate([
      {
        $group: {
          _id: '$maintenanceTeam',
          totalRequests: { $sum: 1 },
          newRequests: {
            $sum: { $cond: [{ $eq: ['$stage', 'New'] }, 1, 0] },
          },
          inProgressRequests: {
            $sum: { $cond: [{ $eq: ['$stage', 'In Progress'] }, 1, 0] },
          },
          repairedRequests: {
            $sum: { $cond: [{ $eq: ['$stage', 'Repaired'] }, 1, 0] },
          },
          scrapRequests: {
            $sum: { $cond: [{ $eq: ['$stage', 'Scrap'] }, 1, 0] },
          },
          totalDurationHours: { $sum: '$durationHours' },
        },
      },
      {
        $lookup: {
          from: 'maintenanceteams',
          localField: '_id',
          foreignField: '_id',
          as: 'team',
        },
      },
      {
        $unwind: '$team',
      },
      {
        $project: {
          _id: 0,
          teamId: '$_id',
          teamName: '$team.teamName',
          specialization: '$team.specialization',
          totalRequests: 1,
          newRequests: 1,
          inProgressRequests: 1,
          repairedRequests: 1,
          scrapRequests: 1,
          totalDurationHours: 1,
        },
      },
      {
        $sort: { totalRequests: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating team reports.',
      error: error.message,
    });
  }
};

/**
 * Get reports by equipment category
 * GET /api/reports/by-category
 * Access: Admin, Manager
 */
exports.getReportsByCategory = async (req, res) => {
  try {
    const reports = await MaintenanceRequest.aggregate([
      {
        $group: {
          _id: '$equipmentCategory',
          totalRequests: { $sum: 1 },
          correctiveRequests: {
            $sum: { $cond: [{ $eq: ['$requestType', 'Corrective'] }, 1, 0] },
          },
          preventiveRequests: {
            $sum: { $cond: [{ $eq: ['$requestType', 'Preventive'] }, 1, 0] },
          },
          lowPriority: {
            $sum: { $cond: [{ $eq: ['$priority', 'Low'] }, 1, 0] },
          },
          mediumPriority: {
            $sum: { $cond: [{ $eq: ['$priority', 'Medium'] }, 1, 0] },
          },
          highPriority: {
            $sum: { $cond: [{ $eq: ['$priority', 'High'] }, 1, 0] },
          },
          urgentPriority: {
            $sum: { $cond: [{ $eq: ['$priority', 'Urgent'] }, 1, 0] },
          },
          avgDurationHours: { $avg: '$durationHours' },
        },
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          totalRequests: 1,
          correctiveRequests: 1,
          preventiveRequests: 1,
          lowPriority: 1,
          mediumPriority: 1,
          highPriority: 1,
          urgentPriority: 1,
          avgDurationHours: { $round: ['$avgDurationHours', 2] },
        },
      },
      {
        $sort: { totalRequests: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating category reports.',
      error: error.message,
    });
  }
};
