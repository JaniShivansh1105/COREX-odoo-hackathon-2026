import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Eye, Edit, Trash2, AlertCircle, Columns, Calendar } from 'lucide-react';
import { requestAPI } from '../api/request.api';
import useAuth from '../hooks/useAuth';
import { canCreateMaintenanceRequest, canEditMaintenanceRequest, canDeleteMaintenanceRequest } from '../utils/rolePermissions';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';

/**
 * Maintenance Requests List Page
 * Features:
 * - View all maintenance requests with role-based filtering
 * - Search by subject or equipment name
 * - Filter by stage, request type, priority, and category
 * - Create, view, edit, delete requests (role-based)
 * - Overdue indicator
 * 
 * @param {string} filterByUser - Filter to show only requests for specific user
 * @param {boolean} filterOverdue - Filter to show only overdue requests
 * @param {boolean} showHeader - Show page header with title and action buttons (default: true)
 */
const Maintenance = ({ filterByUser, filterOverdue, showHeader = true }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast, ToastContainer } = useToast();

  // State
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, requestId: null, subject: '' });

  // Filter states
  const [filters, setFilters] = useState({
    stage: '',
    requestType: '',
    priority: '',
    category: ''
  });

  // Available filter options (will be populated from data)
  const [filterOptions, setFilterOptions] = useState({
    stages: [],
    requestTypes: [],
    priorities: [],
    categories: []
  });

  // Fetch requests on mount
  useEffect(() => {
    fetchRequests();
  }, []);

  // Apply filters and search whenever they change
  useEffect(() => {
    applyFilters();
  }, [searchTerm, filters, requests, filterByUser, filterOverdue]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await requestAPI.getAllRequests();
      setRequests(data);
      
      // Extract unique values for filters
      const stages = [...new Set(data.map(r => r.stage))];
      const requestTypes = [...new Set(data.map(r => r.requestType))];
      const priorities = [...new Set(data.map(r => r.priority))];
      const categories = [...new Set(data.map(r => r.equipmentCategory).filter(Boolean))];
      
      setFilterOptions({
        stages,
        requestTypes,
        priorities,
        categories
      });
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      showToast('Failed to load maintenance requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...requests];

    // Apply prop-based filters first
    if (filterByUser) {
      filtered = filtered.filter(req => 
        req.createdBy?._id === filterByUser || req.assignedTo?._id === filterByUser
      );
    }

    if (filterOverdue) {
      const now = new Date();
      filtered = filtered.filter(req => {
        if (!req.scheduledDate) return false;
        return new Date(req.scheduledDate) < now && req.stage !== 'Repaired' && req.stage !== 'Scrap';
      });
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(req =>
        req.subject.toLowerCase().includes(term) ||
        req.equipment?.name.toLowerCase().includes(term)
      );
    }

    // Stage filter
    if (filters.stage) {
      filtered = filtered.filter(req => req.stage === filters.stage);
    }

    // Request type filter
    if (filters.requestType) {
      filtered = filtered.filter(req => req.requestType === filters.requestType);
    }

    // Priority filter
    if (filters.priority) {
      filtered = filtered.filter(req => req.priority === filters.priority);
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(req => req.equipmentCategory === filters.category);
    }

    setFilteredRequests(filtered);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const clearFilters = () => {
    setFilters({
      stage: '',
      requestType: '',
      priority: '',
      category: ''
    });
    setSearchTerm('');
  };

  const handleDelete = async () => {
    try {
      await requestAPI.deleteRequest(deleteDialog.requestId);
      showToast('Request deleted successfully', 'success');
      setDeleteDialog({ isOpen: false, requestId: null, subject: '' });
      fetchRequests(); // Refresh list
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
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6">
      {/* Header */}
      {showHeader && (
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Maintenance Requests</h1>
            <p className="text-gray-600 mt-2">Track and manage maintenance requests</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate('/maintenance/kanban')}
              className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Columns className="w-5 h-5 mr-2" />
              Kanban Board
            </button>
            <button
              onClick={() => navigate('/calendar')}
              className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Calendar
            </button>
            {canCreateMaintenanceRequest(user.role) && (
              <button
                onClick={() => navigate('/maintenance/new')}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Request
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by subject or equipment name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stage</label>
              <select
                value={filters.stage}
                onChange={(e) => handleFilterChange('stage', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Stages</option>
                {filterOptions.stages.map(stage => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Request Type</label>
              <select
                value={filters.requestType}
                onChange={(e) => handleFilterChange('requestType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                {filterOptions.requestTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Priorities</option>
                {filterOptions.priorities.map(priority => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {filterOptions.categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredRequests.length} of {requests.length} requests
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔨</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Requests Found</h3>
            <p className="text-gray-600">
              {requests.length === 0
                ? 'No maintenance requests yet. Create your first request to get started.'
                : 'No requests match your filters. Try adjusting your search criteria.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Technician
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scheduled
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {request.subject}
                          {request.isOverdue && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Overdue
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{request.equipment?.name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{request.equipmentCategory || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{request.requestType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadgeColor(request.priority)}`}>
                        {request.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStageBadgeColor(request.stage)}`}>
                        {request.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {request.assignedTechnician?.name || 'Unassigned'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(request.scheduledDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`/maintenance/${request._id}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {canEditMaintenanceRequest(user.role) && (
                          <button
                            onClick={() => navigate(`/maintenance/${request._id}/edit`)}
                            className="text-green-600 hover:text-green-900"
                            title="Edit Request"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                        )}
                        {canDeleteMaintenanceRequest(user.role) && (
                          <button
                            onClick={() => setDeleteDialog({
                              isOpen: true,
                              requestId: request._id,
                              subject: request.subject
                            })}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Request"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, requestId: null, subject: '' })}
        onConfirm={handleDelete}
        title="Delete Request"
        message={`Are you sure you want to delete "${deleteDialog.subject}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
};

export default Maintenance;
