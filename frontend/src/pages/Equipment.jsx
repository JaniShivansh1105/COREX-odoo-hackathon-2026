import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Edit, Trash2, Eye } from 'lucide-react';
import * as equipmentAPI from '../api/equipment.api';
import useAuth from '../hooks/useAuth';
import { canManageEquipment, canDelete } from '../utils/rolePermissions';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';

/**
 * Equipment List Page
 * Display and manage all equipment
 * 
 * @param {string} filterByOwnership - Filter by Department or Employee
 * @param {string} groupBy - Group results by 'department' or 'employee'
 * @param {boolean} showHeader - Show page header (default: true)
 */
const Equipment = ({ filterByOwnership, groupBy, showHeader = true }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast, ToastContainer } = useToast();

  // State
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState(null);

  // Permissions
  const canManage = canManageEquipment(user?.role);
  const canDeleteEquipment = canDelete(user?.role);

  // Fetch equipment on mount
  useEffect(() => {
    fetchEquipment();
  }, []);

  // Fetch equipment from API
  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.isActive = statusFilter === 'active';

      const response = await equipmentAPI.getAllEquipment(params);
      setEquipment(response.data);

      // Extract unique categories
      const uniqueCategories = [...new Set(response.data.map((item) => item.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to fetch equipment', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Refetch when filters change
  useEffect(() => {
    fetchEquipment();
  }, [categoryFilter, statusFilter]);

  // Filter equipment by search term and ownership
  let filteredEquipment = equipment.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      item.equipmentName?.toLowerCase().includes(searchLower) ||
      item.serialNumber?.toLowerCase().includes(searchLower)
    );

    // Apply ownership filter if specified
    if (filterByOwnership === 'Department') {
      return matchesSearch && item.ownership === 'Department';
    } else if (filterByOwnership === 'Employee') {
      return matchesSearch && item.ownership === 'Employee';
    }

    return matchesSearch;
  });

  // Group equipment if groupBy is specified
  const groupedEquipment = {};
  if (groupBy) {
    filteredEquipment.forEach((item) => {
      let groupKey;
      if (groupBy === 'department') {
        groupKey = item.department || 'Unassigned';
      } else if (groupBy === 'employee') {
        groupKey = item.assignedTo || 'Unassigned';
      }
      
      if (!groupedEquipment[groupKey]) {
        groupedEquipment[groupKey] = [];
      }
      groupedEquipment[groupKey].push(item);
    });
  }

  // Handle delete equipment
  const handleDelete = async () => {
    if (!equipmentToDelete) return;

    try {
      await equipmentAPI.deleteEquipment(equipmentToDelete._id);
      showToast('Equipment deleted successfully', 'success');
      fetchEquipment();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete equipment', 'error');
    }
  };

  // Open delete confirmation
  const confirmDelete = (item) => {
    setEquipmentToDelete(item);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="p-6">
      <ToastContainer />

      {/* Header */}
      {showHeader && (
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Equipment Management</h1>
            <p className="text-gray-600 mt-2">View and manage all equipment</p>
          </div>
          {canManage && (
            <button
              onClick={() => navigate('/equipment/new')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Equipment
            </button>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or serial number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Scrapped</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {/* Equipment Display - Grouped or Table */}
          {filteredEquipment.length > 0 ? (
            groupBy ? (
              /* Grouped View */
              <div className="space-y-6">
                {Object.entries(groupedEquipment).map(([groupName, items]) => (
                  <div key={groupName} className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {groupName}
                        <span className="ml-2 text-sm font-normal text-gray-500">
                          ({items.length} items)
                        </span>
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Equipment Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Serial Number
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Category
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Location
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {items.map((item) => (
                            <tr
                              key={item._id}
                              className="hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() => navigate(`/equipment/${item._id}`)}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {item.equipmentName}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{item.serialNumber}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{item.category}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{item.location || '-'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {item.isActive ? (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    Active
                                  </span>
                                ) : (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                    Scrapped
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => navigate(`/equipment/${item._id}`)}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="View Details"
                                  >
                                    <Eye className="h-5 w-5" />
                                  </button>
                                  {canManage && (
                                    <button
                                      onClick={() => navigate(`/equipment/${item._id}/edit`)}
                                      className="text-primary-600 hover:text-primary-900"
                                      title="Edit"
                                    >
                                      <Edit className="h-5 w-5" />
                                    </button>
                                  )}
                                  {canDeleteEquipment && (
                                    <button
                                      onClick={() => confirmDelete(item)}
                                      className="text-red-600 hover:text-red-900"
                                      title="Delete"
                                    >
                                      <Trash2 className="h-5 w-5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Normal Table View */
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Equipment Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Serial Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ownership
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredEquipment.map((item) => (
                        <tr
                          key={item._id}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/equipment/${item._id}`)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {item.equipmentName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{item.serialNumber}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{item.category}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {item.ownershipType}
                              {item.ownershipType === 'Department' && item.department && (
                                <span className="text-gray-500"> - {item.department}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{item.location || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.isActive ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                Scrapped
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => navigate(`/equipment/${item._id}`)}
                                className="text-blue-600 hover:text-blue-900"
                                title="View Details"
                              >
                                <Eye className="h-5 w-5" />
                              </button>
                              {canManage && (
                                <button
                                  onClick={() => navigate(`/equipment/${item._id}/edit`)}
                                  className="text-primary-600 hover:text-primary-900"
                                  title="Edit"
                                >
                                  <Edit className="h-5 w-5" />
                                </button>
                              )}
                              {canDeleteEquipment && (
                                <button
                                  onClick={() => confirmDelete(item)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">🔧</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No equipment found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || categoryFilter || statusFilter
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first equipment'}
              </p>
              {canManage && !searchTerm && !categoryFilter && !statusFilter && (
                <button
                  onClick={() => navigate('/equipment/new')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Equipment
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Equipment"
        message={`Are you sure you want to delete "${equipmentToDelete?.equipmentName}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default Equipment;
