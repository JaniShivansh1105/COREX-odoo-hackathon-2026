import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Package, Building, User, List } from 'lucide-react';
import useAuth from '../hooks/useAuth';

// Import existing page component
import Equipment from './Equipment';

/**
 * EquipmentModule Component
 * Tab-based container for all equipment-related views
 * 
 * Tabs:
 * 1. All Equipment - Complete equipment list with CRUD
 * 2. By Department - Equipment grouped by department
 * 3. By Employee - Equipment assigned to employees
 */
const EquipmentModule = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Determine active tab from URL or default to 'all'
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/equipment/by-department')) return 'by-department';
    if (path.includes('/equipment/by-employee')) return 'by-employee';
    return 'all';
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromPath());

  // Tab definitions
  const tabs = [
    {
      id: 'all',
      label: 'All Equipment',
      icon: List,
      roles: ['Admin', 'Manager', 'Technician', 'User']
    },
    {
      id: 'by-department',
      label: 'By Department',
      icon: Building,
      roles: ['Admin', 'Manager', 'Technician', 'User']
    },
    {
      id: 'by-employee',
      label: 'By Employee',
      icon: User,
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
      'all': '/equipment',
      'by-department': '/equipment/by-department',
      'by-employee': '/equipment/by-employee'
    };
    
    navigate(paths[tabId], { replace: true });
  };

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'all':
        return <Equipment showHeader={false} />;
      case 'by-department':
        return <ByDepartment />;
      case 'by-employee':
        return <ByEmployee />;
      default:
        return <Equipment showHeader={false} />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-6">
        <nav className="flex space-x-8 overflow-x-auto" aria-label="Equipment Tabs">
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
 * ByDepartment Component
 * Shows equipment grouped by department
 */
const ByDepartment = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Equipment by Department</h2>
        <p className="mt-2 text-gray-600">
          Equipment organized by department ownership
        </p>
      </div>
      <Equipment filterByOwnership="Department" showHeader={false} groupBy="department" />
    </div>
  );
};

/**
 * ByEmployee Component
 * Shows equipment assigned to individual employees
 */
const ByEmployee = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Equipment by Employee</h2>
        <p className="mt-2 text-gray-600">
          Equipment assigned to individual employees
        </p>
      </div>
      <Equipment filterByOwnership="Employee" showHeader={false} groupBy="employee" />
    </div>
  );
};

export default EquipmentModule;
