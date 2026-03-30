// ─── Volunteer Dashboard ──────────────────────────────────────────────────────
// Fetches real assigned tasks from GET /api/tasks/assigned/me
// Stats + recent task list, all driven by live API data.

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { taskService } from '../../services/taskService';
import { StatCard } from '../../components/Card';
import TaskCard from '../../components/tasks/TaskCard';
import Button from '../../components/Button';

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    taskService.getAssignedToMe()
      .then((d) => setTasks(d?.data || []))
      .catch((err) => setError(err.message || 'Failed to load tasks.'))
      .finally(() => setLoading(false));
  }, []);

  const openTasks      = tasks.filter((t) => t.status === 'open');
  const inProgress     = tasks.filter((t) => t.status === 'in_progress');
  const completed      = tasks.filter((t) => t.status === 'completed');
  const recentTasks    = [...tasks].slice(0, 4);

  return (
    <div className="space-y-8 animate-slide-up">

      {/* ── Greeting ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-ink">
            Hello, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-muted mt-1">
            {loading
              ? 'Loading your assignments…'
              : `${inProgress.length + openTasks.length} active task${(inProgress.length + openTasks.length) !== 1 ? 's' : ''} assigned to you.`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/volunteer/uploads">
            <Button size="sm">Upload Files</Button>
          </Link>
          <Link to="/chat">
            <Button size="sm" variant="secondary">Ask AI</Button>
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
        <StatCard label="Total Assigned"  value={loading ? '—' : tasks.length}       sub="All time"            icon="📋" />
        <StatCard label="Open"            value={loading ? '—' : openTasks.length}    sub="Awaiting start"     icon="📬" />
        <StatCard label="In Progress"     value={loading ? '—' : inProgress.length}   sub="Currently working"  icon="⏳" />
        <StatCard label="Completed"       value={loading ? '—' : completed.length}    sub="All time"           icon="✅" />
      </div>

      {/* ── Profile card ── */}
      <div className="bg-white rounded-xl border border-fog shadow-card p-6">
        <h2 className="text-base font-display font-semibold text-ink mb-4">Your Profile</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          {[
            { label: 'Name',         value: user?.name },
            { label: 'Email',        value: user?.email },
            { label: 'Location',     value: user?.location || 'Not set' },
            { label: 'Availability', value: user?.availability ? '✅ Available' : '🔴 Unavailable' },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs font-mono uppercase tracking-wide text-muted">{item.label}</p>
              <p className="text-sm font-medium text-ink mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
        {user?.skills?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-fog">
            <p className="text-xs font-mono uppercase tracking-wide text-muted mb-2">Skills</p>
            <div className="flex gap-2 flex-wrap">
              {user.skills.map((s) => (
                <span key={s} className="badge bg-fog text-slate">{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Recent Tasks ── */}
      {!loading && tasks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold text-ink">Recent Tasks</h2>
            <Link to="/volunteer/tasks">
              <Button variant="ghost" size="sm">View all →</Button>
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentTasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                detailPath={`/volunteer/tasks/${task._id}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && tasks.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-fog">
          <p className="text-3xl mb-3">📬</p>
          <p className="text-sm font-medium text-ink mb-1">No tasks assigned yet</p>
          <p className="text-xs text-muted mb-4">
            NGOs will assign tasks to you once you match their requirements.
          </p>
          <Link to="/quick-ask">
            <Button variant="secondary" size="sm">Try Quick Ask</Button>
          </Link>
        </div>
      )}

      {/* ── Quick links ── */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { to: '/volunteer/uploads', icon: '📁', title: 'Upload Files',   desc: 'Share field reports and documents.' },
          { to: '/chat',              icon: '💬', title: 'Chat with Docs', desc: 'Ask questions about your uploaded files.' },
          { to: '/quick-ask',         icon: '⚡', title: 'Quick Ask',      desc: 'Get instant AI answers from your documents.' },
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
