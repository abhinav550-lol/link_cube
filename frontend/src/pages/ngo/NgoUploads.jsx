// ─── NGO Uploads Page ─────────────────────────────────────────────────────────
// GET /api/files/location/:location — browse volunteer uploads by village
// GET /api/files/:id                — view a specific file
// RAG /api/rag/ask-file/:fileId     — AI Q&A on a specific file

import React, { useState, useEffect } from 'react';
import { filesApi } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import RagAsk from '../../components/RagAsk';
import IngestionStatusBadge from '../../components/files/IngestionStatusBadge';

export default function NgoUploads() {
  const [selectedVillage, setSelectedVillage] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // File selected for RAG Q&A
  const [ragFile, setRagFile] = useState(null); // { id, name }

  useEffect(() => {
    if (!selectedVillage) { setFiles([]); setRagFile(null); return; }
    setLoading(true);
    setError('');
    setRagFile(null);

    // GET /api/files/location/:location
    filesApi
      .getByLocation(selectedVillage)
      .then((data) => setFiles(data?.data || []))
      .catch((err) => { setError(err.message); setFiles([]); })
      .finally(() => setLoading(false));
  }, [selectedVillage]);

  const fileIcon = (mimetype = '') => {
    if (mimetype.startsWith('image/')) return '🖼️';
    if (mimetype.includes('pdf')) return '📄';
    return '📎';
  };

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-semibold text-ink">Village Files</h1>
        <p className="text-sm text-muted mt-1">
          Browse volunteer-uploaded reports and photos. Click a file to run AI Q&A on it.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* File browser */}
        <div className="bg-white rounded-xl border border-fog shadow-card p-6 space-y-5">
          <div>
            <h2 className="text-base font-display font-semibold text-ink">Browse by Village</h2>
            <p className="text-xs text-muted mt-0.5">Select a village to see uploaded files.</p>
          </div>

          {/* Location text input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono uppercase tracking-wide text-slate">Village / Location</label>
            <input
              type="text"
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              placeholder="e.g. Delhi, Mumbai, Pune…"
              className="w-full rounded-lg border border-fog bg-white px-3.5 py-2.5 text-sm text-ink font-body focus:border-ink transition-all hover:border-silver"
            />
          </div>

          {/* Results */}
          {loading && (
            <div className="py-8 text-center">
              <div className="inline-block w-5 h-5 border-2 border-ink border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-muted mt-2">Loading files…</p>
            </div>
          )}

          {error && !loading && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {!loading && !error && selectedVillage && files.length === 0 && (
            <div className="text-center py-10 text-muted">
              <div className="text-3xl mb-2">📂</div>
              <p className="text-sm">No files uploaded for this village yet.</p>
            </div>
          )}

          {!loading && files.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted font-mono">{files.length} file{files.length !== 1 ? 's' : ''}</p>
              {files.map((f) => {
                const fId = f._id ?? f.id;
                const isSelected = ragFile?.id === fId;
                return (
                  <div
                    key={fId}
                    onClick={() => setRagFile(isSelected ? null : { id: fId, name: f.originalName ?? 'File' })}
                    className={[
                      'flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-all',
                      isSelected
                        ? 'border-ink bg-fog'
                        : 'border-fog hover:bg-snow',
                    ].join(' ')}
                  >
                    <div className="w-9 h-9 rounded-lg bg-fog flex items-center justify-center text-lg shrink-0">
                      {fileIcon(f.mimeType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-ink truncate">
                        {f.originalName ?? 'Unnamed file'}
                      </p>
                      <p className="text-xs text-muted mt-0.5">
                        {f.uploadedBy?.name ?? 'Volunteer'} · {formatDate(f.createdAt)}
                      </p>
                      <div className="mt-1"><IngestionStatusBadge status={f.status} /></div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {(f.url ?? f.path) && (
                        <a
                          href={f.url ?? f.path}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-ink underline underline-offset-2 hover:text-slate"
                        >
                          View
                        </a>
                      )}
                      <span className={`text-xs font-mono ${isSelected ? 'text-ink' : 'text-muted'}`}>
                        {isSelected ? 'Selected ✓' : 'Ask AI'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RAG panel */}
        <div className="bg-white rounded-xl border border-fog shadow-card p-6 space-y-5">
          <div>
            <h2 className="text-base font-display font-semibold text-ink">AI Document Q&A</h2>
            <p className="text-xs text-muted mt-0.5">
              {ragFile
                ? `Asking about: ${ragFile.name}`
                : 'Select a file on the left to query it, or ask across all files.'}
            </p>
          </div>

          {/* RagAsk with optional fileId — uses /ask-file/:id or /ask */}
          <RagAsk
            fileId={ragFile?.id ?? null}
            fileName={ragFile?.name ?? null}
          />
        </div>
      </div>
    </div>
  );
}
