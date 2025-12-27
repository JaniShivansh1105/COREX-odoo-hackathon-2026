const mongoose = require('mongoose');

/**
 * MaintenanceTeam Schema
 * Represents teams responsible for equipment maintenance
 */
const maintenanceTeamSchema = new mongoose.Schema(
  {
    teamName: {
      type: String,
      required: [true, 'Team name is required'],
      unique: true,
      trim: true,
    },
    specialization: {
      type: String,
      trim: true,
      default: '',
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    teamLead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for member count
maintenanceTeamSchema.virtual('memberCount').get(function () {
  return this.members ? this.members.length : 0;
});

// Ensure virtuals are included in JSON
maintenanceTeamSchema.set('toJSON', { virtuals: true });
maintenanceTeamSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('MaintenanceTeam', maintenanceTeamSchema);
