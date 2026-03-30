// ─── RagAsk Component ─────────────────────────────────────────────────────────
// Uses:
//   POST /api/rag/ask               — question across all user files
//   POST /api/rag/ask-file/:fileId  — question scoped to one file

import React, { useState } from 'react';
import { ragApi } from '../services/api';
import Button from './Button';

/**
 * RagAsk — AI Q&A widget over uploaded documents.
 *
 * @param {string|null} fileId   - if provided, scopes the question to that file
 * @param {string}      fileName - display name for the scoped file (optional)
 */
export default function RagAsk({ fileId = null, fileName = null }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setError('');
    setAnswer('');

    try {
      let data;
      if (fileId) {
        // POST /api/rag/ask-file/:fileId
        data = await ragApi.askFile(fileId, question);
      } else {
        // POST /api/rag/ask
        data = await ragApi.ask(question);
      }
      // Backend may return { answer: "..." } or { response: "..." }
      setAnswer(data.answer ?? data.response ?? JSON.stringify(data));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="space-y-4">
      {/* Context label */}
      <div className="flex items-center gap-2">
        <span className="text-lg">🤖</span>
        <div>
          <p className="text-sm font-semibold text-ink">
            {fileId ? `Ask about: ${fileName ?? 'Selected File'}` : 'Ask Across All Files'}
          </p>
          <p className="text-xs text-muted">
            {fileId
              ? 'AI will answer questions using only this document.'
              : 'AI will search across all uploaded village documents.'}
          </p>
        </div>
      </div>

      {/* Input + button */}
      <div className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            fileId
              ? 'e.g. What issues were reported in this file?'
              : 'e.g. Which villages need medicine urgently?'
          }
          className="flex-1 rounded-lg border border-fog bg-white px-3.5 py-2.5 text-sm text-ink font-body placeholder:text-silver focus:ring-2 focus:ring-ink/10 focus:border-ink transition-all hover:border-silver"
        />
        <Button onClick={handleAsk} loading={loading} disabled={!question.trim()}>
          Ask
        </Button>
      </div>

      {/* Answer */}
      {answer && (
        <div className="p-4 rounded-xl bg-fog border border-silver/50 animate-fade-in">
          <p className="text-xs font-mono uppercase tracking-wide text-muted mb-2">Answer</p>
          <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{answer}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-100">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
