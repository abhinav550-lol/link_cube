// ─── NGO Volunteers Page ──────────────────────────────────────────────────────
// Aggregates assigned volunteers from the NGO's tasks.
// Stats + search driven purely by live API data.
// GET /api/tasks/my  → flatten assignedVolunteers

import React, { useState, useEffect, useMemo } from 'react';
import { taskService } from '../../services/taskService';
import VolunteerSearch from '../../components/VolunteerSearch';
import RagAsk from '../../components/RagAsk';
import { StatCard } from '../../components/Card';

export default function NgoVolunteers() {
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    taskService
      .getMyTasks()
      .then((d) => setTasks(d?.data || []))
      .catch((err) => setError(err.message || 'Failed to load volunteer data.'))
      .finally(() => setLoading(false));
  }, []);

  // ── Aggregate unique volunteers from all tasks ──────────────────────────────
  const { volunteers, taskCount } = useMemo(() => {
    const volMap  = new Map(); // _id → volunteer object
    const cntMap  = new Map(); // _id → number of tasks

    tasks.forEach((t) => {
      (t.assignedVolunteers || []).forEach((v) => {
        if (typeof v !== 'object' || !v._id) return;
        if (!volMap.has(v._id)) volMap.set(v._id, v);
        cntMap.set(v._id, (cntMap.get(v._id) || 0) + 1);
      });
    });

    return {
      volunteers: Array.from(volMap.values()),
      taskCount: cntMap,
    };
  }, [tasks]);

  // ── Derived stats ───────────────────────────────────────────────────────────
  const total     = volunteers.length;
  const busy      = volunteers.filter((v) => v.availability === false).length;
  const available = volunteers.filter((v) => v.availability !== false).length;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-semibold text-ink">Volunteers</h1>
        <p className="text-sm text-muted mt-1">
          Volunteers assigned across your tasks. Use AI to query uploaded field reports.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Total Assigned"
          value={loading ? '—' : total}
          icon="👥"
          sub="Unique volunteers"
        />
        <StatCard
          label="Busy"
          value={loading ? '—' : busy}
          icon="🔴"
          sub="Currently unavailable"
        />
        <StatCard
          label="Available"
          value={loading ? '—' : available}
          icon="🟢"
          sub="Ready to assign"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Volunteer search — takes 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-fog shadow-card p-6">
          <div className="mb-5">
            <h2 className="text-base font-display font-semibold text-ink">
              Assigned Volunteers
            </h2>
            <p className="text-xs text-muted mt-0.5">
              All volunteers from your active and completed tasks.
            </p>
          </div>
          <VolunteerSearch
            volunteers={volunteers}
            loading={loading}
            taskCount={taskCount}
          />
        </div>

        {/* RAG Q&A panel — 1 col */}
        <div className="bg-white rounded-xl border border-fog shadow-card p-6">
          <div className="mb-5">
            <h2 className="text-base font-display font-semibold text-ink">
              AI Document Q&A
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Ask questions across all uploaded village reports and documents.
            </p>
          </div>
          {/* No fileId = queries POST /api/rag/ask (all files) */}
          <RagAsk />
        </div>
      </div>
    </div>
  );
}
