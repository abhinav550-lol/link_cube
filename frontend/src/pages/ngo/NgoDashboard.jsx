// ─── NGO Dashboard ────────────────────────────────────────────────────────────
// Overview: stats derived from real tasks, high-priority tasks, quick actions.
// GET /api/tasks/my

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { taskService } from '../../services/taskService';
import { StatCard } from '../../components/Card';
import TaskCard from '../../components/tasks/TaskCard';
import Button from '../../components/Button';

export default function NgoDashboard() {
  const { user } = useAuth();

  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    taskService
      .getMyTasks()
      .then((d) => setTasks(d?.data || []))
      .catch((err) => setError(err.message || 'Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  // ── Derived stats ────────────────────────────────────────────────────────────
  const openTasks       = tasks.filter((t) => t.status === 'open').length;
  const inProgress      = tasks.filter((t) => t.status === 'in_progress').length;
  const completed       = tasks.filter((t) => t.status === 'completed').length;

  // Unique volunteers across all tasks
  const allVolunteers = [
    ...new Set(
      tasks.flatMap((t) =>
        (t.assignedVolunteers || []).map((v) =>
          typeof v === 'object' ? v._id : v
        )
      )
    ),
  ];
  const totalVolunteers = allVolunteers.length;

  // Top 3 high / critical priority tasks
  const urgentTasks = tasks
    .filter((t) => t.priority === 'high' || t.priority === 'critical')
    .filter((t) => t.status !== 'completed' && t.status !== 'cancelled')
    .slice(0, 3);

  // ── Greeting helper ──────────────────────────────────────────────────────────
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8 animate-slide-up">
      {/* ── Greeting ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-semibold text-ink">
            {greeting}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-muted mt-1">
            {loading
              ? 'Loading your dashboard…'
              : `${tasks.length} task${tasks.length !== 1 ? 's' : ''} in your workspace.`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/ngo/villages">
            <Button variant="secondary" size="sm">Browse Tasks</Button>
          </Link>
          <Link to="/ngo/uploads">
            <Button size="sm">Upload Report</Button>
          </Link>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Open Tasks"
          value={loading ? '—' : openTasks}
          sub="Awaiting volunteers"
          icon="📋"
        />
        <StatCard
          label="In Progress"
          value={loading ? '—' : inProgress}
          sub="Currently active"
          icon="⏳"
        />
        <StatCard
          label="Completed"
          value={loading ? '—' : completed}
          sub="All time"
          icon="✅"
        />
        <StatCard
          label="Volunteers Assigned"
          value={loading ? '—' : totalVolunteers}
          sub="Unique volunteers"
          icon="👥"
        />
      </div>

      {/* ── High-priority tasks ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-display font-semibold text-ink">
              High-Priority Tasks
            </h2>
            <p className="text-xs text-muted mt-0.5">Requiring immediate attention</p>
          </div>
          <Link to="/ngo/tasks">
            <Button variant="ghost" size="sm">See all →</Button>
          </Link>
        </div>

        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-36 bg-fog rounded-xl animate-pulse"
              />
            ))}
          </div>
        )}

        {!loading && urgentTasks.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-fog">
            <p className="text-2xl mb-2">🎉</p>
            <p className="text-sm font-medium text-ink">No urgent tasks right now</p>
            <p className="text-xs text-muted mt-1">
              All high-priority items are complete or none created yet.
            </p>
          </div>
        )}

        {!loading && urgentTasks.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {urgentTasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                detailPath={`/ngo/tasks/${task._id}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Quick links ── */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          {
            to: '/ngo/volunteers',
            icon: '🔍',
            title: 'Search Volunteers',
            desc: 'Find and assign skilled volunteers to your tasks.',
          },
          {
            to: '/ngo/uploads',
            icon: '📁',
            title: 'Upload Reports',
            desc: 'Share progress images and field reports.',
          },
          {
            to: '/ngo/villages',
            icon: '🗺️',
            title: 'Browse Tasks',
            desc: 'View all tasks filtered by location and category.',
          },
        ].map((item) => (
          <Link key={item.to} to={item.to}>
            <div className="bg-white rounded-xl border border-fog shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 p-5 h-full">
              <div className="text-2xl mb-3">{item.icon}</div>
              <h3 className="text-sm font-semibold text-ink font-body">{item.title}</h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
