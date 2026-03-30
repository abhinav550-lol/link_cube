// ─── TaskDetailPage ───────────────────────────────────────────────────────────
// Full task view for NGO: info, assigned volunteers, match volunteers,
// assign/remove actions, mark complete.
// Also used by volunteers (read-only — no action buttons shown).

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { taskService } from '../../services/taskService';
import VolunteerMatchCard from '../../components/tasks/VolunteerMatchCard';
import Button from '../../components/Button';
import { getInitials } from '../../utils/helpers';

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};
const STATUS_COLORS = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

export default function TaskDetailPage() {
  const { taskId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isNgo = user?.role === 'ngo';

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Volunteer matching state
  const [matches, setMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState('');
  const [showMatches, setShowMatches] = useState(false);

  // Per-volunteer action loading
  const [actionLoading, setActionLoading] = useState({});
  const [actionError, setActionError] = useState('');

  // Complete task state
  const [completing, setCompleting] = useState(false);

  const fetchTask = useCallback(() => {
    setLoading(true);
    setError('');
    taskService
      .getTaskById(taskId)
      .then((d) => setTask(d?.data))
      .catch((err) => setError(err.message || 'Failed to load task.'))
      .finally(() => setLoading(false));
  }, [taskId]);

  useEffect(() => { fetchTask(); }, [fetchTask]);

  // ── Fetch volunteer matches ────────────────────────────────────────────────
  const handleFindMatches = async () => {
    setShowMatches(true);
    setMatchesLoading(true);
    setMatchesError('');
    try {
      const res = await taskService.getMatches(taskId);
      setMatches(res?.data || []);
    } catch (err) {
      setMatchesError(err.message || 'Failed to fetch matches.');
    } finally {
      setMatchesLoading(false);
    }
  };

  // ── Assign volunteer ───────────────────────────────────────────────────────
  const handleAssign = async (volunteerId) => {
    setActionLoading((prev) => ({ ...prev, [volunteerId]: true }));
    setActionError('');
    try {
      await taskService.assignVolunteer(taskId, volunteerId);
      fetchTask();           // refetch task to update assigned list
      handleFindMatches();   // refresh match list
    } catch (err) {
      setActionError(err.message || 'Failed to assign volunteer.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [volunteerId]: false }));
    }
  };

  // ── Remove volunteer ───────────────────────────────────────────────────────
  const handleRemove = async (volunteerId) => {
    setActionLoading((prev) => ({ ...prev, [volunteerId]: true }));
    setActionError('');
    try {
      await taskService.removeVolunteer(taskId, volunteerId);
      fetchTask();
      if (showMatches) handleFindMatches();
    } catch (err) {
      setActionError(err.message || 'Failed to remove volunteer.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [volunteerId]: false }));
    }
  };

  // ── Mark complete ──────────────────────────────────────────────────────────
  const handleComplete = async () => {
    if (!window.confirm('Mark this task as completed? This will free all assigned volunteers.')) return;
    setCompleting(true);
    try {
      await taskService.completeTask(taskId);
      fetchTask();
    } catch (err) {
      setActionError(err.message || 'Failed to complete task.');
    } finally {
      setCompleting(false);
    }
  };

  // ── UI states ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted text-sm">
        Loading task…
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="p-6 rounded-xl bg-red-50 border border-red-100 max-w-lg">
        <p className="text-sm text-red-600">{error || 'Task not found.'}</p>
        <button className="mt-3 text-xs text-muted hover:text-ink" onClick={() => navigate(-1)}>
          ← Go back
        </button>
      </div>
    );
  }

  const assignedIds = (task.assignedVolunteers || []).map((v) =>
    typeof v === 'object' ? v._id : v
  );

  return (
    <div className="space-y-6 animate-slide-up max-w-3xl">
      {/* ── Back ── */}
      <button
        onClick={() => navigate(-1)}
        className="text-xs text-muted hover:text-ink transition-colors flex items-center gap-1"
      >
        ← Back
      </button>

      {/* ── Task Header ── */}
      <div className="bg-white rounded-xl border border-fog shadow-card p-6">
        <div className="flex items-start gap-3 flex-wrap mb-4">
          <h1 className="text-xl font-display font-semibold text-ink flex-1 leading-snug">
            {task.title}
          </h1>
          <div className="flex gap-2 shrink-0">
            <span className={`badge ${PRIORITY_COLORS[task.priority] || 'bg-gray-100 text-gray-600'}`}>
              {task.priority}
            </span>
            <span className={`badge ${STATUS_COLORS[task.status] || 'bg-gray-100 text-gray-500'}`}>
              {task.status?.replace('_', ' ')}
            </span>
          </div>
        </div>

        <p className="text-sm text-slate leading-relaxed mb-4">{task.description}</p>

        {/* Meta grid */}
        <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-fog">
          {task.category && (
            <div>
              <p className="text-xs font-mono uppercase tracking-wide text-muted mb-0.5">Category</p>
              <p className="text-sm text-ink">{task.category}</p>
            </div>
          )}
          {task.location && (
            <div>
              <p className="text-xs font-mono uppercase tracking-wide text-muted mb-0.5">Location</p>
              <p className="text-sm text-ink">📍 {task.location}</p>
            </div>
          )}
          {task.ngoId && (
            <div>
              <p className="text-xs font-mono uppercase tracking-wide text-muted mb-0.5">Posted by</p>
              <p className="text-sm text-ink">
                {typeof task.ngoId === 'object' ? task.ngoId.name : 'NGO'}
              </p>
            </div>
          )}
        </div>

        {/* Skills */}
        {task.requiredSkills?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-fog">
            <p className="text-xs font-mono uppercase tracking-wide text-muted mb-2">Required Skills</p>
            <div className="flex gap-2 flex-wrap">
              {task.requiredSkills.map((s) => (
                <span key={s} className="badge bg-fog text-slate">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Complete button — NGO only, task not completed */}
        {isNgo && task.status !== 'completed' && task.status !== 'cancelled' && (
          <div className="mt-5 pt-4 border-t border-fog">
            <Button
              variant="secondary"
              size="sm"
              loading={completing}
              onClick={handleComplete}
              className="text-green-700 border-green-200 hover:bg-green-50"
            >
              ✓ Mark Task as Completed
            </Button>
          </div>
        )}
      </div>

      {/* ── Assigned Volunteers ── */}
      <div className="bg-white rounded-xl border border-fog shadow-card p-6">
        <h2 className="text-base font-display font-semibold text-ink mb-4">
          Assigned Volunteers ({assignedIds.length})
        </h2>

        {assignedIds.length === 0 ? (
          <p className="text-sm text-muted">No volunteers assigned yet.</p>
        ) : (
          <div className="space-y-2">
            {(task.assignedVolunteers || []).map((vol) => {
              const v = typeof vol === 'object' ? vol : { _id: vol, name: vol };
              return (
                <div
                  key={v._id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-fog bg-snow"
                >
                  <div className="w-8 h-8 rounded-full bg-graphite text-white text-xs font-semibold flex items-center justify-center font-display shrink-0">
                    {getInitials(v.name || 'V')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{v.name}</p>
                    {v.email && <p className="text-xs text-muted truncate">{v.email}</p>}
                    {v.skills?.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {v.skills.map((s) => (
                          <span key={s} className="badge bg-fog text-slate text-[10px]">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {isNgo && task.status !== 'completed' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={!!actionLoading[v._id]}
                      onClick={() => handleRemove(v._id)}
                      className="text-red-600 border-red-200 hover:bg-red-50 shrink-0"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Volunteer Matching (NGO only) ── */}
      {isNgo && task.status !== 'completed' && task.status !== 'cancelled' && (
        <div className="bg-white rounded-xl border border-fog shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-display font-semibold text-ink">Find Matching Volunteers</h2>
            <Button size="sm" onClick={handleFindMatches} loading={matchesLoading}>
              {showMatches ? '↻ Refresh' : 'Find Matches'}
            </Button>
          </div>

          {actionError && (
            <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-100">
              <p className="text-xs text-red-600">{actionError}</p>
            </div>
          )}

          {!showMatches && (
            <p className="text-sm text-muted">
              Click "Find Matches" to discover available volunteers with matching skills.
            </p>
          )}

          {showMatches && matchesError && (
            <p className="text-sm text-red-500">{matchesError}</p>
          )}

          {showMatches && !matchesLoading && matches.length === 0 && !matchesError && (
            <p className="text-sm text-muted">No available volunteers match this task's skills.</p>
          )}

          {showMatches && matches.length > 0 && (
            <div className="space-y-2">
              {matches.map((vol) => (
                <VolunteerMatchCard
                  key={vol._id}
                  volunteer={vol}
                  isAssigned={assignedIds.includes(vol._id)}
                  onAssign={handleAssign}
                  onRemove={handleRemove}
                  loading={!!actionLoading[vol._id]}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
