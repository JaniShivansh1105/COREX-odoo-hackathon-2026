import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, AlertCircle, Clock, CheckCircle, XCircle, User } from 'lucide-react';
import { requestAPI } from '../api/request.api';
import * as userAPI from '../api/user.api';
import useAuth from '../hooks/useAuth';
import { useNotifications } from '../context/NotificationContext';
import { canEditMaintenanceRequest, canDeleteMaintenanceRequest, canAssignTechnician, canUpdateStage } from '../utils/rolePermissions';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

/**
 * MaintenanceDetail Component
 * Displays detailed view of a maintenance request
 * 
 * Features:
 * - View all request details
 * - Update stage (with scrap warning)
 * - Assign technician
 * - Enter duration and resolution notes
 * - Edit/Delete actions (role-based)
 */
const MaintenanceDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast, ToastContainer } = useToast();
  const { addNotification, addAuditLog } = useNotifications();

  // State
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [technicians, setTechnicians] = useState([]);

  // Modal states
  const [stageModal, setStageModal] = useState({ isOpen: false });
  const [assignModal, setAssignModal] = useState({ isOpen: false });
  const [resolutionModal, setResolutionModal] = useState({ isOpen: false });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false });
  const [scrapWarningDialog, setScrapWarningDialog] = useState({ isOpen: false, newStage: '' });

  // Form data for modals
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [resolutionData, setResolutionData] = useState({
    durationHours: '',
    resolutionNotes: ''
  });

  const stages = ['New', 'In Progress', 'Repaired', 'Scrap'];

  useEffect(() => {
    fetchRequest();
    loadTechnicians();
  }, [id]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const data = await requestAPI.getRequestById(id);
      setRequest(data);
      setSelectedStage(data.stage);
      setSelectedTechnician(data.assignedTechnician?._id || '');
      setResolutionData({
        durationHours: data.durationHours || '',
        resolutionNotes: data.resolutionNotes || ''
      });
    } catch (error) {
      console.error('Failed to fetch request:', error);
      showToast('Failed to load request details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadTechnicians = async () => {
    try {
      const techList = await userAPI.getUsersByRole('Technician');
      setTechnicians(techList);
    } catch (error) {
      console.error('Failed to load technicians:', error);
    }
  };

  const handleStageChange = (newStage) => {
    // Show warning if changing to Scrap
    if (newStage === 'Scrap') {
      setScrapWarningDialog({ isOpen: true, newStage });
    } else {
      updateStage(newStage);
    }
  };

  const confirmScrapUpdate = async () => {
    setScrapWarningDialog({ isOpen: false, newStage: '' });
    await updateStage('Scrap');
  };

  const updateStage = async (newStage) => {
    try {
      const oldStage = request.stage;
      await requestAPI.updateRequestStage(id, newStage);
      showToast(`Request moved to ${newStage}`, 'success');
      setStageModal({ isOpen: false });
      
      // Add audit log for stage change
      addAuditLog({
        action: 'stage_change',
        entityType: 'request',
        entityId: id,
        details: `Changed stage from "${oldStage}" to "${newStage}" for request: ${request.equipment?.name || 'Unknown Equipment'}`
      });

      // Send notification to creator and technician about stage update
      const recipientIds = [];
      if (request.createdBy?._id && request.createdBy._id !== user._id) {
        recipientIds.push(request.createdBy._id);
      }
      if (request.assignedTo?._id && request.assignedTo._id !== user._id) {
        recipientIds.push(request.assignedTo._id);
      }

      // Check if equipment is scrapped and notify admins/managers
      if (newStage === 'Scrap') {
        addNotification({
          type: 'equipment_scrapped',
          title: 'Equipment Scrapped',
          message: `Equipment "${request.equipment?.name}" has been marked as scrapped`,
          entityType: 'equipment',
          entityId: request.equipment?._id,
          recipientRoles: ['Admin', 'Manager']
        });
      }

      if (recipientIds.length > 0) {
        addNotification({
          type: 'stage_updated',
          title: 'Request Stage Updated',
          message: `Request for "${request.equipment?.name}" moved to ${newStage}`,
          entityType: 'request',
          entityId: id,
          recipientIds: recipientIds
        });
      }

      fetchRequest(); // Refresh data
    } catch (error) {
      console.error('Failed to update stage:', error);
      showToast(error.response?.data?.message || 'Failed to update stage', 'error');
    }
  };

  const handleAssignTechnician = async () => {
    try {
      await requestAPI.assignTechnician(id, { technicianId: selectedTechnician });
      showToast('Technician assigned successfully', 'success');
      setAssignModal({ isOpen: false });
      
      // Find the assigned technician details
      const assignedTech = technicians.find(t => t._id === selectedTechnician);
      
      // Add audit log for technician assignment
      addAuditLog({
        action: 'assign',
        entityType: 'request',
        entityId: id,
        details: `Assigned technician "${assignedTech?.name || 'Unknown'}" to request: ${request.equipment?.name || 'Unknown Equipment'}`
      });
      
      // Send notification to assigned technician
      if (assignedTech && assignedTech._id !== user._id) {
        addNotification({
          type: 'request_assigned',
          title: 'New Assignment',
          message: `You have been assigned to maintenance request: ${request.subject || request.equipment?.name}`,
          entityType: 'request',
          entityId: id,
          recipientId: assignedTech._id
        });
      }
      
      fetchRequest();
    } catch (error) {
      console.error('Failed to assign technician:', error);
      showToast(error.response?.data?.message || 'Failed to assign technician', 'error');
    }
  };

  const handleUpdateResolution = async () => {
    try {
      await requestAPI.updateResolution(id, {
        durationHours: resolutionData.durationHours ? Number(resolutionData.durationHours) : undefined,
        resolutionNotes: resolutionData.resolutionNotes.trim() || undefined
      });
      showToast('Resolution updated successfully', 'success');
      setResolutionModal({ isOpen: false });
      fetchRequest();
    } catch (error) {
      console.error('Failed to update resolution:', error);
      showToast(error.response?.data?.message || 'Failed to update resolution', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await requestAPI.deleteRequest(id);
      showToast('Request deleted successfully', 'success');
      setTimeout(() => navigate('/maintenance'), 1500);
    } catch (error) {
      console.error('Failed to delete request:', error);
      showToast(error.response?.data?.message || 'Failed to delete request', 'error');
    }
  };

  // Helper functions
  const getStageBadgeColor = (stage) => {
    const colors = {
      New: 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      Repaired: 'bg-green-100 text-green-800',
      Scrap: 'bg-red-100 text-red-800'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadgeColor = (priority) => {
    const colors = {
      Low: 'bg-gray-100 text-gray-800',
      Medium: 'bg-blue-100 text-blue-800',
      High: 'bg-orange-100 text-orange-800',
      Critical: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!request) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Request Not Found</h3>
          <button
            onClick={() => navigate('/maintenance')}
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Requests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/maintenance')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Requests
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{request.subject}</h1>
            <p className="text-gray-600 mt-2">Request #{request._id.slice(-8).toUpperCase()}</p>
          </div>
          <div className="flex space-x-2">
            {canEditMaintenanceRequest(user.role) && (
              <button
                onClick={() => navigate(`/maintenance/${id}/edit`)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-5 h-5 mr-2" />
                Edit
              </button>
            )}
            {canDeleteMaintenanceRequest(user.role) && (
              <button
                onClick={() => setDeleteDialog({ isOpen: true })}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Banner */}
      {request.isOverdue && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
          <div>
            <h3 className="text-sm font-semibold text-red-900">Overdue Request</h3>
            <p className="text-sm text-red-700">This request is past its scheduled date and requires immediate attention.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Request Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Equipment</label>
                <p className="text-gray-900">{request.equipment?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Category</label>
                <p className="text-gray-900">{request.equipmentCategory || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Request Type</label>
                <p className="text-gray-900">{request.requestType}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Priority</label>
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadgeColor(request.priority)}`}>
                  {request.priority}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Scheduled Date</label>
                <p className="text-gray-900">{formatDate(request.scheduledDate)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Created</label>
                <p className="text-gray-900">{formatDateTime(request.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{request.description}</p>
          </div>

          {/* Resolution Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Resolution</h2>
              {(canUpdateStage(user.role) || user._id === request.assignedTechnician?._id) && (
                <button
                  onClick={() => setResolutionModal({ isOpen: true })}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Update Resolution
                </button>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Duration (Hours)</label>
                <p className="text-gray-900">{request.durationHours || 'Not recorded'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Resolution Notes</label>
                <p className="text-gray-900 whitespace-pre-wrap">{request.resolutionNotes || 'No notes yet'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Current Stage</label>
                <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStageBadgeColor(request.stage)}`}>
                  {request.stage}
                </span>
              </div>
              {canUpdateStage(user.role) && (
                <button
                  onClick={() => setStageModal({ isOpen: true })}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update Stage
                </button>
              )}
            </div>
          </div>

          {/* Team & Assignment */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Maintenance Team</label>
                <p className="text-gray-900">{request.maintenanceTeam?.name || 'Not assigned'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Assigned Technician</label>
                <p className="text-gray-900 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  {request.assignedTechnician?.name || 'Unassigned'}
                </p>
              </div>
              {canAssignTechnician(user.role) && (
                <button
                  onClick={() => setAssignModal({ isOpen: true })}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Assign Technician
                </button>
              )}
            </div>
          </div>

          {/* Created By */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Created By</h3>
            <div>
              <p className="text-gray-900 font-medium">{request.createdBy?.name || 'Unknown'}</p>
              <p className="text-sm text-gray-600">{request.createdBy?.email || ''}</p>
              <p className="text-xs text-gray-500 mt-2">{formatDateTime(request.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stage Update Modal */}
      <Modal
        isOpen={stageModal.isOpen}
        onClose={() => setStageModal({ isOpen: false })}
        title="Update Request Stage"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select New Stage</label>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {stages.map(stage => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
          </div>
          {selectedStage === 'Scrap' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> Setting stage to "Scrap" will deactivate the equipment.
              </p>
            </div>
          )}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setStageModal({ isOpen: false })}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => handleStageChange(selectedStage)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Update Stage
            </button>
          </div>
        </div>
      </Modal>

      {/* Assign Technician Modal */}
      <Modal
        isOpen={assignModal.isOpen}
        onClose={() => setAssignModal({ isOpen: false })}
        title="Assign Technician"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Technician</label>
            <select
              value={selectedTechnician}
              onChange={(e) => setSelectedTechnician(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Unassigned</option>
              {technicians.map(tech => (
                <option key={tech._id} value={tech._id}>
                  {tech.name} - {tech.email}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setAssignModal({ isOpen: false })}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAssignTechnician}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Assign
            </button>
          </div>
        </div>
      </Modal>

      {/* Resolution Update Modal */}
      <Modal
        isOpen={resolutionModal.isOpen}
        onClose={() => setResolutionModal({ isOpen: false })}
        title="Update Resolution"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration (Hours)</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={resolutionData.durationHours}
              onChange={(e) => setResolutionData(prev => ({ ...prev, durationHours: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Hours spent on resolution"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Resolution Notes</label>
            <textarea
              value={resolutionData.resolutionNotes}
              onChange={(e) => setResolutionData(prev => ({ ...prev, resolutionNotes: e.target.value }))}
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Details about the resolution..."
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setResolutionModal({ isOpen: false })}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateResolution}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Update
            </button>
          </div>
        </div>
      </Modal>

      {/* Scrap Warning Dialog */}
      <ConfirmDialog
        isOpen={scrapWarningDialog.isOpen}
        onClose={() => setScrapWarningDialog({ isOpen: false, newStage: '' })}
        onConfirm={confirmScrapUpdate}
        title="Confirm Scrap"
        message="Setting this request to 'Scrap' will permanently deactivate the associated equipment. This action should only be used when the equipment is beyond repair. Are you sure you want to continue?"
        confirmText="Yes, Scrap Equipment"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false })}
        onConfirm={handleDelete}
        title="Delete Request"
        message={`Are you sure you want to delete "${request.subject}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
};

export default MaintenanceDetail;
