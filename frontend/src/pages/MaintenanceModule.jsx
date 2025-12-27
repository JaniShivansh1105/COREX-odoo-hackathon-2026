import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, Calendar as CalendarIcon, List, Plus, User, AlertCircle } from 'lucide-react';
import useAuth from '../hooks/useAuth';

// Import existing page components
import Kanban from './Kanban';
import Calendar from './Calendar';
import Maintenance from './Maintenance';
import MaintenanceForm from './MaintenanceForm';

/**
 * MaintenanceModule Component
 * Tab-based container for all maintenance-related views
 * 
 * Tabs:
 * 1. Kanban Board - Visual workflow management
 * 2. Calendar View - Scheduled maintenance timeline
 * 3. List View - Tabular request listing
 * 4. Create Request - New request form
 * 5. My Requests - User's own requests
 * 6. Overdue Requests - Late requests (Admin/Manager only)
 */
const MaintenanceModule = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Determine active tab from URL or default to 'list'
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/maintenance/kanban')) return 'kanban';
    if (path.includes('/maintenance/calendar')) return 'calendar';
    if (path.includes('/maintenance/new')) return 'create';
    if (path.includes('/maintenance/my-requests')) return 'my-requests';
    if (path.includes('/maintenance/overdue')) return 'overdue';
    return 'list';
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromPath());

  // Tab definitions
  const tabs = [
    {
      id: 'kanban',
      label: 'Kanban Board',
      icon: LayoutGrid,
      roles: ['Admin', 'Manager', 'Technician', 'User']
    },
    {
      id: 'calendar',
      label: 'Calendar View',
      icon: CalendarIcon,
      roles: ['Admin', 'Manager', 'Technician', 'User']
    },
    {
      id: 'list',
      label: 'List View',
      icon: List,
      roles: ['Admin', 'Manager', 'Technician', 'User']
    },
    {
      id: 'create',
      label: 'Create Request',
      icon: Plus,
      roles: ['Admin', 'Manager', 'Technician', 'User']
    },
    {
      id: 'my-requests',
      label: 'My Requests',
      icon: User,
      roles: ['Admin', 'Manager', 'Technician', 'User']
    },
    {
      id: 'overdue',
      label: 'Overdue Requests',
      icon: AlertCircle,
      roles: ['Admin', 'Manager']
    }
  ];

  // Filter tabs based on user role
  const visibleTabs = tabs.filter(tab => tab.roles.includes(user?.role));

  // Handle tab change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    
    // Update URL without page reload
    const paths = {
      'kanban': '/maintenance/kanban',
      'calendar': '/maintenance/calendar',
      'list': '/maintenance',
      'create': '/maintenance/new',
      'my-requests': '/maintenance/my-requests',
      'overdue': '/maintenance/overdue'
    };
    
    navigate(paths[tabId], { replace: true });
  };

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'kanban':
        return <Kanban />;
      case 'calendar':
        return <Calendar />;
      case 'list':
        return <Maintenance showHeader={false} />;
      case 'create':
        return <MaintenanceForm />;
      case 'my-requests':
        return <MyRequests />;
      case 'overdue':
        return <OverdueRequests />;
      default:
        return <Maintenance showHeader={false} />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-6">
        <nav className="flex space-x-8 overflow-x-auto" aria-label="Maintenance Tabs">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  transition-colors duration-200
                  ${isActive
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto bg-gray-50">
        {renderTabContent()}
      </div>
    </div>
  );
};

/**
 * MyRequests Component
 * Shows requests created by or assigned to the current user
 */
const MyRequests = () => {
  const { user } = useAuth();
  
  // Reuse the Maintenance component with pre-applied filters
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Requests</h2>
        <p className="mt-2 text-gray-600">
          Requests you created or are assigned to
        </p>
      </div>
      <Maintenance filterByUser={user?._id} showHeader={false} />
    </div>
  );
};

/**
 * OverdueRequests Component
 * Shows requests past their scheduled date (Admin/Manager only)
 */
const OverdueRequests = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <AlertCircle className="h-7 w-7 text-red-600 mr-3" />
          Overdue Requests
        </h2>
        <p className="mt-2 text-gray-600">
          Maintenance requests past their scheduled date
        </p>
      </div>
      <Maintenance filterOverdue={true} showHeader={false} />
    </div>
  );
};

export default MaintenanceModule;
