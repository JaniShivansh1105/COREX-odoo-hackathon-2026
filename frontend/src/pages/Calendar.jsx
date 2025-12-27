import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/calendar.css';
import { Plus, AlertCircle, List } from 'lucide-react';
import { requestAPI } from '../api/request.api';
import useAuth from '../hooks/useAuth';
import { canCreateMaintenanceRequest } from '../utils/rolePermissions';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

// Setup the localizer for react-big-calendar
const localizer = momentLocalizer(moment);

/**
 * Calendar Component
 * Displays preventive maintenance requests on a calendar
 * 
 * Features:
 * - Month/Week/Day views
 * - Click event to view details
 * - Quick create (Admin/Manager only)
 * - Color-coded by priority
 * - Overdue indicators
 */
const Calendar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast, ToastContainer } = useToast();

  // State
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());
  const [quickCreateModal, setQuickCreateModal] = useState({
    isOpen: false,
    selectedDate: null
  });

  useEffect(() => {
    fetchCalendarEvents();
  }, []);

  const fetchCalendarEvents = async () => {
    try {
      setLoading(true);
      // Fetch preventive maintenance requests
      const data = await requestAPI.getAllRequests({ requestType: 'Preventive' });
      
      // Map to calendar events
      const calendarEvents = data
        .filter(req => req.scheduledDate) // Only include requests with scheduled dates
        .map(req => ({
          id: req._id,
          title: req.subject,
          start: new Date(req.scheduledDate),
          end: new Date(req.scheduledDate),
          resource: {
            ...req,
            equipment: req.equipment?.name || 'Unknown Equipment',
            priority: req.priority,
            stage: req.stage,
            isOverdue: req.isOverdue
          }
        }));

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
      showToast('Failed to load calendar events', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Event click handler
  const handleSelectEvent = useCallback((event) => {
    navigate(`/maintenance/${event.id}`);
  }, [navigate]);

  // Slot click handler (create new request)
  const handleSelectSlot = useCallback((slotInfo) => {
    if (canCreateMaintenanceRequest(user.role)) {
      setQuickCreateModal({
        isOpen: true,
        selectedDate: slotInfo.start
      });
    }
  }, [user.role]);

  // Quick create handler
  const handleQuickCreate = () => {
    const date = quickCreateModal.selectedDate;
    const formattedDate = moment(date).format('YYYY-MM-DD');
    setQuickCreateModal({ isOpen: false, selectedDate: null });
    // Navigate to create form with pre-filled date
    navigate('/maintenance/new', { state: { scheduledDate: formattedDate, requestType: 'Preventive' } });
  };

  // Custom event styling based on priority and overdue status
  const eventStyleGetter = (event) => {
    const { priority, isOverdue, stage } = event.resource;

    let backgroundColor = '#3B82F6'; // Default blue
    let borderColor = '#2563EB';

    // Color by priority
    if (priority === 'Critical') {
      backgroundColor = '#DC2626';
      borderColor = '#991B1B';
    } else if (priority === 'High') {
      backgroundColor = '#F97316';
      borderColor = '#C2410C';
    } else if (priority === 'Medium') {
      backgroundColor = '#3B82F6';
      borderColor = '#1D4ED8';
    } else if (priority === 'Low') {
      backgroundColor = '#6B7280';
      borderColor = '#4B5563';
    }

    // Muted for completed stages
    if (stage === 'Repaired' || stage === 'Scrap') {
      backgroundColor = '#10B981';
      borderColor = '#059669';
    }

    // Red border for overdue
    if (isOverdue && stage !== 'Repaired' && stage !== 'Scrap') {
      borderColor = '#DC2626';
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderWidth: '2px',
        borderStyle: 'solid',
        borderRadius: '4px',
        opacity: stage === 'Repaired' || stage === 'Scrap' ? 0.6 : 1,
        color: 'white',
        fontSize: '0.875rem',
        padding: '2px 6px'
      }
    };
  };

  // Custom event component
  const EventComponent = ({ event }) => {
    const { equipment, priority, isOverdue } = event.resource;
    return (
      <div className="flex items-center justify-between">
        <div className="truncate flex-1">
          <div className="font-semibold text-xs truncate">{event.title}</div>
          <div className="text-xs opacity-90 truncate">{equipment}</div>
        </div>
        {isOverdue && (
          <AlertCircle className="w-3 h-3 ml-1 flex-shrink-0" />
        )}
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Maintenance Calendar</h1>
            <p className="text-gray-600 mt-2">View and schedule preventive maintenance</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate('/maintenance')}
              className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <List className="w-5 h-5 mr-2" />
              List View
            </button>
            {canCreateMaintenanceRequest(user.role) && (
              <button
                onClick={() => navigate('/maintenance/new', { state: { requestType: 'Preventive' } })}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Preventive Request
              </button>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Priority Legend</h3>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-red-600 mr-2"></div>
              <span className="text-sm text-gray-600">Critical</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-orange-500 mr-2"></div>
              <span className="text-sm text-gray-600">High</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-blue-600 mr-2"></div>
              <span className="text-sm text-gray-600">Medium</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-gray-600 mr-2"></div>
              <span className="text-sm text-gray-600">Low</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-green-600 mr-2"></div>
              <span className="text-sm text-gray-600">Completed</span>
            </div>
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
              <span className="text-sm text-gray-600">Overdue</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        {canCreateMaintenanceRequest(user.role) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Click on any empty date to quickly create a preventive maintenance request.
            </p>
          </div>
        )}
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow p-6" style={{ minHeight: '600px' }}>
        {events.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Preventive Maintenance Scheduled
            </h3>
            <p className="text-gray-600 mb-4">
              Start by creating preventive maintenance requests to see them on the calendar.
            </p>
            {canCreateMaintenanceRequest(user.role) && (
              <button
                onClick={() => navigate('/maintenance/new', { state: { requestType: 'Preventive' } })}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create First Request
              </button>
            )}
          </div>
        ) : (
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable={canCreateMaintenanceRequest(user.role)}
            eventPropGetter={eventStyleGetter}
            components={{
              event: EventComponent
            }}
            views={['month', 'week', 'day']}
            popup
            tooltipAccessor={(event) => 
              `${event.title}\n${event.resource.equipment}\nPriority: ${event.resource.priority}\nStage: ${event.resource.stage}`
            }
          />
        )}
      </div>

      {/* Quick Create Modal */}
      <Modal
        isOpen={quickCreateModal.isOpen}
        onClose={() => setQuickCreateModal({ isOpen: false, selectedDate: null })}
        title="Create Preventive Maintenance"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            You're about to create a preventive maintenance request scheduled for{' '}
            <strong>{moment(quickCreateModal.selectedDate).format('MMMM D, YYYY')}</strong>
          </p>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setQuickCreateModal({ isOpen: false, selectedDate: null })}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleQuickCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Continue to Form
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
};

export default Calendar;
