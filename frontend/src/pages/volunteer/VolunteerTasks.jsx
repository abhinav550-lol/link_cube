// ─── Volunteer Tasks Page ─────────────────────────────────────────────────────
// Fetches real assigned tasks from GET /api/tasks/assigned/me
// Clicking a task navigates to the shared TaskDetailPage (read-only for volunteers).

import React, { useState, useEffect } from 'react';
import { taskService } from '../../services/taskService';
import TaskCard from '../../components/tasks/TaskCard';

const STATUS_OPTIONS = ['All', 'open', 'in_progress', 'completed'];
const STATUS_LABELS  = { All: 'All', open: 'Open', in_progress: 'In Progress', completed: 'Completed' };

export default function VolunteerTasks() {
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [filter,  setFilter]  = useState('All');

  useEffect(() => {
    taskService.getAssignedToMe()
      .then((d) => setTasks(d?.data || []))
      .catch((err) => setError(err.message || 'Failed to load tasks.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'All' ? tasks : tasks.filter((t) => t.status === filter);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-semibold text-ink">My Tasks</h1>
        <p className="text-sm text-muted mt-1">
          {tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned to you
        </p>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={[
              'px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all',
              filter === s ? 'bg-ink text-white' : 'bg-fog text-slate hover:bg-silver/50',
            ].join(' ')}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* States */}
      {loading && <p className="text-sm text-muted">Loading tasks…</p>}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!loading && !error && tasks.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-fog">
          <p className="text-3xl mb-3">✅</p>
          <p className="text-sm font-medium text-ink mb-1">No tasks assigned yet</p>
          <p className="text-xs text-muted">An NGO will assign tasks to you once you match their requirements.</p>
        </div>
      )}

      {!loading && filtered.length === 0 && tasks.length > 0 && (
        <div className="text-center py-12 text-muted">
          <p className="text-sm">No tasks in this category.</p>
        </div>
      )}

      {/* Task grid — clicking navigates to shared TaskDetailPage (read-only) */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((task) => (
          <TaskCard
            key={task._id}
            task={task}
            detailPath={`/volunteer/tasks/${task._id}`}
          />
        ))}
      </div>
    </div>
  );
}
