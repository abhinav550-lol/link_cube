// ─── Utility Helpers ─────────────────────────────────────────────────────────

/** Format a date string to readable format */
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/** Get initials from a full name */
export const getInitials = (name = '') => {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/** Map urgency level to badge color classes */
export const urgencyColor = (urgency) => {
  const map = {
    High: 'bg-ink text-white',
    Medium: 'bg-graphite text-white',
    Low: 'bg-fog text-slate',
  };
  return map[urgency] || 'bg-fog text-slate';
};

/** Map status to color classes */
export const statusColor = (status) => {
  const map = {
    Active: 'bg-fog text-graphite',
    Pending: 'bg-silver/40 text-slate',
    Completed: 'bg-ink/10 text-ink',
    Available: 'bg-fog text-graphite',
    'In Progress': 'bg-graphite text-white',
  };
  return map[status] || 'bg-fog text-slate';
};

/** Map task priority to dot color */
export const priorityDot = (priority) => {
  const map = { High: 'bg-ink', Medium: 'bg-slate', Low: 'bg-silver' };
  return map[priority] || 'bg-silver';
};

/** Needs display labels */
export const NEED_ICONS = {
  Food: '🌾',
  Medicine: '💊',
  Clothing: '👕',
  Education: '📚',
  Sanitation: '🚿',
  Construction: '🏗️',
};
