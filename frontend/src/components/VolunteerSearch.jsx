// ─── VolunteerSearch Component ────────────────────────────────────────────────
// Accepts real volunteer objects (aggregated from task assignedVolunteers).
// Props:
//   volunteers {Array}  - real volunteer objects from the backend
//   loading    {bool}
//   taskCount  {Map}    - Map<volunteerId, count> of tasks each vol is assigned to

import React, { useState, useMemo } from 'react';
import { getInitials } from '../utils/helpers';
import Input from './Input';

export default function VolunteerSearch({ volunteers = [], loading = false, taskCount = new Map() }) {
  const [query,       setQuery]       = useState('');
  const [filterSkill, setFilterSkill] = useState('All');

  // All unique skills from real data
  const allSkills = useMemo(() => {
    const s = new Set();
    volunteers.forEach((v) => (v.skills || []).forEach((sk) => s.add(sk)));
    return ['All', ...Array.from(s).sort()];
  }, [volunteers]);

  // Filter by query (name / location / skill) and skill pill
  const results = useMemo(() => {
    return volunteers.filter((v) => {
      const q = query.toLowerCase();
      const matchQuery =
        !q ||
        v.name?.toLowerCase().includes(q) ||
        v.location?.toLowerCase().includes(q) ||
        (v.skills || []).some((s) => s.toLowerCase().includes(q));
      const matchSkill =
        filterSkill === 'All' || (v.skills || []).includes(filterSkill);
      return matchQuery && matchSkill;
    });
  }, [volunteers, query, filterSkill]);

  // Loading skeletons
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-fog rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  // Empty state — no volunteers assigned at all
  if (volunteers.length === 0) {
    return (
      <div className="text-center py-10 text-muted">
        <div className="text-3xl mb-2">👤</div>
        <p className="text-sm">No volunteers assigned to your tasks yet.</p>
        <p className="text-xs mt-1">
          Go to a task and click <strong>Find Matches</strong> to assign volunteers.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Search + Filter row */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48">
          <Input
            placeholder="Search by name, location, or skill…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>

        {/* Skill filter pills */}
        <div className="flex gap-2 flex-wrap items-center">
          {allSkills.map((sk) => (
            <button
              key={sk}
              onClick={() => setFilterSkill(sk)}
              className={[
                'px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all',
                filterSkill === sk
                  ? 'bg-ink text-white'
                  : 'bg-fog text-slate hover:bg-silver/50',
              ].join(' ')}
            >
              {sk}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {results.length === 0 ? (
        <div className="text-center py-10 text-muted">
          <div className="text-3xl mb-2">🔍</div>
          <p className="text-sm">No volunteers found for "{query}"</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {results.map((v) => (
            <VolunteerCard key={v._id} volunteer={v} tasks={taskCount.get(v._id) || 0} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Individual volunteer card */
function VolunteerCard({ volunteer: v, tasks }) {
  const isAvailable = v.availability === true || v.availability === undefined;

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-fog bg-white shadow-card hover:shadow-card-hover transition-all duration-200">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-graphite text-white text-sm font-semibold flex items-center justify-center font-display shrink-0">
        {getInitials(v.name || 'V')}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-ink font-body">{v.name}</p>
          <span
            className={`badge ${isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
          >
            {isAvailable ? 'Available' : 'Busy'}
          </span>
        </div>
        {v.email && (
          <p className="text-xs text-muted mt-0.5 truncate">{v.email}</p>
        )}
        {v.location && (
          <p className="text-xs text-muted">📍 {v.location}</p>
        )}
        {(v.skills || []).length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {v.skills.map((s) => (
              <span key={s} className="badge bg-fog text-slate">{s}</span>
            ))}
          </div>
        )}
      </div>

      {/* Tasks count */}
      <div className="text-right shrink-0">
        <p className="text-lg font-display font-semibold text-ink">{tasks}</p>
        <p className="text-xs text-muted">task{tasks !== 1 ? 's' : ''}</p>
      </div>
    </div>
  );
}
