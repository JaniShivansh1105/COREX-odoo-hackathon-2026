import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  MapPin,
  Calendar,
  Shield,
  Users,
  ClipboardList,
} from 'lucide-react';
import * as equipmentAPI from '../api/equipment.api';
import useAuth from '../hooks/useAuth';
import { useNotifications } from '../context/NotificationContext';
import { canManageEquipment, canDelete } from '../utils/rolePermissions';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';

/**
 * Equipment Detail Page
 * Display detailed information about a single equipment
 */
const EquipmentDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast, ToastContainer } = useToast();
  const { addAuditLog } = useNotifications();

  // State
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [openRequestsCount, setOpenRequestsCount] = useState(0);

  // Permissions
  const canManage = canManageEquipment(user?.role);
  const canDeleteEquipment = canDelete(user?.role);

  // Fetch equipment details
  useEffect(() => {
    fetchEquipmentDetails();
    fetchOpenRequests();
  }, [id]);

  const fetchEquipmentDetails = async () => {
    try {
      setLoading(true);
      const response = await equipmentAPI.getEquipmentById(id);
      setEquipment(response.data);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to fetch equipment details', 'error');
      navigate('/equipment');
    } finally {
      setLoading(false);
    }
  };

  const fetchOpenRequests = async () => {
    try {
      const response = await equipmentAPI.getEquipmentOpenRequests(id);
      setOpenRequestsCount(response.count || 0);
    } catch (error) {
      // Silent fail for request count
      console.error('Failed to fetch open requests:', error);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      await equipmentAPI.deleteEquipment(id);
      showToast('Equipment deleted successfully', 'success');
      
      // Add audit log for equipment deletion
      addAuditLog({
        action: 'delete',
        entityType: 'equipment',
        entityId: id,
        details: `Deleted equipment: ${equipment?.equipmentName} (${equipment?.serialNumber})`
      });
      
      setTimeout(() => navigate('/equipment'), 1000);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete equipment', 'error');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Check warranty status
  const getWarrantyStatus = () => {
    if (!equipment?.warrantyExpiryDate) return null;
    const today = new Date();
    const expiryDate = new Date(equipment.warrantyExpiryDate);
    return expiryDate > today ? 'Active' : 'Expired';
  };

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!equipment) {
    return null;
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

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{equipment.equipmentName}</h1>
            <p className="text-gray-600 mt-2">Serial: {equipment.serialNumber}</p>
          </div>

          <div className="flex space-x-3">
            {canManage && (
              <button
                onClick={() => navigate(`/equipment/${id}/edit`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
            )}
            {canDeleteEquipment && (
              <button
                onClick={() => setDeleteDialogOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-6">
        {equipment.isActive ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            Active
          </span>
        ) : (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            Scrapped
          </span>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Equipment Name</p>
                <p className="text-base font-medium text-gray-900">{equipment.equipmentName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Serial Number</p>
                <p className="text-base font-medium text-gray-900">{equipment.serialNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="text-base font-medium text-gray-900">{equipment.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="text-base font-medium text-gray-900">{equipment.location || '-'}</p>
              </div>
            </div>
          </div>

          {/* Ownership Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ownership Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Ownership Type</p>
                <p className="text-base font-medium text-gray-900">{equipment.ownershipType}</p>
              </div>
              {equipment.ownershipType === 'Department' ? (
                <div>
                  <p className="text-sm text-gray-500">Department</p>
                  <p className="text-base font-medium text-gray-900">
                    {equipment.department || '-'}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500">Assigned Employee</p>
                  <p className="text-base font-medium text-gray-900">
                    {equipment.assignedEmployee?.name || '-'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Dates and Warranty */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Dates & Warranty</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Purchase Date</p>
                <p className="text-base font-medium text-gray-900">
                  {formatDate(equipment.purchaseDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Warranty Expiry</p>
                <p className="text-base font-medium text-gray-900">
                  {formatDate(equipment.warrantyExpiryDate)}
                </p>
              </div>
              {equipment.warrantyExpiryDate && (
                <div>
                  <p className="text-sm text-gray-500">Warranty Status</p>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      getWarrantyStatus() === 'Active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {getWarrantyStatus()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Maintenance Team */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Team Name</p>
                <p className="text-base font-medium text-gray-900">
                  {equipment.maintenanceTeam?.teamName || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Specialization</p>
                <p className="text-base font-medium text-gray-900">
                  {equipment.maintenanceTeam?.specialization || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Default Technician</p>
                <p className="text-base font-medium text-gray-900">
                  {equipment.defaultTechnician?.name || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Actions & Stats */}
        <div className="space-y-6">
          {/* Maintenance Requests Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Requests</h3>
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Open Requests</span>
                <span className="text-2xl font-bold text-primary-600">{openRequestsCount}</span>
              </div>
            </div>
            <button
              onClick={() => navigate(`/maintenance?equipmentId=${id}`)}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              View All Requests
            </button>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Info</h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <Package className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-gray-600">{equipment.category}</span>
              </div>
              <div className="flex items-center text-sm">
                <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-gray-600">{equipment.location || 'No location'}</span>
              </div>
              <div className="flex items-center text-sm">
                <Users className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-gray-600">{equipment.maintenanceTeam?.teamName}</span>
              </div>
              {equipment.warrantyExpiryDate && (
                <div className="flex items-center text-sm">
                  <Shield className="h-5 w-5 text-gray-400 mr-3" />
                  <span
                    className={
                      getWarrantyStatus() === 'Active' ? 'text-green-600' : 'text-gray-600'
                    }
                  >
                    Warranty {getWarrantyStatus()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Equipment"
        message={`Are you sure you want to delete "${equipment.equipmentName}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default EquipmentDetail;
