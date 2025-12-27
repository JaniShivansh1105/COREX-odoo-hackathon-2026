import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertCircle, User } from 'lucide-react';

/**
 * KanbanCard Component
 * Draggable card for Kanban board
 * 
 * Props:
 * - request: Request object
 * - isDraggable: Whether card can be dragged
 * - onClick: Card click handler
 */
const KanbanCard = ({ request, isDraggable, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: request._id,
    disabled: !isDraggable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityColor = (priority) => {
    const colors = {
      Low: 'bg-gray-100 text-gray-800 border-gray-300',
      Medium: 'bg-blue-100 text-blue-800 border-blue-300',
      High: 'bg-orange-100 text-orange-800 border-orange-300',
      Critical: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getPriorityLeftBorder = (priority) => {
    const colors = {
      Low: 'border-l-gray-400',
      Medium: 'border-l-blue-500',
      High: 'border-l-orange-500',
      Critical: 'border-l-red-600'
    };
    return colors[priority] || 'border-l-gray-400';
  };

  // Card styling based on stage
  const isScrap = request.stage === 'Scrap';
  const cardClasses = `
    bg-white rounded-lg shadow-sm border-l-4 p-4 mb-3
    ${getPriorityLeftBorder(request.priority)}
    ${isDraggable ? 'cursor-grab active:cursor-grabbing hover:shadow-md' : 'cursor-pointer'}
    ${isScrap ? 'opacity-60 bg-gray-50' : ''}
    ${isDragging ? 'shadow-lg ring-2 ring-blue-500' : ''}
    transition-all duration-200
  `;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cardClasses}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      {/* Header: Subject */}
      <div className="mb-2">
        <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
          {request.subject}
        </h4>
      </div>

      {/* Equipment */}
      <div className="mb-2">
        <p className="text-xs text-gray-600">
          🔧 {request.equipment?.name || 'Unknown Equipment'}
        </p>
      </div>

      {/* Technician */}
      <div className="flex items-center mb-3">
        <User className="w-3 h-3 text-gray-400 mr-1" />
        <p className="text-xs text-gray-600 truncate">
          {request.assignedTechnician?.name || 'Unassigned'}
        </p>
      </div>

      {/* Footer: Badges */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        {/* Priority Badge */}
        <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getPriorityColor(request.priority)}`}>
          {request.priority}
        </span>

        {/* Overdue Badge */}
        {request.isOverdue && (
          <span className="flex items-center px-2 py-0.5 text-xs font-medium rounded bg-red-100 text-red-800 border border-red-300">
            <AlertCircle className="w-3 h-3 mr-1" />
            Overdue
          </span>
        )}
      </div>

      {/* Scrap Indicator */}
      {isScrap && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 italic">Equipment scrapped</p>
        </div>
      )}
    </div>
  );
};

export default KanbanCard;
