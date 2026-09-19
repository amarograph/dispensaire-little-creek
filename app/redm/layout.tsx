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
import DirectionNav from './_components/DirectionNav';
import { RedmSessionProvider } from './_components/RedmSessionProvider';

export const dynamic = 'force-dynamic';

const NAV = [
  { href: '/redm',                  label: 'Accueil',               icon: '⌂'  },
  { href: '/redm/contexte',         label: 'Contexte',              icon: '🕰' },
  { href: '/redm/essentiel',        label: "L'Essentiel du Médecin",icon: '🩺' },
  { href: '/redm/registre-malades', label: 'Registre Patient',      icon: '📋' },
  { href: '/redm/certificats',      label: 'Certificats',           icon: '📜' },
  { href: '/redm/comptabilite',     label: 'Caisse et Comptabilité',icon: '💰' },
  { href: '/redm/bibliotheque',     label: 'Bibliothèque',          icon: '📚' },
  { href: '/redm/archives',         label: 'Archives',              icon: '🗄' },
  { href: '/redm/agenda',           label: 'Agenda',                icon: '📅' },
  { href: '/redm/cabinet',          label: 'Cabinet Thérapeutique', icon: '🛋' },
];

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

  return (
    <RedmSessionProvider value={session}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rye&family=Josefin+Slab:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=Special+Elite&display=swap');

        .redm-root {
          --r-bg:       #080508;
          --r-card:     #0E080A;
          --r-red:      #7A1515;
          --r-red-l:    #A82020;
          --r-red-d:    #4A0A0A;
          --r-ink:      #C8B8A0;
          --r-ink-d:    #9A8870;
          --r-ink-dd:   #5A4A38;
          --r-sepia:    #2E2018;
          --r-border:   rgba(120,20,20,0.35);
          --r-border-s: rgba(120,20,20,0.60);
          --r-display:  'Rye', 'Georgia', serif;
          --r-body:     'Josefin Slab', 'Georgia', serif;
          --r-mono:     'Special Elite', 'Courier New', monospace;

          min-height: 100vh;
          background-color: #080508;
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
          filter: brightness(0.30) contrast(1.2) sepia(40%);
          opacity: 0.85;
        }

        .redm-bg-overlay {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background: rgba(4, 1, 2, 0.50);
        }

        .redm-bg-tint { display: none; }

        .redm-root > * { position: relative; z-index: 1; }

        .redm-root ::-webkit-scrollbar { width: 5px; }
        .redm-root ::-webkit-scrollbar-track { background: #050305; }
        .redm-root ::-webkit-scrollbar-thumb { background: rgba(120,20,20,0.50); border-radius: 2px; }

        .redm-header {
          position: sticky; top: 0; z-index: 50;
          background: rgba(5, 2, 4, 0.97);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(120,20,20,0.35);
          box-shadow: 0 2px 30px rgba(0,0,0,0.90);
        }
        .redm-header::after {
          content: '';
          position: absolute; bottom: -2px; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, #7A1515 30%, #A82020 50%, #7A1515 70%, transparent);
          opacity: 0.55;
        }

        .redm-topbar {
          width: 100%; padding: 0 40px;
          display: flex; align-items: center; justify-content: space-between;
          height: 100px; box-sizing: border-box;
          border-bottom: 1px solid rgba(120,20,20,0.18);
        }

        .redm-navrow {
          width: 100%; padding: 0 40px;
          display: flex; align-items: center; gap: 2px;
          height: 72px; box-sizing: border-box;
          background: rgba(0,0,0,0.35);
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
          font-family: var(--r-body); font-weight: 600; font-size: 13px;
          letter-spacing: 0.03em; text-transform: uppercase;
          color: #A89070; text-decoration: none;
          padding: 7px 9px; border-radius: 6px;
          border: 1px solid transparent;
          transition: all 0.2s; white-space: nowrap;
          display: flex; align-items: center; gap: 5px;
          flex-shrink: 0;
        }
        .redm-nav a:hover {
          color: #E8D0A0;
          border-color: rgba(120,20,20,0.40);
          background: rgba(120,20,20,0.12);
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
          border: 1px solid rgba(120,20,20,0.50);
          background: rgba(120,20,20,0.10);
          color: var(--r-red-l);
          letter-spacing: 0.10em; text-transform: uppercase; white-space: nowrap;
        }
        .redm-quit-btn {
          color: #6B4040; border-color: rgba(255,255,255,0.07);
          background: transparent;
        }
        .redm-quit-btn:hover { border-color: rgba(120,20,20,0.45); color: var(--r-red-l); }

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
          background: rgba(10,5,7,0.92);
          border: 1px solid var(--r-border);
          margin-bottom: 14px; overflow: hidden;
        }
        .redm-section-head {
          display: flex; align-items: center; gap: 8px;
          padding: 11px 22px;
          border-bottom: 1px solid var(--r-border);
          background: rgba(120,20,20,0.06);
        }
        .redm-section-title {
          font-family: var(--r-display); font-size: 16px;
          letter-spacing: 0.10em; text-transform: uppercase; color: var(--r-red-l);
        }
        .redm-section-body { padding: 18px 22px; display: flex; flex-direction: column; gap: 13px; }

        .redm-input {
          width: 100%;
          background: rgba(0,0,0,0.55);
          border: 1px solid rgba(120,20,20,0.25);
          padding: 10px 16px; color: var(--r-ink);
          font-family: var(--r-mono); font-size: 16px;
          transition: border-color 0.15s; outline: none;
        }
        .redm-input::placeholder { color: var(--r-sepia); }
        .redm-input:focus { border-color: rgba(120,20,20,0.60); }
        textarea.redm-input { resize: vertical; }

        .redm-label {
          display: block; font-family: var(--r-body); font-size: 15px;
          font-weight: 600; letter-spacing: 0.10em; text-transform: uppercase;
          color: var(--r-ink-dd); margin-bottom: 5px;
        }
        .redm-btn {
          background: #1A0808;
          color: var(--r-ink);
          font-family: var(--r-display); font-size: 16px; letter-spacing: 0.08em;
          border: 1px solid rgba(120,20,20,0.60);
          padding: 12px 28px; cursor: pointer; transition: all 0.2s;
          box-shadow: 0 0 14px rgba(120,20,20,0.18);
          text-transform: uppercase;
        }
        .redm-btn:hover {
          background: #2A0C0C;
          box-shadow: 0 0 22px rgba(120,20,20,0.38);
          transform: translateY(-1px);
        }
        .redm-btn:disabled { opacity: 0.4; transform: none; box-shadow: none; cursor: default; }

        .redm-btn-sec {
          background: transparent;
          border: 1px solid rgba(120,20,20,0.28);
          color: var(--r-ink-dd);
          font-family: var(--r-body); font-weight: 600;
          font-size: 15px; letter-spacing: 0.07em; text-transform: uppercase;
          padding: 8px 16px; cursor: pointer; transition: all 0.2s;
        }
        .redm-btn-sec:hover { border-color: var(--r-border-s); color: var(--r-red-l); background: rgba(120,20,20,0.08); }

        .redm-footer {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 200;
          border-top: 1px solid rgba(120,20,20,0.25);
          background: rgba(3,1,2,0.96);
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
                <div className="redm-logo-sub">Dispensaire · RedM · 1892</div>
              </div>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <RPProfileButton universe="redm" accentColor="#C8A040" accentRgb="200,160,64" />
              <AdminButton />
              <span className="redm-status-badge">✦ Ouvert</span>
              <Link href="/login" className="redm-topbar-btn redm-quit-btn">⏻ Quitter</Link>
            </div>
          </div>

          {/* ── Ligne 2 : navigation ── */}
          <div className="redm-navrow">
            <nav className="redm-nav">
              {NAV.map(n => (
                <Link key={n.href} href={n.href}>
                  <span>{n.icon}</span>{n.label}
                </Link>
              ))}
              <DirectionNav />
            </nav>
            <ZoomPicker accentRgb="120,20,20" activeColor="#C8B8A0" mutedColor="rgba(90,60,40,0.7)" font="'Special Elite', monospace" />
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
          <span style={{ fontFamily: "'Special Elite', monospace", fontSize: 11, color: '#3A2818', letterSpacing: '0.08em' }}>
            Dispensaire de Little Creek
          </span>
          <span style={{ fontFamily: "'Special Elite', monospace", fontSize: 11, color: '#3A2818', letterSpacing: '0.12em' }}>
            AMAROGRAPH REDM
          </span>
        </footer>
      </div>
    </RedmSessionProvider>
  );
}
