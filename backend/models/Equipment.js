const mongoose = require('mongoose');

/**
 * Equipment Schema
 * Represents physical equipment in the system
 */
const equipmentSchema = new mongoose.Schema(
  {
    equipmentName: {
      type: String,
      required: [true, 'Equipment name is required'],
      trim: true,
    },
    serialNumber: {
      type: String,
      required: [true, 'Serial number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    purchaseDate: {
      type: Date,
      default: null,
    },
    warrantyExpiryDate: {
      type: Date,
      default: null,
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    ownershipType: {
      type: String,
      enum: {
        values: ['Department', 'Employee'],
        message: '{VALUE} is not a valid ownership type',
      },
      required: [true, 'Ownership type is required'],
    },
    department: {
      type: String,
      trim: true,
      // Required if ownershipType is Department
      validate: {
        validator: function (value) {
          if (this.ownershipType === 'Department' && !value) {
            return false;
          }
          return true;
        },
        message: 'Department is required when ownership type is Department',
      },
    },
    assignedEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      // Required if ownershipType is Employee
      validate: {
        validator: function (value) {
          if (this.ownershipType === 'Employee' && !value) {
            return false;
          }
          return true;
        },
        message: 'Assigned employee is required when ownership type is Employee',
      },
    },
    maintenanceTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaintenanceTeam',
      required: [true, 'Maintenance team is required'],
    },
    defaultTechnician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Default technician is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
equipmentSchema.index({ category: 1 });
equipmentSchema.index({ isActive: 1 });
equipmentSchema.index({ maintenanceTeam: 1 });

// Virtual for warranty status
equipmentSchema.virtual('isUnderWarranty').get(function () {
  if (!this.warrantyExpiryDate) return false;
  return this.warrantyExpiryDate > new Date();
});

// Ensure virtuals are included in JSON
equipmentSchema.set('toJSON', { virtuals: true });
equipmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Equipment', equipmentSchema);
