import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import * as equipmentAPI from '../api/equipment.api';
import * as teamAPI from '../api/team.api';
import * as userAPI from '../api/user.api';
import useAuth from '../hooks/useAuth';
import { useNotifications } from '../context/NotificationContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';
import { OWNERSHIP_TYPES } from '../utils/constants';

/**
 * Equipment Form Component
 * Reusable form for creating and editing equipment
 */
const EquipmentForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { showToast, ToastContainer } = useToast();
  const { user } = useAuth();
  const { addAuditLog } = useNotifications();

  // Form State
  const [formData, setFormData] = useState({
    equipmentName: '',
    serialNumber: '',
    category: '',
    purchaseDate: '',
    warrantyExpiryDate: '',
    location: '',
    ownershipType: OWNERSHIP_TYPES.DEPARTMENT,
    department: '',
    assignedEmployee: '',
    maintenanceTeam: '',
    defaultTechnician: '',
  });

  // UI State
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [errors, setErrors] = useState({});
  const [teams, setTeams] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [users, setUsers] = useState([]);

  // Load data on mount
  useEffect(() => {
    loadFormData();
  }, [id]);

  // Load teams, technicians, and existing equipment data
  const loadFormData = async () => {
    try {
      // Load teams and technicians in parallel
      const [teamsRes, techniciansRes, usersRes] = await Promise.all([
        teamAPI.getAllTeams(),
        userAPI.getTechnicians(),
        userAPI.getAllUsers(),
      ]);

      setTeams(teamsRes.data);
      setTechnicians(techniciansRes.data);
      setUsers(usersRes.data);

      // If edit mode, load equipment data
      if (isEditMode) {
        const equipmentRes = await equipmentAPI.getEquipmentById(id);
        const equipment = equipmentRes.data;

        setFormData({
          equipmentName: equipment.equipmentName || '',
          serialNumber: equipment.serialNumber || '',
          category: equipment.category || '',
          purchaseDate: equipment.purchaseDate ? equipment.purchaseDate.split('T')[0] : '',
          warrantyExpiryDate: equipment.warrantyExpiryDate
            ? equipment.warrantyExpiryDate.split('T')[0]
            : '',
          location: equipment.location || '',
          ownershipType: equipment.ownershipType || OWNERSHIP_TYPES.DEPARTMENT,
          department: equipment.department || '',
          assignedEmployee: equipment.assignedEmployee?._id || '',
          maintenanceTeam: equipment.maintenanceTeam?._id || '',
          defaultTechnician: equipment.defaultTechnician?._id || '',
        });
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to load form data', 'error');
    } finally {
      setInitialLoading(false);
    }
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.equipmentName.trim()) {
      newErrors.equipmentName = 'Equipment name is required';
    }

    if (!formData.serialNumber.trim()) {
      newErrors.serialNumber = 'Serial number is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    if (!formData.maintenanceTeam) {
      newErrors.maintenanceTeam = 'Maintenance team is required';
    }

    if (!formData.defaultTechnician) {
      newErrors.defaultTechnician = 'Default technician is required';
    }

    // Conditional validation based on ownership type
    if (formData.ownershipType === OWNERSHIP_TYPES.DEPARTMENT) {
      if (!formData.department.trim()) {
        newErrors.department = 'Department is required for department ownership';
      }
    } else if (formData.ownershipType === OWNERSHIP_TYPES.EMPLOYEE) {
      if (!formData.assignedEmployee) {
        newErrors.assignedEmployee = 'Assigned employee is required for employee ownership';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    setLoading(true);

    try {
      // Prepare data for submission
      const submitData = {
        equipmentName: formData.equipmentName,
        serialNumber: formData.serialNumber,
        category: formData.category,
        location: formData.location,
        ownershipType: formData.ownershipType,
        maintenanceTeam: formData.maintenanceTeam,
        defaultTechnician: formData.defaultTechnician,
      };

      // Add optional dates
      if (formData.purchaseDate) {
        submitData.purchaseDate = formData.purchaseDate;
      }
      if (formData.warrantyExpiryDate) {
        submitData.warrantyExpiryDate = formData.warrantyExpiryDate;
      }

      // Add conditional fields based on ownership type
      if (formData.ownershipType === OWNERSHIP_TYPES.DEPARTMENT) {
        submitData.department = formData.department;
      } else {
        submitData.assignedEmployee = formData.assignedEmployee;
      }

      if (isEditMode) {
        await equipmentAPI.updateEquipment(id, submitData);
        showToast('Equipment updated successfully', 'success');
        
        // Add audit log for equipment update
        addAuditLog({
          action: 'update',
          entityType: 'equipment',
          entityId: id,
          details: `Updated equipment: ${formData.equipmentName} (${formData.serialNumber})`
        });
      } else {
        const created = await equipmentAPI.createEquipment(submitData);
        showToast('Equipment created successfully', 'success');
        
        // Add audit log for equipment creation
        addAuditLog({
          action: 'create',
          entityType: 'equipment',
          entityId: created.data?._id || 'new',
          details: `Created equipment: ${formData.equipmentName} (${formData.serialNumber})`
        });
      }

      // Navigate back to list
      setTimeout(() => navigate('/equipment'), 1000);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to save equipment', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="p-6">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <ToastContainer />

      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/equipment')}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Equipment List
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? 'Edit Equipment' : 'Add New Equipment'}
        </h1>
        <p className="text-gray-600 mt-2">
          {isEditMode ? 'Update equipment information' : 'Enter equipment details'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Equipment Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Equipment Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="equipmentName"
              value={formData.equipmentName}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.equipmentName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter equipment name"
            />
            {errors.equipmentName && (
              <p className="mt-1 text-sm text-red-500">{errors.equipmentName}</p>
            )}
          </div>

          {/* Serial Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Serial Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="serialNumber"
              value={formData.serialNumber}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.serialNumber ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter serial number"
            />
            {errors.serialNumber && (
              <p className="mt-1 text-sm text-red-500">{errors.serialNumber}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.category ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., HVAC, Electrical, Plumbing"
            />
            {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter location"
            />
          </div>

          {/* Purchase Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Date</label>
            <input
              type="date"
              name="purchaseDate"
              value={formData.purchaseDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Warranty Expiry Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Warranty Expiry Date
            </label>
            <input
              type="date"
              name="warrantyExpiryDate"
              value={formData.warrantyExpiryDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Ownership Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ownership Type <span className="text-red-500">*</span>
            </label>
            <select
              name="ownershipType"
              value={formData.ownershipType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value={OWNERSHIP_TYPES.DEPARTMENT}>Department</option>
              <option value={OWNERSHIP_TYPES.EMPLOYEE}>Employee</option>
            </select>
          </div>

          {/* Conditional: Department or Assigned Employee */}
          {formData.ownershipType === OWNERSHIP_TYPES.DEPARTMENT ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.department ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter department name"
              />
              {errors.department && (
                <p className="mt-1 text-sm text-red-500">{errors.department}</p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigned Employee <span className="text-red-500">*</span>
              </label>
              <select
                name="assignedEmployee"
                value={formData.assignedEmployee}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.assignedEmployee ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select an employee</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
              {errors.assignedEmployee && (
                <p className="mt-1 text-sm text-red-500">{errors.assignedEmployee}</p>
              )}
            </div>
          )}

          {/* Maintenance Team */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maintenance Team <span className="text-red-500">*</span>
            </label>
            <select
              name="maintenanceTeam"
              value={formData.maintenanceTeam}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.maintenanceTeam ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a team</option>
              {teams.map((team) => (
                <option key={team._id} value={team._id}>
                  {team.teamName} {team.specialization && `- ${team.specialization}`}
                </option>
              ))}
            </select>
            {errors.maintenanceTeam && (
              <p className="mt-1 text-sm text-red-500">{errors.maintenanceTeam}</p>
            )}
          </div>

          {/* Default Technician */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Technician <span className="text-red-500">*</span>
            </label>
            <select
              name="defaultTechnician"
              value={formData.defaultTechnician}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.defaultTechnician ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a technician</option>
              {technicians.map((tech) => (
                <option key={tech._id} value={tech._id}>
                  {tech.name} {tech.team && `- ${tech.team.teamName}`}
                </option>
              ))}
            </select>
            {errors.defaultTechnician && (
              <p className="mt-1 text-sm text-red-500">{errors.defaultTechnician}</p>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/equipment')}
            className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-6 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                {isEditMode ? 'Update Equipment' : 'Create Equipment'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EquipmentForm;
