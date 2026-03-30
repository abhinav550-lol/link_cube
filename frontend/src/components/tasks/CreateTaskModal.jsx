// ─── CreateTaskModal ──────────────────────────────────────────────────────────
// Modal form for NGO to create a new task (POST /api/tasks).

import React, { useState } from 'react';
import { taskService } from '../../services/taskService';
import Button from '../Button';
import Input from '../Input';

const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const CATEGORIES = ['Medical', 'Education', 'Food', 'Shelter', 'Sanitation', 'Other'];

export default function CreateTaskModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    location: '',
    requiredSkills: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setError('Title and description are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const skills = form.requiredSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await taskService.createTask({
        title: form.title,
        description: form.description,
        category: form.category || undefined,
        priority: form.priority,
        location: form.location || undefined,
        requiredSkills: skills.length ? skills : undefined,
      });
      onCreated(res.data);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create task.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-fog">
          <div>
            <h2 className="text-lg font-display font-semibold text-ink">Create New Task</h2>
            <p className="text-xs text-muted mt-0.5">Fill in the details to post a task for volunteers.</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink transition-colors text-xl">×</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Task Title *"
            placeholder="e.g. Medical camp at shelter"
            value={form.title}
            onChange={set('title')}
          />

          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-slate mb-1.5">
              Description *
            </label>
            <textarea
              className="w-full rounded-lg border border-fog px-3 py-2.5 text-sm text-ink placeholder:text-muted resize-none focus:border-ink transition-colors"
              rows={3}
              placeholder="Describe what volunteers need to do…"
              value={form.description}
              onChange={set('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Category */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-slate mb-1.5">Category</label>
              <select
                className="w-full rounded-lg border border-fog px-3 py-2.5 text-sm text-ink bg-white focus:border-ink transition-colors"
                value={form.category}
                onChange={set('category')}
              >
                <option value="">Select…</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-slate mb-1.5">Priority</label>
              <select
                className="w-full rounded-lg border border-fog px-3 py-2.5 text-sm text-ink bg-white focus:border-ink transition-colors"
                value={form.priority}
                onChange={set('priority')}
              >
                {PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <Input
            label="Location"
            placeholder="e.g. Mumbai, Delhi"
            value={form.location}
            onChange={set('location')}
          />

          <Input
            label="Required Skills (comma-separated)"
            placeholder="e.g. first-aid, teaching, medical"
            value={form.requiredSkills}
            onChange={set('requiredSkills')}
          />

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} className="flex-1">
              Create Task
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
