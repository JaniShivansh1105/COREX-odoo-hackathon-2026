const mongoose = require('mongoose');

/**
 * MaintenanceRequest Schema
 * Represents maintenance requests for equipment
 */
const maintenanceRequestSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    equipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipment',
      required: [true, 'Equipment is required'],
    },
    equipmentCategory: {
      type: String,
      trim: true,
      // Auto-filled from equipment
    },
    maintenanceTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaintenanceTeam',
      // Auto-filled from equipment
    },
    requestType: {
      type: String,
      enum: {
        values: ['Corrective', 'Preventive'],
        message: '{VALUE} is not a valid request type',
      },
      required: [true, 'Request type is required'],
    },
    stage: {
      type: String,
      enum: {
        values: ['New', 'In Progress', 'Repaired', 'Scrap'],
        message: '{VALUE} is not a valid stage',
      },
      default: 'New',
    },
    priority: {
      type: String,
      enum: {
        values: ['Low', 'Medium', 'High', 'Urgent'],
        message: '{VALUE} is not a valid priority',
      },
      default: 'Medium',
    },
    scheduledDate: {
      type: Date,
      default: null,
    },
    assignedTechnician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    durationHours: {
      type: Number,
      min: [0, 'Duration cannot be negative'],
      default: 0,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    resolutionNotes: {
      type: String,
      trim: true,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
maintenanceRequestSchema.index({ equipment: 1 });
maintenanceRequestSchema.index({ stage: 1 });
maintenanceRequestSchema.index({ scheduledDate: 1 });
maintenanceRequestSchema.index({ maintenanceTeam: 1 });
maintenanceRequestSchema.index({ assignedTechnician: 1 });
maintenanceRequestSchema.index({ createdBy: 1 });

// Virtual for computing overdue status
maintenanceRequestSchema.virtual('isOverdue').get(function () {
  // Only consider overdue if there's a scheduled date and stage is not completed
  if (!this.scheduledDate) return false;
  if (this.stage === 'Repaired' || this.stage === 'Scrap') return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const scheduled = new Date(this.scheduledDate);
  scheduled.setHours(0, 0, 0, 0);
  
  return scheduled < today;
});

// Ensure virtuals are included in JSON
maintenanceRequestSchema.set('toJSON', { virtuals: true });
maintenanceRequestSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);
