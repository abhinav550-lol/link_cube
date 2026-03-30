// ─── RAG Service ──────────────────────────────────────────────────────────────
// Stateless document Q&A — /api/rag/* routes.
// No conversation history. For context-aware Q&A use chatService.

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

export const ragService = {
  /**
   * POST /api/rag/ask
   * Ask a question across ALL (or specified) user files.
   * Body: { question, fileIds? }
   */
  ask: (question, fileIds = []) =>
    apiFetch('/rag/ask', {
      method: 'POST',
      body: JSON.stringify({ question, ...(fileIds.length ? { fileIds } : {}) }),
    }),

  /**
   * POST /api/rag/ask-file/:fileId
   * Ask a question scoped to a SINGLE file.
   * Body: { question }
   */
  askFile: (fileId, question) =>
    apiFetch(`/rag/ask-file/${fileId}`, {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),
};
