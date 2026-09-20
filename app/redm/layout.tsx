import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getMember } from '@/lib/auth';
import AdminButton from '@/components/layout/AdminButton';
import RPProfileButton from '@/components/layout/RPProfileButton';
import ZoomPicker from '@/components/layout/ZoomPicker';
import ZoomWrapper from '@/components/layout/ZoomWrapper';
import Notifier from './_components/Notifier';
import AlerteSanitaire from './_components/AlerteSanitaire';
import { RedmSessionProvider } from './_components/RedmSessionProvider';
import { caisseRateForRoles } from '@/lib/caisse-rates';
import { canRead, isAdmin as checkIsAdmin } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export default async function RedMLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const member = await getMember(user.id);
  if (member?.status !== 'approved') redirect('/pending');

  const session = {
    discordId: (user.user_metadata?.provider_id ?? '') as string,
    username: (user.user_metadata?.full_name ?? user.user_metadata?.name ?? '') as string,
    avatarUrl: (user.user_metadata?.avatar_url ?? '') as string,
    roles: member.roles,
  };

  const roles: string[] = member.roles ?? [];
  const isPreparateurOnly  = roles.length === 1 && roles[0] === 'redm_preparateur_caisse';
  const hasCaisseAccess    = caisseRateForRoles(roles) !== null;
  const hasDirectionAccess = checkIsAdmin(roles) || canRead(roles, 'redm_direction');

  const navItems = isPreparateurOnly
    ? [{ href: '/redm/registre-caisses', label: 'Registre des Caisses', icon: '💰' }]
    : [
        { href: '/redm',                  label: 'Accueil',               icon: '⌂'  },
        ...(hasCaisseAccess ? [{ href: '/redm/registre-caisses', label: 'Registre des Caisses', icon: '💰' }] : []),
        { href: '/redm/comptabilite',     label: 'Comptabilité',          icon: '💰' },
        { href: '/redm/depot-stock',      label: 'Dépôt de Stock',        icon: '📥' },
        { href: '/redm/bibliotheque',     label: 'Bibliothèque',          icon: '📚' },
        { href: '/redm/agenda',           label: 'Agenda',                icon: '📅' },
        { href: '/redm/cabinet',          label: 'Cabinet Thérapeutique', icon: '🛋' },
        ...(hasDirectionAccess ? [{ href: '/redm/direction', label: 'Direction', icon: '🏛' }] : []),
      ];

  return (
    <RedmSessionProvider value={session}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');

        .redm-root {
          --r-bg:       #102B3B;
          --r-card:     #183746;
          --r-red:      #A8B991;
          --r-red-l:    #EADCB9;
          --r-red-d:    #D1B77C;
          --r-ink:      #EADCB9;
          --r-ink-d:    #C8BEA5;
          --r-ink-dd:   #C8BEA5;
          --r-sepia:    #C8BEA5;
          --r-border:   rgba(180,160,113,0.35);
          --r-border-s: rgba(180,160,113,0.60);
          --r-display:  'Central Station', 'Georgia', serif;
          --r-body:     'Cormorant Garamond', 'Georgia', serif;
          --r-mono:     'Libre Baskerville', 'Courier New', monospace;

          min-height: 100vh;
          background-color: #102B3B;
          color: var(--r-ink);
          font-family: var(--r-body);
          position: relative;
          overflow-x: hidden;
        }

        /* ══ FOND IMAGE GRAVURES MÉDICALES ══ */
        .redm-bg-image {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image: url('/login-background.png');
          background-size: cover;
          background-position: center center;
          background-repeat: no-repeat;
          filter: brightness(1) contrast(1);
          opacity: 0.30;
        }

        .redm-bg-overlay {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background: rgba(16,43,59,0.94);
        }

        .redm-bg-tint { display: none; }

        .redm-root > * { position: relative; z-index: 1; }

        .redm-root ::-webkit-scrollbar { width: 5px; }
        .redm-root ::-webkit-scrollbar-track { background: #050305; }
        .redm-root ::-webkit-scrollbar-thumb { background: rgba(180,160,113,0.50); border-radius: 2px; }

        .redm-header {
          position: sticky; top: 0; z-index: 50;
          background: rgba(24,55,70,0.97);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(180,160,113,0.35);
          box-shadow: 0 2px 30px rgba(64,51,24,0.12);
        }
        .redm-header::after {
          content: '';
          position: absolute; bottom: -2px; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, #A8B991 30%, #EADCB9 50%, #A8B991 70%, transparent);
          opacity: 0.55;
        }

        .redm-topbar {
          --r-ink: #203C49; --r-red-l: #254B50;
          color: #203C49; background: #F7EDD7;
          width: 100%; padding: 0 40px;
          display: flex; align-items: center; justify-content: space-between;
          height: 100px; box-sizing: border-box;
          border-bottom: 1px solid rgba(180,160,113,0.18);
        }

        .redm-navrow {
          width: 100%; padding: 0 40px;
          display: flex; align-items: center; gap: 2px;
          min-height: 72px; box-sizing: border-box;
          background: #102B3B;
        }

        .redm-logo-title {
          font-family: var(--r-display); font-size: 34px; font-weight: 700;
          color: var(--r-ink); line-height: 1; letter-spacing: 0.06em;
        }
        .redm-logo-sub {
          font-family: var(--r-mono); font-size: 16px;
          color: var(--r-red-l); letter-spacing: 0.18em; line-height: 1.5;
          text-transform: uppercase;
        }

        .redm-nav {
          display: flex; align-items: center; gap: 2px; flex: 1;
          overflow-x: auto; scrollbar-width: none;
          min-width: 0;
        }
        .redm-nav::-webkit-scrollbar { display: none; }
        .redm-nav a {
          font-family: var(--r-body); font-weight: 600; font-size: 15px;
          letter-spacing: 0.03em; text-transform: uppercase;
          color: #C8BEA5; text-decoration: none;
          padding: 7px 9px; border-radius: 6px;
          border: 1px solid transparent;
          transition: all 0.2s; white-space: nowrap;
          display: flex; align-items: center; gap: 5px;
          flex-shrink: 0;
        }
        .redm-nav a:hover {
          color: #EADCB9;
          border-color: rgba(180,160,113,0.40);
          background: rgba(180,160,113,0.12);
        }

        .redm-topbar-btn {
          font-family: var(--r-mono); font-size: 17px; letter-spacing: 0.10em;
          text-transform: uppercase; text-decoration: none;
          padding: 12px 22px; border-radius: 7px;
          border: 1px solid transparent; cursor: pointer;
          transition: all 0.2s; white-space: nowrap; display: flex; align-items: center; gap: 6px;
        }
        .redm-status-badge {
          font-family: var(--r-mono); font-size: 17px;
          padding: 12px 22px; border-radius: 7px;
          border: 1px solid rgba(180,160,113,0.50);
          background: rgba(180,160,113,0.10);
          color: var(--r-red-l);
          letter-spacing: 0.10em; text-transform: uppercase; white-space: nowrap;
        }
        .redm-quit-btn {
          color: #626747; border-color: rgba(142,122,74,0.18);
          background: transparent;
        }
        .redm-quit-btn:hover { border-color: rgba(180,160,113,0.45); color: var(--r-red-l); }

        .redm-main {
          width: 100%; padding: 40px 52px 80px; box-sizing: border-box; font-size: 16px;
        }
        .redm-fade {
          animation: redm-fadein 0.4s ease forwards;
        }
        @keyframes redm-fadein {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .redm-section {
          background: rgba(24,55,70,0.92);
          border: 1px solid var(--r-border);
          margin-bottom: 14px; overflow: hidden;
        }
        .redm-section-head {
          display: flex; align-items: center; gap: 8px;
          padding: 11px 22px;
          border-bottom: 1px solid var(--r-border);
          background: rgba(180,160,113,0.06);
        }
        .redm-section-title {
          font-family: var(--r-display); font-size: 16px;
          letter-spacing: 0.10em; text-transform: uppercase; color: var(--r-red-l);
        }
        .redm-section-body { padding: 18px 22px; display: flex; flex-direction: column; gap: 13px; }

        .redm-input {
          width: 100%;
          background: rgba(16,43,59,0.80);
          border: 1px solid rgba(180,160,113,0.25);
          padding: 10px 16px; color: var(--r-ink);
          font-family: var(--r-mono); font-size: 16px;
          transition: border-color 0.15s; outline: none;
        }
        .redm-input::placeholder { color: var(--r-sepia); }
        .redm-input:focus { border-color: rgba(180,160,113,0.60); }
        textarea.redm-input { resize: vertical; }

        .redm-label {
          display: block; font-family: var(--r-body); font-size: 15px;
          font-weight: 600; letter-spacing: 0.10em; text-transform: uppercase;
          color: var(--r-ink-dd); margin-bottom: 5px;
        }
        .redm-btn {
          background: #214452;
          color: var(--r-ink);
          font-family: var(--r-display); font-size: 16px; letter-spacing: 0.08em;
          border: 1px solid rgba(180,160,113,0.60);
          padding: 12px 28px; cursor: pointer; transition: all 0.2s;
          box-shadow: 0 0 14px rgba(180,160,113,0.18);
          text-transform: uppercase;
        }
        .redm-btn:hover {
          background: #214452;
          box-shadow: 0 0 22px rgba(180,160,113,0.38);
          transform: translateY(-1px);
        }
        .redm-btn:disabled { opacity: 0.4; transform: none; box-shadow: none; cursor: default; }

        .redm-btn-sec {
          background: transparent;
          border: 1px solid rgba(180,160,113,0.28);
          color: var(--r-ink-dd);
          font-family: var(--r-body); font-weight: 600;
          font-size: 15px; letter-spacing: 0.07em; text-transform: uppercase;
          padding: 8px 16px; cursor: pointer; transition: all 0.2s;
        }
        .redm-btn-sec:hover { border-color: var(--r-border-s); color: var(--r-red-l); background: rgba(180,160,113,0.08); }

        .redm-footer {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 200;
          border-top: 1px solid rgba(180,160,113,0.25);
          background: rgba(24,55,70,0.96);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          padding: 8px 40px;
          display: flex; justify-content: space-between; align-items: center;
        }
      `}</style>

      <div className="redm-root">
        <div className="redm-bg-image" />
        <div className="redm-bg-overlay" />
        <div className="redm-bg-tint" />

        {/* ════ HEADER ════ */}
        <header className="redm-header">

          {/* ── Ligne 1 : logo + actions ── */}
          <div className="redm-topbar">
            <Link href="/redm" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', flexShrink: 0 }}>
              <img src="/logo-redm.png" alt="Dispensaire de Little Creek" style={{ width: 62, height: 62, objectFit: 'contain', flexShrink: 0 }} />
              <div>
                <div className="redm-logo-title">LITTLE CREEK</div>
                <div className="redm-logo-sub">Dispensaire · 1890</div>
              </div>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <RPProfileButton universe="redm" accentColor="#5A9858" accentRgb="90,152,88" />
              <AdminButton />
              <span className="redm-status-badge">✦ Ouvert</span>
              <Link href="/login" className="redm-topbar-btn redm-quit-btn">⏻ Quitter</Link>
            </div>
          </div>

          {/* ── Ligne 2 : navigation ── */}
          <div className="redm-navrow">
            <ZoomWrapper as="nav" className="redm-nav">
              {navItems.map(n => (
                <Link key={n.href} href={n.href}>
                  <span>{n.icon}</span>{n.label}
                </Link>
              ))}
            </ZoomWrapper>
            <ZoomPicker accentRgb="209,183,124" activeColor="#EADCB9" mutedColor="#C8BEA5" font="'Libre Baskerville', monospace" />
          </div>

        </header>

        {/* ════ NOTIFIER ════ */}
        <Notifier />
        <AlerteSanitaire />

        {/* ════ CONTENU ════ */}
        <ZoomWrapper className="redm-main">
          <div className="redm-fade">{children}</div>
        </ZoomWrapper>

        {/* ════ FOOTER ════ */}
        <footer className="redm-footer">
          <span style={{ fontFamily: "'Libre Baskerville', monospace", fontSize: 14, color: '#C8BEA5', letterSpacing: '0.08em' }}>
            Dispensaire de Little Creek
          </span>
          <span style={{ fontFamily: "'Libre Baskerville', monospace", fontSize: 14, color: '#C8BEA5', letterSpacing: '0.12em' }}>
            AMAROGRAPH
          </span>
        </footer>
      </div>
    </RedmSessionProvider>
  );
}
