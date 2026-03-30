// ─── API Service ──────────────────────────────────────────────────────────────
// Central place for all HTTP calls to the backend.
// Change BASE_URL to match your backend server.

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Core fetch wrapper — attaches credentials (cookies) and handles JSON errors.
 * @param {string} path    - e.g. '/user/login'
 * @param {object} options - standard fetch options
 */
async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include', // send session cookies
    ...options,
  });

  // For non-JSON responses (e.g. 204 No Content)
  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Throw an error with the backend's message if available
    throw new Error(data.message || data.error || `Request failed (${res.status})`);
  }

  return data;
}

/**
 * Multipart fetch wrapper — used for file uploads (no Content-Type header so
 * the browser sets it with the correct boundary automatically).
 */
async function apiUpload(path, formData, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || data.error || `Upload failed (${res.status})`);
  }

  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// USER ROUTES  (/api/user/*)
// ─────────────────────────────────────────────────────────────────────────────

export const userApi = {
  /**
   * POST /api/user/register
   * Body: { name, email, password, role }
   */
  register: (name, email, password, role) =>
    apiFetch('/user/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    }),

  /**
   * POST /api/user/login
   * Body: { email, password }
   */
  login: (email, password) =>
    apiFetch('/user/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  /**
   * POST /api/user/logout
   * Clears the session cookie on the server side.
   */
  logout: () =>
    apiFetch('/user/logout', { method: 'POST' }),

  /**
   * GET /api/user/me
   * Returns the currently authenticated user's profile.
   */
  me: () =>
    apiFetch('/user/me'),
};

// ─────────────────────────────────────────────────────────────────────────────
// FILE ROUTES  (/api/files/*)
// ─────────────────────────────────────────────────────────────────────────────

export const filesApi = {
  /**
   * POST /api/files/upload
   * Volunteer-only. Uploads a single file.
   * @param {File}   file     - the File object
   * @param {string} location - village/location name to tag the file with
   */
  uploadSingle: (file, location) => {
    const fd = new FormData();
    fd.append('file', file);
    if (location) fd.append('location', location);
    return apiUpload('/files/upload', fd);
  },

  /**
   * POST /api/files/upload-multiple
   * Volunteer-only. Uploads multiple files at once.
   * @param {File[]} files    - array of File objects
   * @param {string} location - village/location name
   */
  uploadMultiple: (files, location) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    if (location) fd.append('location', location);
    return apiUpload('/files/upload-multiple', fd);
  },

  /**
   * GET /api/files/location/:location
   * Returns all files tagged to a specific village/location.
   * @param {string} location - village name or ID
   */
  getByLocation: (location) =>
    apiFetch(`/files/location/${encodeURIComponent(location)}`),

  /**
   * GET /api/files/my-uploads
   * Volunteer-only. Returns files uploaded by the logged-in volunteer.
   */
  getMyUploads: () =>
    apiFetch('/files/my-uploads'),

  /**
   * GET /api/files/:id
   * Returns metadata for a single file by its ID.
   * @param {string} id - file ID
   */
  getById: (id) =>
    apiFetch(`/files/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// RAG ROUTES  (/api/rag/*)
// ─────────────────────────────────────────────────────────────────────────────

export const ragApi = {
  /**
   * POST /api/rag/ask
   * Ask a question across ALL of the user's uploaded files.
   * @param {string} question - natural language question
   */
  ask: (question) =>
    apiFetch('/rag/ask', {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),

  /**
   * POST /api/rag/ask-file/:fileId
   * Ask a question scoped to a SINGLE file.
   * @param {string} fileId   - the file's ID
   * @param {string} question - natural language question
   */
  askFile: (fileId, question) =>
    apiFetch(`/rag/ask-file/${fileId}`, {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),
};
