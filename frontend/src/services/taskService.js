// ─── Task Service ─────────────────────────────────────────────────────────────
// All task-related API calls — strictly following /api/tasks/* routes.

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include',
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || `Request failed (${res.status})`);
  return data;
}

export const taskService = {
  /**
   * POST /api/tasks
   * NGO creates a new task.
   * Body: { title, description, category, priority, location, requiredSkills, sourceFileId }
   */
  createTask: (payload) =>
    apiFetch('/tasks', { method: 'POST', body: JSON.stringify(payload) }),

  /**
   * GET /api/tasks/my
   * NGO fetches all tasks they created (with assigned volunteers populated).
   */
  getMyTasks: () => apiFetch('/tasks/my'),

  /**
   * GET /api/tasks/assigned/me
   * Volunteer fetches all tasks assigned to them.
   */
  getAssignedToMe: () => apiFetch('/tasks/assigned/me'),

  /**
   * GET /api/tasks/:taskId
   * Single task — any authenticated user.
   */
  getTaskById: (taskId) => apiFetch(`/tasks/${taskId}`),

  /**
   * GET /api/tasks/:taskId/matches
   * NGO — skill-matched available volunteers for a task.
   */
  getMatches: (taskId) => apiFetch(`/tasks/${taskId}/matches`),

  /**
   * PATCH /api/tasks/:taskId/assign/:volunteerId
   * NGO assigns a volunteer to a task.
   */
  assignVolunteer: (taskId, volunteerId) =>
    apiFetch(`/tasks/${taskId}/assign/${volunteerId}`, { method: 'PATCH' }),

  /**
   * PATCH /api/tasks/:taskId/remove/:volunteerId
   * NGO removes a volunteer from a task.
   */
  removeVolunteer: (taskId, volunteerId) =>
    apiFetch(`/tasks/${taskId}/remove/${volunteerId}`, { method: 'PATCH' }),

  /**
   * PATCH /api/tasks/:taskId/complete
   * NGO marks a task as completed.
   */
  completeTask: (taskId) =>
    apiFetch(`/tasks/${taskId}/complete`, { method: 'PATCH' }),
};
