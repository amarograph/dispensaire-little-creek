'use client';

import { useState, useTransition } from 'react';
import { decideMember, updateMemberRoles } from '@/actions/members';
import { ROLES, ASSIGNABLE_ROLES, ROLE_LABELS, type Role } from '@/lib/permissions';

type Member = {
  user_id: string;
  discord_id: string;
  username: string;
  status: string;
  roles: string[];
  requested_at: string;
};

export default function MemberRow({ member }: { member: Member }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<Role[]>(
    (member.roles ?? []).filter((r): r is Role => (ROLES as readonly string[]).includes(r))
  );
  const [editingRoles, setEditingRoles] = useState(false);

  function toggleRole(role: Role) {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  }

  function handleDecide(status: 'approved' | 'rejected') {
    setError('');
    startTransition(async () => {
      try {
        await decideMember(member.user_id, status, selectedRoles);
        setEditingRoles(false);
      } catch {
        setError('Action impossible.');
      }
    });
  }

  function handleSaveRoles() {
    setError('');
    startTransition(async () => {
      try {
        await updateMemberRoles(member.user_id, selectedRoles);
        setEditingRoles(false);
      } catch {
        setError('Action impossible.');
      }
    });
  }

  const statusLabel = {
    pending: { text: 'En attente', className: 'bg-yellow-900/40 text-yellow-400' },
    approved: { text: 'Validé', className: 'bg-green-900/40 text-green-400' },
    rejected: { text: 'Refusé', className: 'bg-red-900/40 text-red-400' },
  }[member.status] ?? { text: member.status, className: 'bg-gray-800 text-gray-400' };

  const showRolePicker = member.status === 'pending' || editingRoles;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium text-white">{member.username}</div>
          <div className="text-xs text-gray-500 font-mono">{member.discord_id}</div>
          {member.status === 'approved' && member.roles.length > 0 && !editingRoles && (
            <div className="flex flex-wrap gap-1 mt-2">
              {member.roles.map(r => (
                <span key={r} className="text-xs bg-blue-900/40 text-blue-400 px-2 py-0.5 rounded-full">
                  {ROLE_LABELS[r as Role] ?? r}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {error && <span className="text-xs text-red-400">{error}</span>}
          <span className={`text-xs px-2 py-1 rounded-full ${statusLabel.className}`}>
            {statusLabel.text}
          </span>
          {member.status === 'approved' && !editingRoles && (
            <button
              onClick={() => setEditingRoles(true)}
              className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition"
            >
              Modifier les rôles
            </button>
          )}
          {member.status !== 'approved' && (
            <button
              onClick={() => handleDecide('approved')}
              disabled={isPending}
              className="text-xs bg-green-900/40 hover:bg-green-900/70 text-green-400 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
            >
              Valider
            </button>
          )}
          {member.status !== 'rejected' && (
            <button
              onClick={() => handleDecide('rejected')}
              disabled={isPending}
              className="text-xs bg-red-900/30 hover:bg-red-900/60 text-red-400 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
            >
              Refuser
            </button>
          )}
        </div>
      </div>

      {showRolePicker && (
        <div className="mt-3 pt-3 border-t border-gray-800">
          <div className="flex flex-wrap gap-2 mb-3">
            {ASSIGNABLE_ROLES.map(role => (
              <button
                key={role}
                type="button"
                onClick={() => toggleRole(role)}
                disabled={isPending}
                className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                  selectedRoles.includes(role)
                    ? 'bg-blue-900/50 border-blue-700 text-blue-300'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                {ROLE_LABELS[role]}
              </button>
            ))}
          </div>
          {editingRoles && (
            <div className="flex gap-2">
              <button
                onClick={handleSaveRoles}
                disabled={isPending}
                className="text-xs bg-blue-900/50 hover:bg-blue-900/80 text-blue-300 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
              >
                Enregistrer
              </button>
              <button
                onClick={() => {
                  setEditingRoles(false);
                  setSelectedRoles((member.roles ?? []).filter((r): r is Role => (ROLES as readonly string[]).includes(r)));
                }}
                className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition"
              >
                Annuler
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
