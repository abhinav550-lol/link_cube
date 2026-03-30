// ─── NGO Tasks Overview (formerly "Villages") ─────────────────────────────────
// Browse all NGO tasks with search + filter by priority, status.
// GET /api/tasks/my

import React, { useState, useEffect, useMemo } from 'react';
import { taskService } from '../../services/taskService';
import TaskCard from '../../components/tasks/TaskCard';
import Input from '../../components/Input';

const PRIORITY_FILTERS = ['All', 'critical', 'high', 'medium', 'low'];
const STATUS_FILTERS   = ['All', 'open', 'in_progress', 'completed'];

const PRIORITY_LABEL = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const STATUS_LABEL = {
  open: 'Open',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export default function NgoVillages() {
  const [tasks,    setTasks]   = useState([]);
  const [loading,  setLoading] = useState(true);
  const [error,    setError]   = useState('');

  const [search,   setSearch]   = useState('');
  const [priority, setPriority] = useState('All');
  const [status,   setStatus]   = useState('All');

  useEffect(() => {
    taskService
      .getMyTasks()
      .then((d) => setTasks(d?.data || []))
      .catch((err) => setError(err.message || 'Failed to load tasks.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.location?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q);
      const matchPriority = priority === 'All' || t.priority === priority;
      const matchStatus   = status === 'All'   || t.status   === status;
      return matchSearch && matchPriority && matchStatus;
    });
  }, [tasks, search, priority, status]);

  const clearFilters = () => {
    setSearch('');
    setPriority('All');
    setStatus('All');
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-semibold text-ink">
          Tasks Overview
        </h1>
        <p className="text-sm text-muted mt-1">
          {loading
            ? 'Loading…'
            : `${tasks.length} task${tasks.length !== 1 ? 's' : ''} total · ${filtered.length} shown`}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-100">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="w-64">
          <Input
            placeholder="Search title, location, category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>

        {/* Priority pills */}
        <div className="flex gap-2 flex-wrap">
          {PRIORITY_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setPriority(f)}
              className={[
                'px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all capitalize',
                priority === f ? 'bg-ink text-white' : 'bg-fog text-slate hover:bg-silver/50',
              ].join(' ')}
            >
              {PRIORITY_LABEL[f] || f}
            </button>
          ))}
        </div>

        {/* Status pills */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatus(f)}
              className={[
                'px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all',
                status === f ? 'bg-graphite text-white' : 'bg-snow border border-fog text-slate hover:bg-fog',
              ].join(' ')}
            >
              {STATUS_LABEL[f] || f}
            </button>
          ))}
        </div>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 bg-fog rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Task grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              detailPath={`/ngo/tasks/${task._id}`}
            />
          ))}
        </div>
      )}

      {/* Empty state — no tasks at all */}
      {!loading && !error && tasks.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-fog">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-sm font-medium text-ink mb-1">No tasks yet</p>
          <p className="text-xs text-muted">
            Create your first task from the <strong>My Tasks</strong> page to see it here.
          </p>
        </div>
      )}

      {/* Empty state — filters hiding results */}
      {!loading && !error && tasks.length > 0 && filtered.length === 0 && (
        <div className="text-center py-16 text-muted">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-sm">No tasks match your filters.</p>
          <button
            onClick={clearFilters}
            className="text-xs text-ink underline underline-offset-2 mt-2 hover:text-slate"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
