import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

// ── Navigation ───────────────────────────────────────────────────
const NAV = [
  { href: '/fivem',              label: 'Accueil',      icon: '⊞' },
  { href: '/fivem/reports',      label: 'Rapports',     icon: '📋' },
  { href: '/fivem/archives',     label: 'Archives',     icon: '🗃' },
  { href: '/fivem/bibliotheque', label: 'Bibliothèque', icon: '📚' },
  { href: '/fivem/symptomes',    label: 'Symptômes',    icon: '🔬' },
  { href: '/fivem/comptabilite', label: 'Comptabilité', icon: '💰' },
];

export default async function FiveMLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.NEXT_PUBLIC_ALLOWED_EMAIL) {
    redirect('/login');
  }

  return (
    <>
      {/* ════ STYLES SCOPÉS FIVEM UNIQUEMENT ════ */}
      <style>{`
        /* ── Fonts ── */
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&family=Exo+2:wght@300;400;500;600&display=swap');

        /* ── Variables FiveM ── */
        .fivem-root {
          --f-bg:          #0A0F1E;
          --f-card:        #0D1526;
          --f-card-hover:  #111E35;
          --f-accent:      #F97316;
          --f-accent-h:    #FB923C;
          --f-glow:        rgba(249,115,22,0.18);
          --f-border:      rgba(249,115,22,0.22);
          --f-border-s:    rgba(249,115,22,0.50);
          --f-text:        #E2E8F0;
          --f-muted:       #64748B;
          --f-dimmed:      #334155;
          --f-mono:        'Share Tech Mono', monospace;
          --f-display:     'Rajdhani', sans-serif;
          --f-body:        'Exo 2', sans-serif;
          min-height: 100vh;
          background: #0A0F1E;
          color: var(--f-text);
          font-family: var(--f-body);
          position: relative;
        }

        /* ── Fond hexagonal médical ── */
        .fivem-root::before {
          content: '';
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background-image:
            radial-gradient(ellipse 80% 50% at 50% -5%, rgba(249,115,22,0.08) 0%, transparent 55%),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='49'%3E%3Cpolygon points='28,2 52,15 52,41 28,54 4,41 4,15' fill='none' stroke='rgba(249,115,22,0.055)' stroke-width='0.7'/%3E%3C/svg%3E");
          background-size: 100% 100%, 56px 49px;
        }

        /* ── Contenu au-dessus du fond ── */
        .fivem-root > * { position: relative; z-index: 1; }

        /* ── Scrollbar ── */
        .fivem-root ::-webkit-scrollbar { width: 4px; }
        .fivem-root ::-webkit-scrollbar-track { background: transparent; }
        .fivem-root ::-webkit-scrollbar-thumb { background: rgba(249,115,22,0.3); border-radius: 2px; }

        /* ── HEADER ── */
        .fivem-header {
          position: sticky; top: 0; z-index: 50;
          background: rgba(10,15,30,0.90);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--f-border);
          box-shadow: 0 1px 24px rgba(249,115,22,0.05);
        }

        /* ── Ligne ECG animée ── */
        .fivem-ecg {
          height: 2px;
          background: linear-gradient(90deg,
            transparent 0%, transparent 20%,
            rgba(249,115,22,0.12) 22%, rgba(249,115,22,0.7) 27%,
            #F97316 29%, rgba(249,115,22,0.25) 31%,
            rgba(249,115,22,0.7) 33%, rgba(249,115,22,0.08) 36%,
            transparent 40%, transparent 100%
          );
          background-size: 300% 100%;
          animation: fivem-ecg 2.8s linear infinite;
        }
        @keyframes fivem-ecg {
          0%   { background-position: 130% 0; }
          100% { background-position: -130% 0; }
        }

        /* ── Nav inner ── */
        .fivem-nav-inner {
          max-width: 1100px; margin: 0 auto;
          padding: 0 24px;
          display: flex; align-items: center; gap: 20px;
          height: 56px;
        }

        /* ── Logo ── */
        .fivem-logo-box {
          width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0;
          background: linear-gradient(135deg, #F97316, #C2410C);
          display: flex; align-items: center; justify-content: center;
          font-size: 17px;
          box-shadow: 0 0 16px rgba(249,115,22,0.35);
        }
        .fivem-logo-title {
          font-family: var(--f-display); font-weight: 700; font-size: 14px;
          color: var(--f-text); line-height: 1; letter-spacing: 0.04em;
        }
        .fivem-logo-sub {
          font-family: var(--f-mono); font-size: 9px;
          color: var(--f-accent); letter-spacing: 0.14em; line-height: 1.2;
        }

        /* ── Nav links ── */
        .fivem-nav { display: flex; align-items: center; gap: 2px; flex: 1; }
        .fivem-nav a {
          font-family: var(--f-display); font-weight: 600; font-size: 12px;
          letter-spacing: 0.07em; text-transform: uppercase;
          color: var(--f-muted); text-decoration: none;
          padding: 5px 12px; border-radius: 7px;
          border: 1px solid transparent;
          transition: all 0.18s;
        }
        .fivem-nav a:hover {
          color: var(--f-accent);
          border-color: var(--f-border);
          background: rgba(249,115,22,0.06);
        }
        .fivem-nav a.active {
          color: var(--f-accent);
          border-color: var(--f-border);
          background: rgba(249,115,22,0.08);
        }

        /* ── Status dot ── */
        .fivem-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #4ADE80;
          animation: fivem-pulse 2s ease-in-out infinite;
        }
        @keyframes fivem-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(74,222,128,0.4); }
          50%       { opacity: 0.6; box-shadow: 0 0 0 4px rgba(74,222,128,0); }
        }
        .fivem-badge {
          font-family: var(--f-mono); font-size: 9px;
          padding: 3px 9px; border-radius: 4px;
          color: #4ADE80; border: 1px solid rgba(74,222,128,0.35);
          background: rgba(74,222,128,0.07); letter-spacing: 0.1em;
        }

        /* ── MAIN ── */
        .fivem-main {
          max-width: 920px; margin: 0 auto;
          padding: 36px 24px 80px;
        }

        /* ── Fade-in entrée ── */
        .fivem-fade {
          animation: fivem-fadein 0.35s ease forwards;
        }
        @keyframes fivem-fadein {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── CARDS modules ── */
        .fivem-card {
          background: var(--f-card);
          border: 1px solid var(--f-border);
          border-radius: 13px;
          transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
          position: relative; overflow: hidden;
          cursor: pointer;
        }
        .fivem-card::after {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 1.5px;
          background: linear-gradient(90deg, transparent, var(--f-accent), transparent);
          opacity: 0; transition: opacity 0.25s;
        }
        .fivem-card:hover {
          transform: translateY(-3px);
          border-color: var(--f-accent);
          box-shadow: 0 0 28px var(--f-glow), 0 6px 28px rgba(0,0,0,0.45);
        }
        .fivem-card:hover::after { opacity: 1; }

        /* ── SECTIONS formulaire ── */
        .fivem-section {
          background: rgba(13,21,38,0.75);
          border: 1px solid var(--f-border);
          border-radius: 13px;
          margin-bottom: 14px;
          overflow: hidden;
        }
        .fivem-section-head {
          display: flex; align-items: center; gap: 8px;
          padding: 11px 20px;
          border-bottom: 1px solid var(--f-border);
          background: rgba(249,115,22,0.04);
        }
        .fivem-section-title {
          font-family: var(--f-display); font-size: 10px; font-weight: 700;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--f-accent);
        }
        .fivem-section-body {
          padding: 18px 20px;
          display: flex; flex-direction: column; gap: 13px;
        }

        /* ── INPUTS ── */
        .fivem-input {
          width: 100%;
          background: rgba(0,0,0,0.32);
          border: 1px solid rgba(249,115,22,0.14);
          border-radius: 9px;
          padding: 9px 14px;
          color: var(--f-text);
          font-family: var(--f-body); font-size: 13px;
          transition: border-color 0.14s, box-shadow 0.14s;
          outline: none;
        }
        .fivem-input::placeholder { color: var(--f-dimmed); }
        .fivem-input:focus {
          border-color: rgba(249,115,22,0.48);
          box-shadow: 0 0 0 3px rgba(249,115,22,0.07);
        }
        textarea.fivem-input { resize: vertical; }

        /* ── LABEL ── */
        .fivem-label {
          display: block;
          font-family: var(--f-display); font-size: 10px; font-weight: 600;
          letter-spacing: 0.11em; text-transform: uppercase;
          color: var(--f-muted); margin-bottom: 5px;
        }

        /* ── CHIPS ── */
        .fivem-chip {
          font-size: 11px; padding: 5px 11px;
          border-radius: 999px; border: 1px solid rgba(255,255,255,0.09);
          color: #475569; background: transparent;
          cursor: pointer; transition: all 0.14s;
          font-family: var(--f-body); font-weight: 500;
        }
        .fivem-chip:hover { border-color: rgba(255,255,255,0.18); color: #94A3B8; }
        .fivem-chip.c-orange { border-color: #F97316; background: rgba(249,115,22,0.11); color: #FB923C; }
        .fivem-chip.c-red    { border-color: #EF4444; background: rgba(239,68,68,0.11); color: #F87171; }
        .fivem-chip.c-cyan   { border-color: #22D3EE; background: rgba(34,211,238,0.11); color: #67E8F9; }
        .fivem-chip.c-purple { border-color: #A855F7; background: rgba(168,85,247,0.11); color: #C084FC; }
        .fivem-chip.c-yellow { border-color: #EAB308; background: rgba(234,179,8,0.11); color: #FDE047; }
        .fivem-chip.c-green  { border-color: #22C55E; background: rgba(34,197,94,0.11); color: #4ADE80; }

        /* ── BTN PRINCIPAL ── */
        .fivem-btn {
          background: linear-gradient(135deg, #F97316 0%, #C2410C 100%);
          color: #fff; font-family: var(--f-display); font-weight: 700;
          font-size: 12px; letter-spacing: 0.11em; text-transform: uppercase;
          border: none; border-radius: 11px; padding: 13px 28px;
          cursor: pointer; transition: all 0.18s;
          box-shadow: 0 0 18px rgba(249,115,22,0.28), 0 3px 12px rgba(0,0,0,0.3);
        }
        .fivem-btn:hover {
          background: linear-gradient(135deg, #FB923C 0%, #F97316 100%);
          box-shadow: 0 0 28px rgba(249,115,22,0.45), 0 5px 18px rgba(0,0,0,0.4);
          transform: translateY(-1px);
        }
        .fivem-btn:disabled { opacity: 0.4; transform: none; box-shadow: none; cursor: default; }

        /* ── BTN SECONDAIRE ── */
        .fivem-btn-sec {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.10);
          color: var(--f-muted);
          font-family: var(--f-display); font-weight: 600;
          font-size: 11px; letter-spacing: 0.09em; text-transform: uppercase;
          border-radius: 9px; padding: 8px 16px;
          cursor: pointer; transition: all 0.18s;
        }
        .fivem-btn-sec:hover {
          border-color: var(--f-border-s);
          color: var(--f-accent);
          background: var(--f-glow);
        }

        /* ── CONSTANTE VITALE ── */
        .fivem-vital {
          border: 1px solid; border-radius: 9px; overflow: hidden;
          display: flex; align-items: center;
          font-family: var(--f-mono);
        }
        .fivem-vital input {
          flex: 1; background: transparent; border: none; outline: none;
          padding: 9px 14px; color: inherit;
          font-family: var(--f-mono); font-size: 14px;
        }
        .fivem-vital-unit { padding: 0 10px; font-size: 10px; opacity: 0.5; }
        .fivem-v-ok    { color: #4ADE80; border-color: rgba(74,222,128,0.38);   background: rgba(74,222,128,0.05); }
        .fivem-v-alert { color: #F87171; border-color: rgba(248,113,113,0.38);  background: rgba(248,113,113,0.05); }
        .fivem-v-empty { color: #475569; border-color: rgba(71,85,105,0.45);    background: rgba(0,0,0,0.28); }

        /* ── FOOTER ── */
        .fivem-footer {
          border-top: 1px solid var(--f-border);
          background: rgba(10,15,30,0.55);
          padding: 10px 24px;
          position: relative; z-index: 1;
        }
        .fivem-footer-inner {
          max-width: 1100px; margin: 0 auto;
          display: flex; justify-content: space-between; align-items: center;
        }

        /* ── Divider gradient ── */
        .fivem-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--f-border), transparent);
          margin: 2px 0;
        }
      `}</style>

      <div className="fivem-root">
        {/* ════ HEADER ════ */}
        <header className="fivem-header">
          <div className="fivem-ecg" />
          <div className="fivem-nav-inner">

            {/* Logo */}
            <Link href="/fivem" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
              <div className="fivem-logo-box">⚕</div>
              <div>
                <div className="fivem-logo-title">LA TANIÈRE</div>
                <div className="fivem-logo-sub">EMS · MDT · FIVEM</div>
              </div>
            </Link>

            {/* Nav */}
            <nav className="fivem-nav">
              {NAV.map(n => (
                <Link key={n.href} href={n.href}>
                  <span style={{ marginRight: 5 }}>{n.icon}</span>{n.label}
                </Link>
              ))}
            </nav>

            {/* Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="fivem-dot" />
                <span className="fivem-badge">ACTIF</span>
              </div>
              <Link href="/login" className="fivem-btn-sec" style={{ padding: '4px 12px', fontSize: 10 }}>
                ⏻ Quitter
              </Link>
            </div>

          </div>
        </header>

        {/* ════ CONTENU ════ */}
        <main className="fivem-main">
          <div className="fivem-fade">
            {children}
          </div>
        </main>

        {/* ════ FOOTER ════ */}
        <footer className="fivem-footer">
          <div className="fivem-footer-inner">
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#334155' }}>
              ⚕ LA TANIÈRE DE L'EMS — MDT v2.0 — FiveM
            </span>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#334155' }}>
              SAMS MEDICAL DISPATCH TERMINAL
            </span>
          </div>
        </footer>
      </div>
    </>
  );
}
