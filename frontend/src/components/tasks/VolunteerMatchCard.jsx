// ─── VolunteerMatchCard ───────────────────────────────────────────────────────
// Shows a matched volunteer for a task — assign / already-assigned state.

import React from 'react';
import Button from '../Button';
import { getInitials } from '../../utils/helpers';

export default function VolunteerMatchCard({ volunteer, isAssigned, onAssign, onRemove, loading }) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-lg border border-fog bg-white hover:bg-snow transition-colors">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-graphite text-white text-xs font-semibold flex items-center justify-center font-display shrink-0">
        {getInitials(volunteer.name || 'V')}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-ink truncate">{volunteer.name}</p>
          {volunteer.skillMatch && (
            <span className="badge bg-green-100 text-green-700 text-[10px]">Skill Match</span>
          )}
          {!volunteer.availability && (
            <span className="badge bg-orange-100 text-orange-600 text-[10px]">Unavailable</span>
          )}
        </div>
        <p className="text-xs text-muted truncate">{volunteer.email}</p>
        {volunteer.skills?.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-1">
            {volunteer.skills.map((s) => (
              <span key={s} className="badge bg-fog text-slate text-[10px]">{s}</span>
            ))}
          </div>
        )}
        {volunteer.location && (
          <p className="text-xs text-muted mt-0.5">📍 {volunteer.location}</p>
        )}
      </div>

      {/* Action */}
      {isAssigned ? (
        <Button
          variant="secondary"
          size="sm"
          loading={loading}
          onClick={() => onRemove(volunteer._id)}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          Remove
        </Button>
      ) : (
        <Button
          size="sm"
          loading={loading}
          onClick={() => onAssign(volunteer._id)}
          disabled={!volunteer.availability}
        >
          Assign
        </Button>
      )}
    </div>
  );
}
