import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { requestAPI } from '../api/request.api';
import * as equipmentAPI from '../api/equipment.api';
import * as userAPI from '../api/user.api';
import useAuth from '../hooks/useAuth';
import { useNotifications } from '../context/NotificationContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';

/**
 * MaintenanceForm Component
 * Handles both creating and editing maintenance requests
 * 
 * CRITICAL AUTO-FILL FEATURE:
 * When equipment is selected, automatically populates:
 * - equipmentCategory (read-only)
 * - maintenanceTeam (read-only)
 * - defaultTechnician (pre-selected but editable)
 */
const MaintenanceForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { showToast, ToastContainer } = useToast();
  const { user } = useAuth();
  const { addNotification, addAuditLog } = useNotifications();

  // Get pre-filled data from navigation state (from Calendar)
  const preFilledData = location.state || {};

  // Form data
  const [formData, setFormData] = useState({
    subject: '',
    equipment: '',
    requestType: preFilledData.requestType || 'Corrective',
    priority: 'Medium',
    scheduledDate: preFilledData.scheduledDate || '',
    description: '',
    // Auto-filled fields
    equipmentCategory: '',
    maintenanceTeam: '',
    assignedTechnician: ''
  });

  // Dropdown options
  const [equipmentOptions, setEquipmentOptions] = useState([]);
  const [technicianOptions, setTechnicianOptions] = useState([]);

  // Auto-fill data (read-only display)
  const [autoFillData, setAutoFillData] = useState({
    category: '',
    teamName: '',
    teamId: '',
    defaultTechnicianId: '',
    defaultTechnicianName: ''
  });

  // UI states
  const [loading, setLoading] = useState(false);
  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Load form data on mount
  useEffect(() => {
    loadFormData();
  }, [id]);

  // Load equipment dropdown on mount
  useEffect(() => {
    loadEquipmentOptions();
  }, []);

  const loadFormData = async () => {
    if (isEditMode) {
      try {
        setLoading(true);
        const request = await requestAPI.getRequestById(id);
        
        // Populate form with existing data
        setFormData({
          subject: request.subject || '',
          equipment: request.equipment?._id || '',
          requestType: request.requestType || 'Corrective',
          priority: request.priority || 'Medium',
          scheduledDate: request.scheduledDate ? request.scheduledDate.split('T')[0] : '',
          description: request.description || '',
          equipmentCategory: request.equipmentCategory || '',
          maintenanceTeam: request.maintenanceTeam?._id || '',
          assignedTechnician: request.assignedTechnician?._id || ''
        });

        // Set auto-fill display data
        if (request.equipment) {
          setAutoFillData({
            category: request.equipmentCategory || '',
            teamName: request.maintenanceTeam?.name || '',
            teamId: request.maintenanceTeam?._id || '',
            defaultTechnicianId: request.assignedTechnician?._id || '',
            defaultTechnicianName: request.assignedTechnician?.name || ''
          });

          // Load technicians for the team
          if (request.maintenanceTeam?._id) {
            await loadTechniciansForTeam(request.maintenanceTeam._id);
          }
        }
      } catch (error) {
        console.error('Failed to load request:', error);
        showToast('Failed to load request data', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const loadEquipmentOptions = async () => {
    try {
      // Only load active equipment
      const equipment = await equipmentAPI.getAllEquipment();
      const activeEquipment = equipment.filter(e => e.isActive);
      setEquipmentOptions(activeEquipment);
    } catch (error) {
      console.error('Failed to load equipment:', error);
      showToast('Failed to load equipment options', 'error');
    }
  };

  const loadTechniciansForTeam = async (teamId) => {
    try {
      const technicians = await userAPI.getUsersByRole('Technician');
      // Filter technicians belonging to the selected team
      const teamTechnicians = technicians.filter(tech => tech.team?._id === teamId || tech.team === teamId);
      setTechnicianOptions(teamTechnicians);
    } catch (error) {
      console.error('Failed to load technicians:', error);
      showToast('Failed to load technicians', 'error');
    }
  };

  /**
   * CRITICAL AUTO-FILL LOGIC
   * When equipment is selected, fetch auto-fill data and populate fields
   */
  const handleEquipmentChange = async (equipmentId) => {
    if (!equipmentId) {
      // Clear auto-fill data
      setFormData(prev => ({
        ...prev,
        equipment: '',
        equipmentCategory: '',
        maintenanceTeam: '',
        assignedTechnician: ''
      }));
      setAutoFillData({
        category: '',
        teamName: '',
        teamId: '',
        defaultTechnicianId: '',
        defaultTechnicianName: ''
      });
      setTechnicianOptions([]);
      return;
    }

    try {
      setLoadingEquipment(true);
      
      // Call auto-fill API endpoint
      const autoFill = await equipmentAPI.getEquipmentAutoFill(equipmentId);

      // Update form data with auto-filled values
      setFormData(prev => ({
        ...prev,
        equipment: equipmentId,
        equipmentCategory: autoFill.equipmentCategory || '',
        maintenanceTeam: autoFill.maintenanceTeam?._id || '',
        assignedTechnician: autoFill.defaultTechnician?._id || ''
      }));

      // Update auto-fill display data
      setAutoFillData({
        category: autoFill.equipmentCategory || '',
        teamName: autoFill.maintenanceTeam?.name || '',
        teamId: autoFill.maintenanceTeam?._id || '',
        defaultTechnicianId: autoFill.defaultTechnician?._id || '',
        defaultTechnicianName: autoFill.defaultTechnician?.name || ''
      });

      // Load technicians for the team
      if (autoFill.maintenanceTeam?._id) {
        await loadTechniciansForTeam(autoFill.maintenanceTeam._id);
      }

      showToast('Equipment details auto-filled', 'success');
    } catch (error) {
      console.error('Failed to auto-fill equipment data:', error);
      showToast('Failed to load equipment details', 'error');
    } finally {
      setLoadingEquipment(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.subject.trim()) {
      errors.subject = 'Subject is required';
    }

    if (!formData.equipment) {
      errors.equipment = 'Equipment is required';
    }

    if (!formData.requestType) {
      errors.requestType = 'Request type is required';
    }

    if (!formData.priority) {
      errors.priority = 'Priority is required';
    }

    // Conditional validation: Preventive requests require scheduled date
    if (formData.requestType === 'Preventive' && !formData.scheduledDate) {
      errors.scheduledDate = 'Scheduled date is required for preventive maintenance';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    try {
      setLoading(true);

      // Prepare data for submission
      const submitData = {
        subject: formData.subject.trim(),
        equipment: formData.equipment,
        requestType: formData.requestType,
        priority: formData.priority,
        description: formData.description.trim(),
        equipmentCategory: formData.equipmentCategory,
        maintenanceTeam: formData.maintenanceTeam,
        assignedTechnician: formData.assignedTechnician || undefined,
        scheduledDate: formData.scheduledDate || undefined
      };

      if (isEditMode) {
        await requestAPI.updateRequest(id, submitData);
        showToast('Request updated successfully', 'success');
        
        // Add audit log for request update
        addAuditLog({
          action: 'update',
          entityType: 'request',
          entityId: id,
          details: `Updated maintenance request: ${formData.subject}`
        });
      } else {
        const createdRequest = await requestAPI.createRequest(submitData);
        showToast('Request created successfully', 'success');
        
        // Add audit log for request creation
        addAuditLog({
          action: 'create',
          entityType: 'request',
          entityId: createdRequest._id || 'new',
          details: `Created maintenance request: ${formData.subject}`
        });
        
        // Send notification to admins and managers
        addNotification({
          type: 'request_created',
          title: 'New Maintenance Request',
          message: `New ${formData.requestType.toLowerCase()} request created: ${formData.subject}`,
          entityType: 'request',
          entityId: createdRequest._id || 'new',
          recipientRoles: ['Admin', 'Manager']
        });
      }

      // Navigate back to list
      setTimeout(() => navigate('/maintenance'), 1500);
    } catch (error) {
      console.error('Failed to save request:', error);
      showToast(error.response?.data?.message || 'Failed to save request', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/maintenance')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Requests
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? 'Edit Maintenance Request' : 'New Maintenance Request'}
        </h1>
        <p className="text-gray-600 mt-2">
          {isEditMode ? 'Update request details' : 'Create a new maintenance request'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
        <div className="p-6 space-y-6">
          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                formErrors.subject ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Brief description of the issue"
            />
            {formErrors.subject && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {formErrors.subject}
              </p>
            )}
          </div>

          {/* Equipment Selection */}
          <div>
            <label htmlFor="equipment" className="block text-sm font-medium text-gray-700 mb-2">
              Equipment <span className="text-red-500">*</span>
            </label>
            <select
              id="equipment"
              value={formData.equipment}
              onChange={(e) => handleEquipmentChange(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                formErrors.equipment ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loadingEquipment}
            >
              <option value="">Select Equipment</option>
              {equipmentOptions.map(eq => (
                <option key={eq._id} value={eq._id}>
                  {eq.name} - {eq.category}
                </option>
              ))}
            </select>
            {formErrors.equipment && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {formErrors.equipment}
              </p>
            )}
            {loadingEquipment && (
              <p className="mt-1 text-sm text-blue-600">Loading equipment details...</p>
            )}
          </div>

          {/* AUTO-FILLED FIELDS (Read-Only Display) */}
          {autoFillData.category && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                Auto-Filled Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1">
                    Equipment Category
                  </label>
                  <div className="px-3 py-2 bg-white border border-blue-200 rounded text-sm text-gray-900">
                    {autoFillData.category}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1">
                    Maintenance Team
                  </label>
                  <div className="px-3 py-2 bg-white border border-blue-200 rounded text-sm text-gray-900">
                    {autoFillData.teamName || 'Not assigned'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Request Type */}
          <div>
            <label htmlFor="requestType" className="block text-sm font-medium text-gray-700 mb-2">
              Request Type <span className="text-red-500">*</span>
            </label>
            <select
              id="requestType"
              value={formData.requestType}
              onChange={(e) => handleInputChange('requestType', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                formErrors.requestType ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="Corrective">Corrective</option>
              <option value="Preventive">Preventive</option>
            </select>
            {formErrors.requestType && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {formErrors.requestType}
              </p>
            )}
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
              Priority <span className="text-red-500">*</span>
            </label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                formErrors.priority ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
            {formErrors.priority && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {formErrors.priority}
              </p>
            )}
          </div>

          {/* Scheduled Date (Conditional - Required for Preventive) */}
          <div>
            <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700 mb-2">
              Scheduled Date {formData.requestType === 'Preventive' && <span className="text-red-500">*</span>}
            </label>
            <input
              type="date"
              id="scheduledDate"
              value={formData.scheduledDate}
              onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                formErrors.scheduledDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {formErrors.scheduledDate && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {formErrors.scheduledDate}
              </p>
            )}
            {formData.requestType === 'Preventive' && (
              <p className="mt-1 text-sm text-gray-600">
                Preventive maintenance requires a scheduled date
              </p>
            )}
          </div>

          {/* Assigned Technician (Editable - Pre-filled from auto-fill) */}
          {technicianOptions.length > 0 && (
            <div>
              <label htmlFor="assignedTechnician" className="block text-sm font-medium text-gray-700 mb-2">
                Assigned Technician
              </label>
              <select
                id="assignedTechnician"
                value={formData.assignedTechnician}
                onChange={(e) => handleInputChange('assignedTechnician', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Unassigned</option>
                {technicianOptions.map(tech => (
                  <option key={tech._id} value={tech._id}>
                    {tech.name} ({tech.email})
                  </option>
                ))}
              </select>
              {autoFillData.defaultTechnicianName && (
                <p className="mt-1 text-sm text-blue-600">
                  Default technician: {autoFillData.defaultTechnicianName}
                </p>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows="4"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                formErrors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Detailed description of the maintenance request..."
            />
            {formErrors.description && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {formErrors.description}
              </p>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-3 rounded-b-lg">
          <button
            type="button"
            onClick={() => navigate('/maintenance')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || loadingEquipment}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5 mr-2" />
            {loading ? 'Saving...' : isEditMode ? 'Update Request' : 'Create Request'}
          </button>
        </div>
      </form>

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
};

export default MaintenanceForm;
