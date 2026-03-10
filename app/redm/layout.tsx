import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

const NAV = [
  { href: '/redm',              label: 'Accueil',      icon: '⌂' },
  { href: '/redm/certificats',  label: 'Certificats',  icon: '📜' },
  { href: '/redm/archives',     label: 'Archives',     icon: '🗄' },
  { href: '/redm/bibliotheque', label: 'Bibliothèque', icon: '📚' },
  { href: '/redm/contexte',     label: 'Contexte',     icon: '🕰' },
  { href: '/redm/comptabilite', label: 'Comptabilité', icon: '💰' },
];

export default async function RedMLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.NEXT_PUBLIC_ALLOWED_EMAIL) {
    redirect('/login');
  }

  return (
    <>
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
          background-image: url('/redm-bg.png');
          background-size: cover;
          background-position: center center;
          background-repeat: no-repeat;
          /* Sépia rouge sombre — assez visible pour transparaître */
          filter: sepia(80%) brightness(0.45) contrast(1.1) hue-rotate(300deg) saturate(0.6);
          opacity: 0.55;
        }

        /* Voile noir léger */
        .redm-bg-overlay {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background: rgba(4, 1, 2, 0.52);
        }

        /* Tint supprimé */
        .redm-bg-tint { display: none; }

        .redm-root > * { position: relative; z-index: 1; }

        /* ══ SCROLLBAR ══ */
        .redm-root ::-webkit-scrollbar { width: 5px; }
        .redm-root ::-webkit-scrollbar-track { background: #050305; }
        .redm-root ::-webkit-scrollbar-thumb { background: rgba(120,20,20,0.50); border-radius: 2px; }

        /* ═══════════════
           HEADER
        ═══════════════ */
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

        .redm-nav-inner {
          width: 100%; padding: 0 40px;
          display: flex; align-items: center; gap: 14px;
          height: 64px; box-sizing: border-box;
        }

        .redm-logo-box {
          width: 40px; height: 40px; flex-shrink: 0;
          background: #1A0808;
          border: 1px solid rgba(120,20,20,0.60);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          box-shadow: 0 0 16px rgba(120,20,20,0.40);
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
        }
        .redm-logo-title {
          font-family: var(--r-display); font-size: 13px;
          color: var(--r-ink); line-height: 1; letter-spacing: 0.04em;
        }
        .redm-logo-sub {
          font-family: var(--r-mono); font-size: 11px;
          color: var(--r-red-l); letter-spacing: 0.14em; line-height: 1.4;
          text-transform: uppercase;
        }

        .redm-nav { display: flex; align-items: center; gap: 2px; flex: 1; }
        .redm-nav a {
          font-family: var(--r-body); font-weight: 600; font-size: 13px;
          letter-spacing: 0.07em; text-transform: uppercase;
          color: var(--r-ink-dd); text-decoration: none;
          padding: 6px 12px;
          border: 1px solid transparent;
          transition: all 0.2s; white-space: nowrap;
        }
        .redm-nav a:hover {
          color: var(--r-ink);
          border-color: rgba(120,20,20,0.40);
          background: rgba(120,20,20,0.10);
        }

        .redm-status-badge {
          font-family: var(--r-mono); font-size: 11px;
          padding: 4px 12px;
          border: 1px solid rgba(120,20,20,0.50);
          background: rgba(120,20,20,0.10);
          color: var(--r-red-l);
          letter-spacing: 0.10em; text-transform: uppercase; white-space: nowrap;
        }
        .redm-fivem-btn {
          display: flex; align-items: center; gap: 6px;
          font-family: var(--r-mono); font-size: 11px; letter-spacing: 0.10em;
          padding: 5px 14px;
          border: 1px solid rgba(249,115,22,0.40);
          background: rgba(249,115,22,0.06);
          color: #FB923C; text-decoration: none;
          transition: all 0.2s; white-space: nowrap; text-transform: uppercase;
        }
        .redm-fivem-btn:hover {
          background: rgba(249,115,22,0.14);
          border-color: rgba(249,115,22,0.70);
        }
        .redm-quit-btn {
          font-family: var(--r-mono); font-size: 11px;
          letter-spacing: 0.10em; text-transform: uppercase;
          padding: 5px 14px;
          border: 1px solid rgba(255,255,255,0.07);
          background: transparent; color: var(--r-ink-dd);
          text-decoration: none; transition: all 0.2s; white-space: nowrap;
        }
        .redm-quit-btn:hover { border-color: rgba(120,20,20,0.45); color: var(--r-red-l); }

        /* ═══════════════
           MAIN
        ═══════════════ */
        .redm-main {
          width: 100%; padding: 32px 40px 80px; box-sizing: border-box;
        }
        .redm-fade {
          animation: redm-fadein 0.4s ease forwards;
        }
        @keyframes redm-fadein {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ═══════════════
           COMPOSANTS
        ═══════════════ */
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
          font-family: var(--r-display); font-size: 12px;
          letter-spacing: 0.10em; text-transform: uppercase; color: var(--r-red-l);
        }
        .redm-section-body { padding: 18px 22px; display: flex; flex-direction: column; gap: 13px; }

        .redm-input {
          width: 100%;
          background: rgba(0,0,0,0.55);
          border: 1px solid rgba(120,20,20,0.25);
          padding: 10px 16px; color: var(--r-ink);
          font-family: var(--r-mono); font-size: 14px;
          transition: border-color 0.15s; outline: none;
        }
        .redm-input::placeholder { color: var(--r-sepia); }
        .redm-input:focus { border-color: rgba(120,20,20,0.60); }
        textarea.redm-input { resize: vertical; }

        .redm-label {
          display: block; font-family: var(--r-body); font-size: 12px;
          font-weight: 600; letter-spacing: 0.10em; text-transform: uppercase;
          color: var(--r-ink-dd); margin-bottom: 5px;
        }
        .redm-btn {
          background: #1A0808;
          color: var(--r-ink);
          font-family: var(--r-display); font-size: 13px; letter-spacing: 0.08em;
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
          font-size: 12px; letter-spacing: 0.07em; text-transform: uppercase;
          padding: 8px 16px; cursor: pointer; transition: all 0.2s;
        }
        .redm-btn-sec:hover { border-color: var(--r-border-s); color: var(--r-red-l); background: rgba(120,20,20,0.08); }

        /* ═══════════════
           FOOTER
        ═══════════════ */
        .redm-footer {
          border-top: 1px solid rgba(120,20,20,0.25);
          background: rgba(3,1,2,0.85);
          padding: 12px 40px; position: relative; z-index: 1;
        }
        .redm-footer-inner {
          width: 100%; display: flex; justify-content: space-between; align-items: center;
        }
      `}</style>

      <div className="redm-root">
        <div className="redm-bg-image" />
        <div className="redm-bg-overlay" />
        <div className="redm-bg-tint" />

        {/* ════ HEADER ════ */}
        <header className="redm-header">
          <div className="redm-nav-inner">
            <Link href="/redm" style={{ display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none', flexShrink: 0 }}>
              <div className="redm-logo-box">✚</div>
              <div>
                <div className="redm-logo-title">LA TANIÈRE</div>
                <div className="redm-logo-sub">Dispensaire · RedM · 1890</div>
              </div>
            </Link>

            <nav className="redm-nav">
              {NAV.map(n => (
                <Link key={n.href} href={n.href}>
                  <span style={{ marginRight: 5 }}>{n.icon}</span>{n.label}
                </Link>
              ))}
            </nav>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span className="redm-status-badge">✦ Ouvert</span>
              <Link href="/fivem" className="redm-fivem-btn">◈ FiveM</Link>
              <Link href="/login" className="redm-quit-btn">⏻ Quitter</Link>
            </div>
          </div>
        </header>

        {/* ════ CONTENU ════ */}
        <main className="redm-main">
          <div className="redm-fade">{children}</div>
        </main>

        {/* ════ FOOTER ════ */}
        <footer className="redm-footer">
          <div className="redm-footer-inner">
            <span style={{ fontFamily: "'Special Elite', monospace", fontSize: 12, color: '#3A2018' }}>
              ✚ La Tanière de l'EMS — Dispensaire RedM
            </span>
            <span style={{ fontFamily: "'Special Elite', monospace", fontSize: 12, color: '#3A2018', letterSpacing: '0.10em' }}>
              DISPENSAIRE MEDICAL · 1890
            </span>
          </div>
        </footer>
      </div>
    </>
  );
}
