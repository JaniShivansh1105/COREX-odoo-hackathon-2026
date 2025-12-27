import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, Package, Users, TrendingUp } from 'lucide-react';
import useAuth from '../hooks/useAuth';

// Import Dashboard component for reuse
import Dashboard from './Dashboard';

/**
 * ReportsModule Component
 * Tab-based container for analytics and reports
 * 
 * Tabs:
 * 1. Request Analytics - Maintenance request insights
 * 2. Equipment Reports - Equipment status and performance
 * 3. Team Performance - Team efficiency metrics
 * 4. Trends - Historical trends and forecasting
 */
const ReportsModule = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Determine active tab from URL or default to 'requests'
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/reports/equipment')) return 'equipment';
    if (path.includes('/reports/teams')) return 'teams';
    if (path.includes('/reports/trends')) return 'trends';
    return 'requests';
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromPath());

  // Tab definitions
  const tabs = [
    {
      id: 'requests',
      label: 'Request Analytics',
      icon: BarChart3,
      roles: ['Admin', 'Manager']
    },
    {
      id: 'equipment',
      label: 'Equipment Reports',
      icon: Package,
      roles: ['Admin', 'Manager']
    },
    {
      id: 'teams',
      label: 'Team Performance',
      icon: Users,
      roles: ['Admin', 'Manager']
    },
    {
      id: 'trends',
      label: 'Trends',
      icon: TrendingUp,
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
      'requests': '/reports',
      'equipment': '/reports/equipment',
      'teams': '/reports/teams',
      'trends': '/reports/trends'
    };
    
    navigate(paths[tabId], { replace: true });
  };

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'requests':
        return <RequestAnalytics />;
      case 'equipment':
        return <EquipmentReports />;
      case 'teams':
        return <TeamPerformance />;
      case 'trends':
        return <Trends />;
      default:
        return <RequestAnalytics />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-6">
        <nav className="flex space-x-8 overflow-x-auto" aria-label="Reports Tabs">
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
 * RequestAnalytics Component
 * Reuses Dashboard component for request analytics
 */
const RequestAnalytics = () => {
  return <Dashboard reportType="requests" showHeader={false} />;
};

/**
 * EquipmentReports Component
 * Equipment-specific analytics
 */
const EquipmentReports = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Equipment Reports</h2>
        <p className="mt-2 text-gray-600">
          Equipment status, utilization, and maintenance history
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Equipment Analytics
          </h3>
          <p className="text-gray-600">
            Detailed equipment reports and insights will be available here.
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * TeamPerformance Component
 * Team efficiency and performance metrics
 */
const TeamPerformance = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Team Performance</h2>
        <p className="mt-2 text-gray-600">
          Team efficiency, workload distribution, and productivity metrics
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Team Analytics
          </h3>
          <p className="text-gray-600">
            Team performance metrics and analysis will be displayed here.
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Trends Component
 * Historical trends and predictive analytics
 */
const Trends = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Historical Trends</h2>
        <p className="mt-2 text-gray-600">
          Long-term patterns, seasonal trends, and predictive insights
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Trend Analysis
          </h3>
          <p className="text-gray-600">
            Historical data analysis and forecasting will be shown here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportsModule;
