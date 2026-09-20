'use client';

import { useState, useTransition } from 'react';
import { decideMember, updateMemberRoles } from '@/actions/members';
import { ROLES, ASSIGNABLE_ROLES, ROLE_LABELS, type Role } from '@/lib/permissions';

const DISPLAY = "'Central Station', 'Georgia', serif";
const MONO    = "'Libre Baskerville', 'Courier New', monospace";
const T = { card: '#183746', border: 'rgba(139,90,43,0.30)', gold: '#D1B77C', text: '#EADCB9', muted: '#C8BEA5', dim: '#C8BEA5' };

type Member = {
  user_id: string;
  discord_id: string;
  username: string;
  status: string;
  roles: string[];
  requested_at: string;
};

const btn: React.CSSProperties = { fontFamily: MONO, fontSize: 14, letterSpacing: '0.06em', padding: '7px 14px', cursor: 'pointer', background: 'transparent', color: T.muted, border: `1px solid ${T.border}` };
const btnGreen: React.CSSProperties = { ...btn, color: '#A8B991', border: '1px solid rgba(90,152,88,0.45)', background: 'rgba(90,152,88,0.12)' };
const btnRed: React.CSSProperties = { ...btn, color: '#DF9A88', border: '1px solid rgba(139,64,64,0.45)', background: 'rgba(139,64,64,0.10)' };
const btnGold: React.CSSProperties = { ...btn, color: T.gold, border: '1px solid rgba(209,183,124,0.4)', background: 'rgba(209,183,124,0.08)' };

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

  const statusInfo = {
    pending:  { text: 'EN ATTENTE', col: '#D1B77C' },
    approved: { text: 'VALIDÉ',     col: '#A8B991' },
    rejected: { text: 'REFUSÉ',     col: '#DF9A88' },
  }[member.status] ?? { text: member.status.toUpperCase(), col: T.dim };

  const showRolePicker = member.status === 'pending' || editingRoles;
  const initiale = (member.username?.[0] ?? '?').toUpperCase();

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: `3px solid ${statusInfo.col}`, padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ width: 40, height: 40, background: statusInfo.col + '20', border: `1px solid ${statusInfo.col}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontFamily: DISPLAY, fontSize: 19, color: statusInfo.col }}>{initiale}</span>
        </div>

        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 19, color: T.text }}>{member.username}</div>
          <div style={{ fontFamily: MONO, fontSize: 13, color: T.dim, marginTop: 2 }}>{member.discord_id}</div>
          {member.status === 'approved' && member.roles.length > 0 && !editingRoles && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {member.roles.map(r => (
                <span key={r} style={{ fontFamily: MONO, fontSize: 13, color: '#BAAAC6', background: 'rgba(155,106,200,0.10)', padding: '1px 8px', border: '1px solid rgba(155,106,200,0.25)' }}>
                  {ROLE_LABELS[r as Role] ?? r}
                </span>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {error && <span style={{ fontFamily: MONO, fontSize: 13, color: '#DF9A88' }}>{error}</span>}
          <span style={{ fontFamily: MONO, fontSize: 13, letterSpacing: '0.08em', color: statusInfo.col, background: statusInfo.col + '18', padding: '4px 10px', border: `1px solid ${statusInfo.col}40` }}>
            {statusInfo.text}
          </span>
          {member.status === 'approved' && !editingRoles && (
            <button onClick={() => setEditingRoles(true)} style={btnGold}>✎ Rôles</button>
          )}
          {member.status !== 'approved' && (
            <button onClick={() => handleDecide('approved')} disabled={isPending} style={{ ...btnGreen, opacity: isPending ? 0.5 : 1 }}>Valider</button>
          )}
          {member.status !== 'rejected' && (
            <button onClick={() => handleDecide('rejected')} disabled={isPending} style={{ ...btnRed, opacity: isPending ? 0.5 : 1 }}>Refuser</button>
          )}
        </div>
      </div>

      {showRolePicker && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
          <div style={{ fontFamily: MONO, fontSize: 13, color: T.dim, letterSpacing: '0.1em', marginBottom: 10 }}>RÔLES À ATTRIBUER</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {ASSIGNABLE_ROLES.map(role => {
              const on = selectedRoles.includes(role);
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  disabled={isPending}
                  style={{
                    fontFamily: MONO, fontSize: 13, letterSpacing: '0.04em', padding: '7px 12px', cursor: 'pointer',
                    background: on ? 'rgba(209,183,124,0.18)' : 'transparent',
                    color: on ? T.gold : T.dim,
                    border: `1px solid ${on ? 'rgba(209,183,124,0.5)' : T.border}`,
                  }}
                >
                  {ROLE_LABELS[role]}
                </button>
              );
            })}
          </div>
          {editingRoles && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSaveRoles} disabled={isPending} style={{ ...btnGold, opacity: isPending ? 0.5 : 1 }}>✔ Enregistrer</button>
              <button
                onClick={() => {
                  setEditingRoles(false);
                  setSelectedRoles((member.roles ?? []).filter((r): r is Role => (ROLES as readonly string[]).includes(r)));
                }}
                style={btn}
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
