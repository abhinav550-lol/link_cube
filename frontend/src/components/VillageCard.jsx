// ─── VillageCard Component ────────────────────────────────────────────────────
// Displays a single village with needs, volunteers count, and urgency badge.

import React from 'react';
import { urgencyColor, NEED_ICONS, formatDate } from '../utils/helpers';

export default function VillageCard({ village }) {
  const { name, district, state, needs, volunteersAssigned, status, urgency, lastUpdated, description } = village;

  return (
    <div className="bg-white rounded-xl border border-fog shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-base font-semibold text-ink leading-tight">{name}</h3>
          <p className="text-xs text-muted mt-0.5 font-body">{district}, {state}</p>
        </div>
        <span className={`badge shrink-0 ${urgencyColor(urgency)}`}>{urgency}</span>
      </div>

      {/* Description */}
      <p className="text-xs text-slate leading-relaxed line-clamp-2">{description}</p>

      {/* Needs */}
      <div>
        <p className="text-xs font-mono uppercase tracking-wide text-muted mb-2">Needs</p>
        <div className="flex flex-wrap gap-1.5">
          {needs.map((need) => (
            <span
              key={need}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-snow border border-fog text-xs text-slate font-body"
            >
              <span>{NEED_ICONS[need] || '📌'}</span>
              {need}
            </span>
          ))}
        </div>
      </div>

      {/* Footer stats */}
      <div className="flex items-center justify-between pt-3 border-t border-fog">
        <div className="flex items-center gap-1.5 text-xs text-slate">
          <span className="text-base">👥</span>
          <span>
            <span className="font-semibold text-ink">{volunteersAssigned}</span> volunteer{volunteersAssigned !== 1 ? 's' : ''} assigned
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <span>Updated {formatDate(lastUpdated)}</span>
        </div>
      </div>

      {/* Status dot */}
      <div className="flex items-center gap-1.5 -mt-2">
        <span className={`w-1.5 h-1.5 rounded-full ${status === 'Active' ? 'bg-ink' : 'bg-silver'}`} />
        <span className="text-xs text-muted">{status}</span>
      </div>
    </div>
  );
}
