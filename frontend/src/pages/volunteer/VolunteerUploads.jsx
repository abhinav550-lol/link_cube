// ─── Volunteer Uploads Page ───────────────────────────────────────────────────
// Uses:
//   POST /api/files/upload         — single file
//   POST /api/files/upload-multiple — multiple files
//   GET  /api/files/my-uploads     — list this volunteer's uploads

import React, { useState, useEffect, useRef } from 'react';
import { filesApi } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import Button from '../../components/Button';
import IngestionStatusBadge from '../../components/files/IngestionStatusBadge';

export default function VolunteerUploads() {
  const [selectedVillage, setSelectedVillage] = useState('');
  const [note, setNote] = useState('');
  const [pickedFiles, setPickedFiles] = useState([]); // File objects
  const [previews, setPreviews] = useState([]);        // { name, preview|null }
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');
  const [submitErr, setSubmitErr] = useState('');
  const inputRef = useRef(null);

  // My uploads list
  const [myUploads, setMyUploads] = useState([]);
  const [uploadsLoading, setUploadsLoading] = useState(true);
  const [uploadsErr, setUploadsErr] = useState('');

  // Fetch volunteer's past uploads on mount
  useEffect(() => {
    setUploadsLoading(true);
    // GET /api/files/my-uploads
    filesApi
      .getMyUploads()
      .then((data) => setMyUploads(data?.data || []))
      .catch((err) => setUploadsErr(err.message))
      .finally(() => setUploadsLoading(false));
  }, []);

  // Build previews whenever pickedFiles changes
  useEffect(() => {
    const built = pickedFiles.map((f) => ({
      name: f.name,
      size: f.size,
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
    }));
    setPreviews(built);
    // Revoke old object URLs on cleanup
    return () => built.forEach((b) => b.preview && URL.revokeObjectURL(b.preview));
  }, [pickedFiles]);

  const addFiles = (incoming) => {
    const arr = Array.from(incoming);
    setPickedFiles((prev) => [...prev, ...arr]);
  };

  const removeFile = (idx) => setPickedFiles((prev) => prev.filter((_, i) => i !== idx));

  const formatSize = (b) => {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async () => {
    if (!selectedVillage || pickedFiles.length === 0) return;
    setSubmitting(true);
    setSubmitMsg('');
    setSubmitErr('');

    try {
      if (pickedFiles.length === 1) {
        // POST /api/files/upload
        await filesApi.uploadSingle(pickedFiles[0], selectedVillage);
      } else {
        // POST /api/files/upload-multiple
        await filesApi.uploadMultiple(pickedFiles, selectedVillage);
      }

      setSubmitMsg(`✅ ${pickedFiles.length} file${pickedFiles.length > 1 ? 's' : ''} uploaded successfully!`);
      setPickedFiles([]);
      setSelectedVillage('');
      setNote('');

      // Refresh my uploads list
      const data = await filesApi.getMyUploads();
      setMyUploads(data?.data || []);

    } catch (err) {
      setSubmitErr(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fileIcon = (mimetype = '') => {
    if (mimetype.startsWith('image/')) return '🖼️';
    if (mimetype.includes('pdf')) return '📄';
    return '📎';
  };

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-semibold text-ink">Upload Files</h1>
        <p className="text-sm text-muted mt-1">
          Attach photos, reports, and documents to a village.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ── Upload form ── */}
        <div className="bg-white rounded-xl border border-fog shadow-card p-6 space-y-5">
          <div>
            <h2 className="text-base font-display font-semibold text-ink">New Upload</h2>
            <p className="text-xs text-muted mt-0.5">Files are tagged to the selected village.</p>
          </div>

          {/* Location */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono uppercase tracking-wide text-slate">Village / Location</label>
            <input
              type="text"
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              placeholder="e.g. Mumbai, Delhi, Pune…"
              className="w-full rounded-lg border border-fog bg-white px-3.5 py-2.5 text-sm text-ink font-body focus:border-ink transition-all hover:border-silver"
            />
          </div>

          {/* Note (sent as FormData 'note' field if your backend supports it) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono uppercase tracking-wide text-slate">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Describe what these files show…"
              className="w-full rounded-lg border border-fog bg-white px-3.5 py-2.5 text-sm text-ink font-body placeholder:text-silver focus:ring-2 focus:ring-ink/10 focus:border-ink transition-all hover:border-silver resize-none"
            />
          </div>

          {/* Drop zone */}
          <div>
            <p className="text-xs font-mono uppercase tracking-wide text-slate mb-2">Files</p>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
              onClick={() => inputRef.current?.click()}
              className={[
                'border-2 border-dashed rounded-xl p-7 text-center cursor-pointer',
                'transition-all duration-200 select-none',
                dragOver ? 'border-ink bg-fog' : 'border-silver hover:border-slate hover:bg-snow',
              ].join(' ')}
            >
              <div className="text-3xl mb-2">📁</div>
              <p className="text-sm text-slate">
                <span className="font-medium text-ink">Click to browse</span> or drag files here
              </p>
              <p className="text-xs text-muted mt-1">Images, PDFs, Word, Excel — multiple files OK</p>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.xlsx,.csv"
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
            </div>

            {/* File preview list */}
            {previews.length > 0 && (
              <div className="mt-3 space-y-2">
                {previews.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2.5 bg-snow rounded-lg border border-fog animate-fade-in">
                    {p.preview ? (
                      <img src={p.preview} alt={p.name} className="w-9 h-9 object-cover rounded-md border border-fog shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-md bg-fog flex items-center justify-center text-base shrink-0">📎</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-ink truncate">{p.name}</p>
                      <p className="text-xs text-muted">{formatSize(p.size)}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                      className="text-muted hover:text-ink text-lg leading-none"
                    >×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {submitMsg && (
            <div className="p-3 rounded-lg bg-fog border border-silver/50 text-xs text-ink text-center animate-fade-in">
              {submitMsg}
            </div>
          )}

          {submitErr && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100">
              <p className="text-xs text-red-600">{submitErr}</p>
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleSubmit}
            loading={submitting}
            disabled={!selectedVillage || pickedFiles.length === 0}
          >
            {pickedFiles.length > 1 ? `Upload ${pickedFiles.length} Files` : 'Upload File'}
          </Button>
        </div>

        {/* ── My past uploads ── */}
        <div className="bg-white rounded-xl border border-fog shadow-card p-6">
          <div className="mb-4">
            <h2 className="text-base font-display font-semibold text-ink">My Uploads</h2>
            <p className="text-xs text-muted mt-0.5">Files you have submitted to the platform.</p>
          </div>

          {uploadsLoading && (
            <div className="py-8 text-center">
              <div className="inline-block w-5 h-5 border-2 border-ink border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-muted mt-2">Loading…</p>
            </div>
          )}

          {uploadsErr && !uploadsLoading && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100">
              <p className="text-xs text-red-600">{uploadsErr}</p>
            </div>
          )}

          {!uploadsLoading && !uploadsErr && myUploads.length === 0 && (
            <div className="text-center py-10 text-muted">
              <div className="text-3xl mb-2">📂</div>
              <p className="text-sm">No uploads yet.</p>
            </div>
          )}

          <div className="space-y-3">
            {myUploads.map((f) => (
              <div key={f._id} className="flex items-center gap-3 p-3.5 rounded-lg border border-fog hover:bg-snow transition-colors">
                <div className="w-9 h-9 rounded-lg bg-fog flex items-center justify-center text-lg shrink-0">
                  {fileIcon(f.mimeType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-ink truncate">{f.originalName}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {f.metadata?.location ?? 'No location'} · {formatDate(f.createdAt)}
                  </p>
                  <div className="mt-1">
                    <IngestionStatusBadge status={f.status} />
                  </div>
                </div>
                <a
                  href={`http://localhost:3000/${f.filePath}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-ink underline underline-offset-2 hover:text-slate shrink-0"
                >
                  View
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
