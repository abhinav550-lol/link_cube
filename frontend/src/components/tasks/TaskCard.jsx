// ─── TaskCard ─────────────────────────────────────────────────────────────────
// Compact card displaying a task summary. Used in NGO task list + volunteer list.

import React from 'react';
import { Link } from 'react-router-dom';

const PRIORITY_COLORS = {
  low:      'bg-gray-100 text-gray-600',
  medium:   'bg-yellow-100 text-yellow-700',
  high:     'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

const STATUS_COLORS = {
  open:        'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed:   'bg-green-100 text-green-700',
  cancelled:   'bg-gray-100 text-gray-500',
};

/**
 * @param {object} task   - Task document from the backend
 * @param {string} detailPath - Route to navigate to on click (e.g. /ngo/tasks/:id)
 */
export default function TaskCard({ task, detailPath }) {
  return (
    <Link
      to={detailPath || '#'}
      className="block bg-white rounded-xl border border-fog shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 p-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-ink leading-snug line-clamp-2 flex-1">
          {task.title}
        </h3>
        <span className={`badge shrink-0 ${PRIORITY_COLORS[task.priority] || 'bg-gray-100 text-gray-600'}`}>
          {task.priority || 'medium'}
        </span>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-muted leading-relaxed line-clamp-2 mb-3">
          {task.description}
        </p>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`badge ${STATUS_COLORS[task.status] || 'bg-gray-100 text-gray-500'}`}>
          {task.status?.replace('_', ' ')}
        </span>
        {task.category && (
          <span className="badge bg-fog text-slate">{task.category}</span>
        )}
        {task.location && (
          <span className="text-xs text-muted">📍 {task.location}</span>
        )}
      </div>

      {/* Skills */}
      {task.requiredSkills?.length > 0 && (
        <div className="flex gap-1 flex-wrap mt-3 pt-3 border-t border-fog">
          {task.requiredSkills.map((s) => (
            <span key={s} className="badge bg-fog text-slate text-[10px]">{s}</span>
          ))}
        </div>
      )}

      {/* Assigned count (NGO view) */}
      {task.assignedVolunteers !== undefined && (
        <p className="text-xs text-muted mt-2">
          {Array.isArray(task.assignedVolunteers)
            ? `${task.assignedVolunteers.length} volunteer${task.assignedVolunteers.length !== 1 ? 's' : ''} assigned`
            : ''}
        </p>
      )}
    </Link>
  );
}
