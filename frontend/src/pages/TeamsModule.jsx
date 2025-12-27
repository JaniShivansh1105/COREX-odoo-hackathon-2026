import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, Plus, Eye } from 'lucide-react';
import useAuth from '../hooks/useAuth';

// Import existing page component
import Teams from './Teams';

/**
 * TeamsModule Component
 * Tab-based container for team management
 * 
 * Tabs:
 * 1. All Teams - List of maintenance teams
 * 2. Create Team - Team creation form
 */
const TeamsModule = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Determine active tab from URL or default to 'all'
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/teams/new')) return 'create';
    return 'all';
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromPath());

  // Tab definitions
  const tabs = [
    {
      id: 'all',
      label: 'All Teams',
      icon: Users,
      roles: ['Admin', 'Manager']
    },
    {
      id: 'create',
      label: 'Create Team',
      icon: Plus,
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
      'all': '/teams',
      'create': '/teams/new'
    };
    
    navigate(paths[tabId], { replace: true });
  };

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'all':
        return <Teams showHeader={false} />;
      case 'create':
        return <CreateTeam />;
      default:
        return <Teams showHeader={false} />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-6">
        <nav className="flex space-x-8 overflow-x-auto" aria-label="Teams Tabs">
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
 * CreateTeam Component
 * Team creation placeholder (will be implemented with backend integration)
 */
const CreateTeam = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create New Team</h2>
        <p className="mt-2 text-gray-600">
          Create a new maintenance team
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">➕</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Team Creation Form
          </h3>
          <p className="text-gray-600">
            Team creation functionality will be available in the next phase.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeamsModule;
