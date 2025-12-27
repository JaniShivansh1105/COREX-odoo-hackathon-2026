import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ArrowLeft, Search, Filter, List, Calendar } from 'lucide-react';
import { requestAPI } from '../api/request.api';
import useAuth from '../hooks/useAuth';
import { useNotifications } from '../context/NotificationContext';
import { canUpdateStage } from '../utils/rolePermissions';
import LoadingSpinner from '../components/LoadingSpinner';
import KanbanCard from '../components/KanbanCard';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';

/**
 * DroppableColumn Component
 * Wrapper for each Kanban column to make it a drop target
 */
const DroppableColumn = ({ stage, children, stageColor, headerColor, count }) => {
  const { setNodeRef } = useDroppable({
    id: stage,
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-lg border-2 overflow-hidden ${stageColor}`}
    >
      {/* Column Header */}
      <div className={`${headerColor} text-white px-4 py-3 flex justify-between items-center`}>
        <h3 className="font-semibold text-sm">{stage}</h3>
        <span className="bg-white bg-opacity-30 px-2 py-1 rounded-full text-xs font-medium">
          {count}
        </span>
      </div>
      {children}
    </div>
  );
};

/**
 * Kanban Board Component
 * Visualizes maintenance requests by stage with drag-and-drop
 * 
 * Features:
 * - 4 columns: New, In Progress, Repaired, Scrap
 * - Drag-and-drop stage updates
 * - Role-based visibility and permissions
 * - Filters and search
 * - Scrap confirmation dialog
 */
const Kanban = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast, ToastContainer } = useToast();
  const { addNotification, addAuditLog } = useNotifications();

  // State
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [scrapDialog, setScrapDialog] = useState({ isOpen: false, requestId: null, fromStage: '' });

  // Filter states
  const [filters, setFilters] = useState({
    priority: '',
    category: '',
    requestType: ''
  });

  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    priorities: [],
    categories: [],
    requestTypes: []
  });

  // Column definitions
  const stages = ['New', 'In Progress', 'Repaired', 'Scrap'];

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filters, requests]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await requestAPI.getAllRequests();
      setRequests(data);

      // Extract unique values for filters
      const priorities = [...new Set(data.map(r => r.priority))];
      const categories = [...new Set(data.map(r => r.equipmentCategory).filter(Boolean))];
      const requestTypes = [...new Set(data.map(r => r.requestType))];

      setFilterOptions({ priorities, categories, requestTypes });
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      showToast('Failed to load requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...requests];

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(req =>
        req.subject.toLowerCase().includes(term) ||
        req.equipment?.name.toLowerCase().includes(term)
      );
    }

    // Priority filter
    if (filters.priority) {
      filtered = filtered.filter(req => req.priority === filters.priority);
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(req => req.equipmentCategory === filters.category);
    }

    // Request type filter
    if (filters.requestType) {
      filtered = filtered.filter(req => req.requestType === filters.requestType);
    }

    setFilteredRequests(filtered);
  };

  const getRequestsByStage = (stage) => {
    return filteredRequests.filter(req => req.stage === stage);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const clearFilters = () => {
    setFilters({ priority: '', category: '', requestType: '' });
    setSearchTerm('');
  };

  // Check if user can drag requests
  const canDrag = () => {
    return canUpdateStage(user.role);
  };

  // Validate stage transition
  const isValidTransition = (fromStage, toStage) => {
    // Can't move from Scrap
    if (fromStage === 'Scrap') {
      return false;
    }

    // Allow moving to Scrap from any stage (with confirmation)
    if (toStage === 'Scrap') {
      return true;
    }

    // Standard workflow transitions
    const validTransitions = {
      'New': ['In Progress'],
      'In Progress': ['Repaired'],
      'Repaired': [] // Can't move from Repaired except to Scrap
    };

    return validTransitions[fromStage]?.includes(toStage) || false;
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const requestId = active.id;
    const newStage = over.id;

    const request = requests.find(r => r._id === requestId);
    if (!request) return;

    const oldStage = request.stage;

    // No change
    if (oldStage === newStage) return;

    // Validate transition
    if (!isValidTransition(oldStage, newStage)) {
      showToast(`Cannot move from ${oldStage} to ${newStage}`, 'error');
      return;
    }

    // Handle Scrap with confirmation
    if (newStage === 'Scrap') {
      setScrapDialog({
        isOpen: true,
        requestId,
        fromStage: oldStage,
        subject: request.subject
      });
      return;
    }

    // Update stage
    await updateRequestStage(requestId, oldStage, newStage);
  };

  const confirmScrapMove = async () => {
    const { requestId, fromStage } = scrapDialog;
    setScrapDialog({ isOpen: false, requestId: null, fromStage: '', subject: '' });
    await updateRequestStage(requestId, fromStage, 'Scrap');
  };

  const updateRequestStage = async (requestId, oldStage, newStage) => {
    try {
      // Find the request for notification details
      const request = requests.find(r => r._id === requestId);
      
      // Optimistic update
      setRequests(prev => prev.map(req =>
        req._id === requestId ? { ...req, stage: newStage } : req
      ));

      await requestAPI.updateRequestStage(requestId, newStage);
      showToast(`Request moved to ${newStage}`, 'success');
      
      // Add audit log for stage change
      addAuditLog({
        action: 'stage_change',
        entityType: 'request',
        entityId: requestId,
        details: `Changed stage from "${oldStage}" to "${newStage}" for request: ${request?.equipment?.name || request?.subject || 'Unknown'}`
      });
      
      // Send notification to creator and technician
      const recipientIds = [];
      if (request?.createdBy?._id && request.createdBy._id !== user._id) {
        recipientIds.push(request.createdBy._id);
      }
      if (request?.assignedTo?._id && request.assignedTo._id !== user._id) {
        recipientIds.push(request.assignedTo._id);
      }
      
      // Special handling for Scrap stage
      if (newStage === 'Scrap') {
        // Notify admins/managers about equipment scrap
        addNotification({
          type: 'equipment_scrapped',
          title: 'Equipment Scrapped',
          message: `Equipment "${request?.equipment?.name || 'Unknown'}" has been marked as scrapped via maintenance request`,
          entityType: 'equipment',
          entityId: request?.equipment?._id,
          recipientRoles: ['Admin', 'Manager']
        });
      }
      
      if (recipientIds.length > 0) {
        addNotification({
          type: 'stage_updated',
          title: 'Request Stage Updated',
          message: `Request "${request?.subject || request?.equipment?.name || 'Unknown'}" moved to ${newStage}`,
          entityType: 'request',
          entityId: requestId,
          recipientIds: recipientIds
        });
      }
    } catch (error) {
      console.error('Failed to update stage:', error);
      showToast(error.response?.data?.message || 'Failed to update stage', 'error');

      // Rollback on error
      setRequests(prev => prev.map(req =>
        req._id === requestId ? { ...req, stage: oldStage } : req
      ));
    }
  };

  const handleCardClick = (requestId) => {
    navigate(`/maintenance/${requestId}`);
  };

  const getStageColor = (stage) => {
    const colors = {
      'New': 'bg-blue-50 border-blue-200',
      'In Progress': 'bg-yellow-50 border-yellow-200',
      'Repaired': 'bg-green-50 border-green-200',
      'Scrap': 'bg-red-50 border-red-200'
    };
    return colors[stage] || 'bg-gray-50 border-gray-200';
  };

  const getStageHeaderColor = (stage) => {
    const colors = {
      'New': 'bg-blue-600',
      'In Progress': 'bg-yellow-500',
      'Repaired': 'bg-green-600',
      'Scrap': 'bg-red-600'
    };
    return colors[stage] || 'bg-gray-600';
  };

  const activeRequest = activeId ? requests.find(r => r._id === activeId) : null;

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6 h-screen flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/maintenance')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to List View
        </button>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Kanban Board</h1>
            <p className="text-gray-600 mt-2">Drag and drop to update request stages</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate('/maintenance')}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <List className="w-5 h-5 mr-2" />
              List View
            </button>
            <button
              onClick={() => navigate('/calendar')}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by subject or equipment..."
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
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

            <div className="md:col-span-3 flex justify-end">
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

      {/* Results Info */}
      {!canDrag() && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            ℹ️ You have read-only access. Only Admin and Manager roles can move requests.
          </p>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-4 gap-4 h-full">
            {stages.map(stage => {
              const stageRequests = getRequestsByStage(stage);
              const isDraggable = canDrag() && stage !== 'Scrap';

              return (
                <DroppableColumn
                  key={stage}
                  stage={stage}
                  stageColor={getStageColor(stage)}
                  headerColor={getStageHeaderColor(stage)}
                  count={stageRequests.length}
                >
                  {/* Sortable Items */}
                  <SortableContext
                    items={stageRequests.map(r => r._id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex-1 p-3 overflow-y-auto">
                      {stageRequests.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-sm">
                          No requests
                        </div>
                      ) : (
                        stageRequests.map(request => (
                          <KanbanCard
                            key={request._id}
                            request={request}
                            isDraggable={isDraggable}
                            onClick={() => handleCardClick(request._id)}
                          />
                        ))
                      )}
                    </div>
                  </SortableContext>
                </DroppableColumn>
              );
            })}
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeRequest ? (
              <div className="rotate-3">
                <KanbanCard
                  request={activeRequest}
                  isDraggable={false}
                  onClick={() => {}}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Scrap Confirmation Dialog */}
      <ConfirmDialog
        isOpen={scrapDialog.isOpen}
        onClose={() => setScrapDialog({ isOpen: false, requestId: null, fromStage: '', subject: '' })}
        onConfirm={confirmScrapMove}
        title="Confirm Scrap"
        message={`Are you sure you want to scrap "${scrapDialog.subject}"? This will permanently deactivate the associated equipment. This action should only be used when equipment is beyond repair.`}
        confirmText="Yes, Scrap Equipment"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
};

export default Kanban;
