// ─── NgoTasks ─────────────────────────────────────────────────────────────────
// NGO task list page — all tasks created by the logged-in NGO.
// GET /api/tasks/my  |  POST /api/tasks (via CreateTaskModal)

import React, { useState, useEffect } from 'react';
import { taskService } from '../../services/taskService';
import TaskCard from '../../components/tasks/TaskCard';
import CreateTaskModal from '../../components/tasks/CreateTaskModal';
import Button from '../../components/Button';

export default function NgoTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  const fetchTasks = () => {
    setLoading(true);
    setError('');
    taskService.getMyTasks()
      .then((d) => setTasks(d?.data || []))
      .catch((err) => setError(err.message || 'Failed to load tasks.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleCreated = (newTask) => {
    setTasks((prev) => [newTask, ...prev]);
  };

  // Group by status
  const open        = tasks.filter((t) => t.status === 'open');
  const in_progress = tasks.filter((t) => t.status === 'in_progress');
  const completed   = tasks.filter((t) => t.status === 'completed');

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-semibold text-ink">My Tasks</h1>
          <p className="text-sm text-muted mt-1">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} created
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>+ Create Task</Button>
      </div>

      {/* Loading / error states */}
      {loading && <p className="text-sm text-muted">Loading tasks…</p>}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-100">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && tasks.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-fog">
          <p className="text-3xl mb-3">📋</p>
          <p className="text-sm font-medium text-ink mb-1">No tasks yet</p>
          <p className="text-xs text-muted mb-4">Create your first task to start assigning volunteers.</p>
          <Button onClick={() => setShowModal(true)}>+ Create Task</Button>
        </div>
      )}

      {/* Task sections */}
      {[
        { label: 'Open', items: open },
        { label: 'In Progress', items: in_progress },
        { label: 'Completed', items: completed },
      ].map(({ label, items }) =>
        items.length > 0 ? (
          <div key={label}>
            <h2 className="text-sm font-mono uppercase tracking-widest text-muted mb-3">{label}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  detailPath={`/ngo/tasks/${task._id}`}
                />
              ))}
            </div>
          </div>
        ) : null
      )}

      {/* Modal */}
      {showModal && (
        <CreateTaskModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
