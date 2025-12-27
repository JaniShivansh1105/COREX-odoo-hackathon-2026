/**
 * Teams Page (Placeholder)
 * Will contain team management in future phases
 * Access: Admin and Manager only
 * 
 * @param {boolean} showHeader - Show page header (default: true)
 */
const Teams = ({ showHeader = true }) => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Maintenance Teams</h1>
        <p className="text-gray-600 mt-2">Manage maintenance teams and members</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Team Management
          </h3>
          <p className="text-gray-600">
            Team listing, member management, and team lead assignment will be implemented in the next phase.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Teams;
