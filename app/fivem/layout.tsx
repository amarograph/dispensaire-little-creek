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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&family=Exo+2:wght@300;400;500;600&display=swap');

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

        .fivem-root::before {
          content: '';
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 55% 75% at 5% 50%, rgba(10,25,80,0.9) 0%, transparent 55%),
            radial-gradient(ellipse 40% 40% at 92% 15%, rgba(249,115,22,0.07) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 50% 110%, rgba(5,15,50,0.7) 0%, transparent 55%),
            linear-gradient(135deg, #03071A 0%, #050D22 35%, #060F28 60%, #04091C 100%);
        }

        .fivem-root::after {
          content: '';
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='52'%3E%3Cpolygon points='30,2 56,16 56,44 30,58 4,44 4,16' fill='none' stroke='rgba(249,115,22,0.07)' stroke-width='0.6'/%3E%3C/svg%3E");
          background-size: 60px 52px;
          mask-image: linear-gradient(to left, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 55%, transparent 75%);
          -webkit-mask-image: linear-gradient(to left, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 55%, transparent 75%);
        }

        .fivem-root > * { position: relative; z-index: 1; }

        .fivem-hud {
          position: fixed;
          left: -100px; top: 50%;
          transform: translateY(-50%);
          width: 680px; height: 680px;
          z-index: 0; pointer-events: none;
          opacity: 0.22;
        }

        @keyframes hud-rot-cw  { from{transform-box:fill-box;transform-origin:center;transform:rotate(0deg)}   to{transform-box:fill-box;transform-origin:center;transform:rotate(360deg)}  }
        @keyframes hud-rot-ccw { from{transform-box:fill-box;transform-origin:center;transform:rotate(0deg)}   to{transform-box:fill-box;transform-origin:center;transform:rotate(-360deg)} }
        @keyframes hud-pulse   { 0%,100%{opacity:.4} 50%{opacity:1} }
        @keyframes hud-flow    { from{stroke-dashoffset:160} to{stroke-dashoffset:0} }
        @keyframes ecg-travel  {
          0%   { stroke-dashoffset: 1200; opacity: 0; }
          5%   { opacity: 1; }
          85%  { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }
        @keyframes ecg-glow-pulse {
          0%,100% { filter: drop-shadow(0 0 3px rgba(249,115,22,0.6)); }
          50%      { filter: drop-shadow(0 0 10px rgba(249,115,22,1)) drop-shadow(0 0 20px rgba(249,115,22,0.5)); }
        }

        .hud-ring1 { animation: hud-rot-cw  18s linear infinite; transform-box: fill-box; transform-origin: 340px 340px; }
        .hud-ring2 { animation: hud-rot-ccw 12s linear infinite; transform-box: fill-box; transform-origin: 340px 340px; }
        .hud-ring3 { animation: hud-rot-cw  30s linear infinite; transform-box: fill-box; transform-origin: 340px 340px; }
        .hud-pulse { animation: hud-pulse 2.5s ease-in-out infinite; }
        .hud-flow  { animation: hud-flow 3s linear infinite; stroke-dasharray: 12 8; }

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

        /* ── Nav inner — UNE SEULE DÉFINITION, pleine largeur ── */
        .fivem-nav-inner {
          width: 100%;
          padding: 0 40px;
          display: flex;
          align-items: center;
          gap: 16px;
          height: 56px;
          box-sizing: border-box;
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
          font-family: var(--f-display); font-weight: 700; font-size: 17px;
          color: var(--f-text); line-height: 1; letter-spacing: 0.04em;
        }
        .fivem-logo-sub {
          font-family: var(--f-mono); font-size: 12px;
          color: var(--f-accent); letter-spacing: 0.14em; line-height: 1.4;
        }

        /* ── Nav links ── */
        .fivem-nav { display: flex; align-items: center; gap: 2px; flex: 1; }
        .fivem-nav a {
          font-family: var(--f-display); font-weight: 600; font-size: 14px;
          letter-spacing: 0.07em; text-transform: uppercase;
          color: var(--f-muted); text-decoration: none;
          padding: 6px 12px; border-radius: 7px;
          border: 1px solid transparent;
          transition: all 0.18s;
          white-space: nowrap;
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
          font-family: var(--f-mono); font-size: 12px;
          padding: 4px 11px; border-radius: 4px;
          color: #4ADE80; border: 1px solid rgba(74,222,128,0.35);
          background: rgba(74,222,128,0.07); letter-spacing: 0.1em;
        }

        /* ── MAIN — UNE SEULE DÉFINITION, pleine largeur ── */
        .fivem-main {
          width: 100%;
          padding: 28px 40px 80px;
          box-sizing: border-box;
        }

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
          font-family: var(--f-display); font-size: 14px; font-weight: 700;
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
          font-family: var(--f-display); font-size: 13px; font-weight: 600;
          letter-spacing: 0.11em; text-transform: uppercase;
          color: var(--f-muted); margin-bottom: 5px;
        }

        /* ── CHIPS ── */
        .fivem-chip {
          font-size: 13px; padding: 5px 13px;
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
          font-size: 14px; letter-spacing: 0.11em; text-transform: uppercase;
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
          font-size: 14px; letter-spacing: 0.09em; text-transform: uppercase;
          border-radius: 9px; padding: 9px 18px;
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
        .fivem-vital-unit { padding: 0 10px; font-size: 13px; opacity: 0.6; }
        .fivem-v-ok    { color: #4ADE80; border-color: rgba(74,222,128,0.38);   background: rgba(74,222,128,0.05); }
        .fivem-v-alert { color: #F87171; border-color: rgba(248,113,113,0.38);  background: rgba(248,113,113,0.05); }
        .fivem-v-empty { color: #475569; border-color: rgba(71,85,105,0.45);    background: rgba(0,0,0,0.28); }

        /* ── FOOTER ── */
        .fivem-footer {
          border-top: 1px solid var(--f-border);
          background: rgba(10,15,30,0.55);
          padding: 10px 40px;
          position: relative; z-index: 1;
        }
        .fivem-footer-inner {
          width: 100%;
          display: flex; justify-content: space-between; align-items: center;
        }

        /* ── BTN SWITCH REDM ── */
        .fivem-redm-btn {
          display: flex; align-items: center; gap: 6px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 13px; letter-spacing: 0.12em;
          padding: 6px 14px; border-radius: 6px;
          border: 1px solid rgba(220,38,38,0.55);
          background: rgba(220,38,38,0.10);
          color: #F87171;
          text-decoration: none;
          transition: all 0.18s;
          white-space: nowrap;
        }
        .fivem-redm-btn:hover {
          background: rgba(220,38,38,0.22);
          border-color: rgba(220,38,38,0.85);
          box-shadow: 0 0 14px rgba(220,38,38,0.35);
          color: #FCA5A5;
        }

        .fivem-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--f-border), transparent);
          margin: 2px 0;
        }
      `}</style>

      <div className="fivem-root">

        {/* ════ HUD MÉDICAL SVG ════ */}
        <svg className="fivem-hud" viewBox="0 0 680 680" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="glow-orange">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="glow-blue">
              <feGaussianBlur stdDeviation="4" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          <g className="hud-ring1">
            <circle cx="340" cy="340" r="300" stroke="rgba(249,115,22,0.3)" strokeWidth="0.8"/>
            <circle cx="340" cy="340" r="300" stroke="rgba(249,115,22,0.8)" strokeWidth="1.5" strokeDasharray="18 22" filter="url(#glow-orange)"/>
            {[0,45,90,135,180,225,270,315].map((a,i) => {
              const rad = a * Math.PI / 180;
              const x1 = 340 + 290 * Math.cos(rad); const y1 = 340 + 290 * Math.sin(rad);
              const x2 = 340 + 308 * Math.cos(rad); const y2 = 340 + 308 * Math.sin(rad);
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(249,115,22,0.9)" strokeWidth="2" filter="url(#glow-orange)"/>;
            })}
          </g>

          <g className="hud-ring2">
            <circle cx="340" cy="340" r="240" stroke="rgba(56,189,248,0.25)" strokeWidth="0.7"/>
            <circle cx="340" cy="340" r="240" stroke="rgba(56,189,248,0.7)" strokeWidth="1.2" strokeDasharray="30 15" filter="url(#glow-blue)"/>
            {[0,60,120,180,240,300].map((a,i) => {
              const rad = a * Math.PI / 180;
              const x1 = 340 + 232 * Math.cos(rad); const y1 = 340 + 232 * Math.sin(rad);
              const x2 = 340 + 248 * Math.cos(rad); const y2 = 340 + 248 * Math.sin(rad);
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(56,189,248,0.9)" strokeWidth="2" filter="url(#glow-blue)"/>;
            })}
          </g>

          <g className="hud-ring3">
            <circle cx="340" cy="340" r="180" stroke="rgba(249,115,22,0.2)" strokeWidth="0.6"/>
            <circle cx="340" cy="340" r="180" stroke="rgba(249,115,22,0.5)" strokeWidth="1" strokeDasharray="8 16"/>
          </g>

          <circle cx="340" cy="340" r="130" stroke="rgba(56,189,248,0.35)" strokeWidth="1.5"/>
          <circle cx="340" cy="340" r="130" stroke="rgba(56,189,248,0.6)" strokeWidth="0.8" strokeDasharray="4 8" filter="url(#glow-blue)"/>
          <circle cx="340" cy="340" r="70" stroke="rgba(249,115,22,0.5)" strokeWidth="1" className="hud-pulse" filter="url(#glow-orange)"/>
          <circle cx="340" cy="340" r="55" fill="rgba(249,115,22,0.06)" stroke="rgba(249,115,22,0.6)" strokeWidth="1.5" filter="url(#glow-orange)"/>
          <polygon points="340,310 366,325 366,355 340,370 314,355 314,325" fill="rgba(249,115,22,0.12)" stroke="rgba(249,115,22,0.9)" strokeWidth="1.5" filter="url(#glow-orange)"/>
          <line x1="340" y1="322" x2="340" y2="358" stroke="rgba(255,255,255,0.9)" strokeWidth="3" filter="url(#glow-blue)"/>
          <line x1="323" y1="340" x2="357" y2="340" stroke="rgba(255,255,255,0.9)" strokeWidth="3" filter="url(#glow-blue)"/>
          <line x1="406" y1="340" x2="470" y2="280" stroke="rgba(56,189,248,0.5)" strokeWidth="0.8" className="hud-flow"/>
          <line x1="406" y1="340" x2="490" y2="340" stroke="rgba(249,115,22,0.5)" strokeWidth="0.8" className="hud-flow"/>
          <line x1="406" y1="340" x2="470" y2="400" stroke="rgba(56,189,248,0.5)" strokeWidth="0.8" className="hud-flow"/>
          <line x1="340" y1="305" x2="340" y2="240" stroke="rgba(56,189,248,0.4)" strokeWidth="0.8" className="hud-flow"/>
          <line x1="274" y1="340" x2="210" y2="300" stroke="rgba(249,115,22,0.35)" strokeWidth="0.6" className="hud-flow"/>
          <polygon points="490,255 510,266 510,288 490,299 470,288 470,266" fill="rgba(56,189,248,0.08)" stroke="rgba(56,189,248,0.7)" strokeWidth="1" filter="url(#glow-blue)"/>
          <text x="490" y="283" textAnchor="middle" fontSize="14" fill="rgba(56,189,248,0.9)">⊕</text>
          <polygon points="510,315 530,326 530,348 510,359 490,348 490,326" fill="rgba(249,115,22,0.08)" stroke="rgba(249,115,22,0.7)" strokeWidth="1" filter="url(#glow-orange)"/>
          <text x="510" y="343" textAnchor="middle" fontSize="13" fill="rgba(249,115,22,0.9)">◈</text>
          <polygon points="490,375 510,386 510,408 490,419 470,408 470,386" fill="rgba(56,189,248,0.08)" stroke="rgba(56,189,248,0.7)" strokeWidth="1" filter="url(#glow-blue)"/>
          <text x="490" y="403" textAnchor="middle" fontSize="14" fill="rgba(56,189,248,0.9)">⊗</text>
          <polygon points="340,215 360,226 360,248 340,259 320,248 320,226" fill="rgba(249,115,22,0.06)" stroke="rgba(249,115,22,0.55)" strokeWidth="1"/>
          <text x="340" y="242" textAnchor="middle" fontSize="12" fill="rgba(249,115,22,0.8)">✦</text>
          <polygon points="420,190 430,196 430,208 420,214 410,208 410,196" fill="none" stroke="rgba(56,189,248,0.4)" strokeWidth="0.8"/>
          <polygon points="555,290 563,295 563,305 555,310 547,305 547,295" fill="none" stroke="rgba(249,115,22,0.35)" strokeWidth="0.7"/>
          <polygon points="560,380 568,385 568,395 560,400 552,395 552,385" fill="none" stroke="rgba(56,189,248,0.35)" strokeWidth="0.7"/>
          <polygon points="390,450 398,455 398,465 390,470 382,465 382,455" fill="none" stroke="rgba(249,115,22,0.3)" strokeWidth="0.6"/>
          <circle cx="450" cy="298" r="2.5" fill="rgba(56,189,248,0.9)" className="hud-pulse" filter="url(#glow-blue)"/>
          <circle cx="460" cy="340" r="2.5" fill="rgba(249,115,22,0.9)" className="hud-pulse" filter="url(#glow-orange)"/>
          <circle cx="450" cy="382" r="2.5" fill="rgba(56,189,248,0.9)" className="hud-pulse" filter="url(#glow-blue)"/>
          <circle cx="340" cy="268" r="2"   fill="rgba(56,189,248,0.7)" className="hud-pulse"/>
          <path d="M 100,340 A 240,240 0 0,1 340,100" stroke="rgba(249,115,22,0.4)" strokeWidth="1.2" strokeDasharray="6 10" filter="url(#glow-orange)"/>
          <path d="M 340,580 A 240,240 0 0,1 580,340" stroke="rgba(56,189,248,0.35)" strokeWidth="1" strokeDasharray="4 12" filter="url(#glow-blue)"/>
          {Array.from({length: 60}, (_,i) => {
            const a = (i * 6) * Math.PI / 180;
            const len = i % 5 === 0 ? 12 : 6;
            const r1 = 315; const r2 = r1 + len;
            return <line key={i} x1={340+r1*Math.cos(a)} y1={340+r1*Math.sin(a)} x2={340+r2*Math.cos(a)} y2={340+r2*Math.sin(a)} stroke={i%5===0?"rgba(249,115,22,0.5)":"rgba(56,189,248,0.25)"} strokeWidth={i%5===0?1:0.5}/>;
          })}
          <path
            d="M 340,340 L 380,340 L 395,340 L 400,336 L 405,340 L 408,340 L 415,340 L 418,322 L 422,362 L 426,328 L 430,340 L 435,340 L 440,337 L 445,340 L 460,340 L 465,340 L 468,336 L 473,340 L 476,340 L 483,340 L 486,322 L 490,362 L 494,328 L 498,340 L 503,340 L 508,337 L 513,340 L 530,340 L 535,340 L 538,337 L 542,340 L 545,340 L 548,322 L 552,362 L 556,328 L 560,340 L 565,340 L 570,338 L 575,340 L 600,340 L 650,340 L 720,340 L 800,340 L 900,340 L 1100,340 L 1400,340 L 1800,340 L 2200,340"
            stroke="#F97316" strokeWidth="2" fill="none" strokeDasharray="1200" strokeDashoffset="1200"
            style={{ animation: 'ecg-travel 3.2s ease-out infinite', animationDelay: '0s', filter: 'drop-shadow(0 0 4px rgba(249,115,22,0.9)) drop-shadow(0 0 12px rgba(249,115,22,0.5))' }}
          />
          <path
            d="M 340,340 L 380,340 L 395,340 L 400,336 L 405,340 L 408,340 L 415,340 L 418,322 L 422,362 L 426,328 L 430,340 L 435,340 L 440,337 L 445,340 L 460,340 L 465,340 L 468,336 L 473,340 L 476,340 L 483,340 L 486,322 L 490,362 L 494,328 L 498,340 L 503,340 L 508,337 L 513,340 L 530,340 L 535,340 L 538,337 L 542,340 L 545,340 L 548,322 L 552,362 L 556,328 L 560,340 L 565,340 L 570,338 L 575,340 L 600,340 L 650,340 L 720,340 L 800,340 L 900,340 L 1100,340 L 1400,340 L 1800,340 L 2200,340"
            stroke="rgba(249,115,22,0.55)" strokeWidth="1.2" fill="none" strokeDasharray="1200" strokeDashoffset="1200"
            style={{ animation: 'ecg-travel 3.2s ease-out infinite', animationDelay: '1.6s', filter: 'drop-shadow(0 0 6px rgba(249,115,22,0.7))' }}
          />
          <circle cx="340" cy="340" r="5" fill="rgba(249,115,22,0.9)"
            style={{ animation: 'ecg-glow-pulse 3.2s ease-in-out infinite', filter: 'drop-shadow(0 0 8px #F97316)' }}
          />
        </svg>

        {/* ════ HEADER ════ */}
        <header className="fivem-header">
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

            {/* Status + Switch + Quitter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="fivem-dot" />
                <span className="fivem-badge">ACTIF</span>
              </div>

              {/* Switch RedM */}
              <Link href="/redm" className="fivem-redm-btn">
                <span style={{ fontSize: 9 }}>⬡</span> REDM
              </Link>

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
              ⚕ LA TANIÈRE DE L'EMS — MDT
            </span>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#334155' }}>
              AMAROGRAPH MEDICAL DISPATCH TERMINAL
            </span>
          </div>
        </footer>
      </div>
    </>
  );
}