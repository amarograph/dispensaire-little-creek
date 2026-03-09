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
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=IM+Fell+English:ital@0;1&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');

        .redm-root {
          --r-bg:       #1A1008;
          --r-card:     #241509;
          --r-gold:     #C8932A;
          --r-gold-l:   #E8B84B;
          --r-gold-d:   #8B6318;
          --r-rust:     #8B3A1A;
          --r-ink:      #E8DCC8;
          --r-ink-d:    #B8A888;
          --r-ink-dd:   #7A6850;
          --r-sepia:    #4A3520;
          --r-border:   rgba(200,147,42,0.30);
          --r-border-s: rgba(200,147,42,0.60);
          --r-glow:     rgba(200,147,42,0.12);
          --r-serif:    'Playfair Display', 'Georgia', serif;
          --r-fell:     'IM Fell English', 'Georgia', serif;
          --r-mono:     'Courier Prime', 'Courier New', monospace;

          min-height: 100vh;
          background: var(--r-bg);
          color: var(--r-ink);
          font-family: var(--r-fell);
          position: relative;
          overflow-x: hidden;
        }

        /* ── FOND ── */
        .redm-root::before {
          content: '';
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 70% 60% at 15% 40%, rgba(60,20,5,0.85) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 85% 20%, rgba(139,58,26,0.08) 0%, transparent 55%),
            radial-gradient(ellipse 80% 50% at 50% 100%, rgba(10,5,0,0.8) 0%, transparent 60%),
            linear-gradient(160deg, #0E0803 0%, #1A1008 30%, #1E1309 60%, #120900 100%);
        }

        /* ── PAPIER VIEILLI ── */
        .redm-root::after {
          content: '';
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image:
            repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(200,147,42,0.018) 28px, rgba(200,147,42,0.018) 29px),
            repeating-linear-gradient(90deg, transparent, transparent 28px, rgba(200,147,42,0.012) 28px, rgba(200,147,42,0.012) 29px);
          opacity: 0.7;
        }

        .redm-root > * { position: relative; z-index: 1; }

        /* ── ORNEMENT FOND ── */
        .redm-ornament {
          position: fixed;
          left: -60px; top: 50%;
          transform: translateY(-50%);
          width: 500px; height: 500px;
          z-index: 0; pointer-events: none;
          opacity: 0.08;
        }

        /* ── SCROLLBAR ── */
        .redm-root ::-webkit-scrollbar { width: 5px; }
        .redm-root ::-webkit-scrollbar-track { background: #0E0803; }
        .redm-root ::-webkit-scrollbar-thumb { background: rgba(200,147,42,0.35); border-radius: 2px; }

        /* ═══════════════════
           HEADER
        ═══════════════════ */
        .redm-header {
          position: sticky; top: 0; z-index: 50;
          background: rgba(18,9,3,0.96);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--r-border);
          box-shadow: 0 2px 30px rgba(0,0,0,0.7);
        }
        .redm-header::after {
          content: '';
          position: absolute; bottom: -3px; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent 0%, var(--r-gold-d) 20%, var(--r-gold) 50%, var(--r-gold-d) 80%, transparent 100%);
          opacity: 0.5;
        }

        .redm-nav-inner {
          width: 100%;
          padding: 0 40px;
          display: flex;
          align-items: center;
          gap: 14px;
          height: 66px;
          box-sizing: border-box;
        }

        /* ── LOGO ── */
        .redm-logo-box {
          width: 40px; height: 40px; flex-shrink: 0;
          background: linear-gradient(135deg, #8B3A1A, #5A1F08);
          border: 1px solid rgba(200,147,42,0.45);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          box-shadow: 0 0 14px rgba(139,58,26,0.4);
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
        }
        .redm-logo-title {
          font-family: var(--r-serif); font-weight: 700; font-size: 15px;
          color: var(--r-ink); line-height: 1; letter-spacing: 0.05em;
        }
        .redm-logo-sub {
          font-family: var(--r-mono); font-size: 11px;
          color: var(--r-gold); letter-spacing: 0.15em; line-height: 1.4;
          text-transform: uppercase;
        }

        /* ── NAV LINKS ── */
        .redm-nav { display: flex; align-items: center; gap: 2px; flex: 1; }
        .redm-nav a {
          font-family: var(--r-serif); font-weight: 400; font-size: 14px;
          letter-spacing: 0.05em;
          color: var(--r-ink-dd); text-decoration: none;
          padding: 6px 13px; border-radius: 3px;
          border: 1px solid transparent;
          transition: all 0.2s;
          white-space: nowrap;
          font-style: italic;
        }
        .redm-nav a:hover {
          color: var(--r-gold-l);
          border-color: var(--r-border);
          background: rgba(200,147,42,0.06);
        }

        /* ── BADGE STATUT ── */
        .redm-status-badge {
          font-family: var(--r-mono); font-size: 11px;
          padding: 4px 12px;
          border: 1px solid rgba(200,147,42,0.40);
          background: rgba(200,147,42,0.07);
          color: var(--r-gold);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        /* ── BTN SWITCH FIVEM ── */
        .redm-fivem-btn {
          display: flex; align-items: center; gap: 6px;
          font-family: var(--r-mono);
          font-size: 12px; letter-spacing: 0.12em;
          padding: 6px 15px;
          border: 1px solid rgba(249,115,22,0.50);
          background: rgba(249,115,22,0.08);
          color: #FB923C;
          text-decoration: none;
          transition: all 0.2s;
          white-space: nowrap;
          text-transform: uppercase;
        }
        .redm-fivem-btn:hover {
          background: rgba(249,115,22,0.18);
          border-color: rgba(249,115,22,0.80);
          box-shadow: 0 0 14px rgba(249,115,22,0.25);
          color: #FED7AA;
        }

        /* ── BTN QUITTER ── */
        .redm-quit-btn {
          font-family: var(--r-mono); font-size: 12px;
          letter-spacing: 0.1em; text-transform: uppercase;
          padding: 6px 15px;
          border: 1px solid rgba(255,255,255,0.08);
          background: transparent;
          color: var(--r-ink-dd);
          text-decoration: none;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .redm-quit-btn:hover {
          border-color: rgba(200,147,42,0.35);
          color: var(--r-gold);
        }

        /* ═══════════════════
           MAIN
        ═══════════════════ */
        .redm-main {
          width: 100%;
          padding: 32px 40px 80px;
          box-sizing: border-box;
        }

        .redm-fade {
          animation: redm-fadein 0.4s ease forwards;
        }
        @keyframes redm-fadein {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ═══════════════════
           COMPOSANTS PARTAGÉS
        ═══════════════════ */
        .redm-card {
          background: var(--r-card);
          border: 1px solid var(--r-border);
          position: relative; overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
        }
        .redm-card:hover {
          transform: translateY(-2px);
          border-color: var(--r-gold-d);
          box-shadow: 0 6px 28px rgba(0,0,0,0.6), 0 0 18px rgba(200,147,42,0.10);
        }

        .redm-section {
          background: rgba(36,21,9,0.80);
          border: 1px solid var(--r-border);
          margin-bottom: 14px;
          overflow: hidden;
        }
        .redm-section-head {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 22px;
          border-bottom: 1px solid var(--r-border);
          background: rgba(200,147,42,0.04);
        }
        .redm-section-title {
          font-family: var(--r-serif); font-size: 14px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--r-gold); font-style: italic;
        }
        .redm-section-body {
          padding: 20px 22px;
          display: flex; flex-direction: column; gap: 14px;
        }

        .redm-input {
          width: 100%;
          background: rgba(0,0,0,0.35);
          border: 1px solid rgba(200,147,42,0.18);
          padding: 10px 16px;
          color: var(--r-ink);
          font-family: var(--r-mono); font-size: 15px;
          transition: border-color 0.15s, box-shadow 0.15s;
          outline: none;
        }
        .redm-input::placeholder { color: var(--r-sepia); }
        .redm-input:focus {
          border-color: rgba(200,147,42,0.50);
          box-shadow: 0 0 0 3px rgba(200,147,42,0.06);
        }
        textarea.redm-input { resize: vertical; }

        .redm-label {
          display: block;
          font-family: var(--r-serif); font-size: 13px; font-weight: 600;
          font-style: italic; letter-spacing: 0.10em; text-transform: uppercase;
          color: var(--r-ink-dd); margin-bottom: 6px;
        }

        .redm-btn {
          background: linear-gradient(135deg, #8B3A1A 0%, #5A1F08 100%);
          color: var(--r-gold-l);
          font-family: var(--r-serif); font-weight: 700; font-style: italic;
          font-size: 15px; letter-spacing: 0.08em;
          border: 1px solid rgba(200,147,42,0.45);
          padding: 13px 30px;
          cursor: pointer; transition: all 0.2s;
          box-shadow: 0 0 16px rgba(139,58,26,0.30), 0 3px 12px rgba(0,0,0,0.4);
        }
        .redm-btn:hover {
          background: linear-gradient(135deg, #A84520 0%, #6B2A0A 100%);
          box-shadow: 0 0 24px rgba(139,58,26,0.50), 0 5px 18px rgba(0,0,0,0.5);
          transform: translateY(-1px);
        }
        .redm-btn:disabled { opacity: 0.4; transform: none; box-shadow: none; cursor: default; }

        .redm-btn-sec {
          background: transparent;
          border: 1px solid rgba(200,147,42,0.25);
          color: var(--r-ink-dd);
          font-family: var(--r-serif); font-style: italic;
          font-size: 14px; letter-spacing: 0.07em;
          padding: 9px 18px;
          cursor: pointer; transition: all 0.2s;
        }
        .redm-btn-sec:hover {
          border-color: var(--r-border-s);
          color: var(--r-gold);
          background: var(--r-glow);
        }

        /* ═══════════════════
           FOOTER
        ═══════════════════ */
        .redm-footer {
          border-top: 1px solid var(--r-border);
          background: rgba(10,5,0,0.6);
          padding: 12px 40px;
          position: relative; z-index: 1;
        }
        .redm-footer::before {
          content: '';
          position: absolute; top: -2px; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, var(--r-gold-d), transparent);
          opacity: 0.4;
        }
        .redm-footer-inner {
          width: 100%;
          display: flex; justify-content: space-between; align-items: center;
        }

        .redm-ornament-divider {
          display: flex; align-items: center; gap: 12px; margin: 4px 0;
        }
        .redm-ornament-divider::before,
        .redm-ornament-divider::after {
          content: ''; flex: 1; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(200,147,42,0.35), transparent);
        }
        .redm-ornament-divider span {
          font-family: var(--r-serif); font-size: 16px;
          color: var(--r-gold-d); font-style: italic;
        }
      `}</style>

      <div className="redm-root">

        {/* ════ ORNEMENT SVG FOND ════ */}
        <svg className="redm-ornament" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="250" cy="250" r="230" stroke="#C8932A" strokeWidth="0.8" strokeDasharray="6 8"/>
          <circle cx="250" cy="250" r="200" stroke="#C8932A" strokeWidth="1.2"/>
          <circle cx="250" cy="250" r="160" stroke="#C8932A" strokeWidth="0.6" strokeDasharray="3 6"/>
          <circle cx="250" cy="250" r="120" stroke="#C8932A" strokeWidth="1"/>
          <circle cx="250" cy="250" r="80"  stroke="#C8932A" strokeWidth="0.8"/>
          <circle cx="250" cy="250" r="45"  stroke="#C8932A" strokeWidth="1.2"/>
          <line x1="250" y1="230" x2="250" y2="270" stroke="#C8932A" strokeWidth="3"/>
          <line x1="230" y1="250" x2="270" y2="250" stroke="#C8932A" strokeWidth="3"/>
          {[0,45,90,135,180,225,270,315].map((a,i) => {
            const rad = a * Math.PI / 180;
            const x1 = 250 + 125 * Math.cos(rad); const y1 = 250 + 125 * Math.sin(rad);
            const x2 = 250 + 195 * Math.cos(rad); const y2 = 250 + 195 * Math.sin(rad);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#C8932A" strokeWidth={i % 2 === 0 ? "1.5" : "0.7"}/>;
          })}
          {[0,90,180,270].map((a,i) => {
            const rad = a * Math.PI / 180;
            const cx = 250 + 160 * Math.cos(rad);
            const cy = 250 + 160 * Math.sin(rad);
            return <g key={i}><circle cx={cx} cy={cy} r="10" stroke="#C8932A" strokeWidth="1" fill="none"/><circle cx={cx} cy={cy} r="4" fill="#C8932A" fillOpacity="0.6"/></g>;
          })}
          <path d="M 250,175 C 260,185 240,195 250,205 C 260,215 240,225 250,235" stroke="#C8932A" strokeWidth="1.5" fill="none"/>
          <line x1="245" y1="175" x2="255" y2="175" stroke="#C8932A" strokeWidth="1.5"/>
          <path id="textCircle" d="M 250,250 m -165,0 a 165,165 0 1,1 330,0 a 165,165 0 1,1 -330,0" fill="none"/>
          <text fontSize="9" fill="#C8932A" fontFamily="Georgia, serif" letterSpacing="6">
            <textPath href="#textCircle">✦ DISPENSAIRE MÉDICAL · ANNO DOMINI MDCCCXC ✦ DISPENSAIRE MÉDICAL · ANNO DOMINI MDCCCXC ✦</textPath>
          </text>
        </svg>

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
              <Link href="/fivem" className="redm-fivem-btn">
                <span style={{ fontSize: 10 }}>◈</span> FiveM
              </Link>
              <Link href="/login" className="redm-quit-btn">
                ⏻ Quitter
              </Link>
            </div>

          </div>
        </header>

        {/* ════ CONTENU ════ */}
        <main className="redm-main">
          <div className="redm-fade">
            {children}
          </div>
        </main>

        {/* ════ FOOTER ════ */}
        <footer className="redm-footer">
          <div className="redm-footer-inner">
            <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: 13, color: '#4A3520', fontStyle: 'italic' }}>
              ✚ La Tanière de l'EMS — Dispensaire RedM
            </span>
            <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: 13, color: '#4A3520', letterSpacing: '0.1em' }}>
              AMAROGRAPH · DISPENSAIRE MEDICAL
            </span>
          </div>
        </footer>
      </div>
    </>
  );
}
