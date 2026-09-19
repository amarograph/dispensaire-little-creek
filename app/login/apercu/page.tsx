import { notFound } from 'next/navigation';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import RedMDashboardClient from '@/app/redm/RedMDashboardClient';

export const dynamic = 'force-dynamic';

export default function HomePreview() {
  if (process.env.NODE_ENV !== 'development') notFound();
  // Reuse the current layout styles so visual edits also update this local preview.
  const layout = readFileSync(join(process.cwd(), 'app/redm/layout.tsx'), 'utf8').replace(/\r\n/g, '\n');
  const css = layout.split('<style>{`')[1]?.split('`}</style>')[0] ?? '';
  const navigation = ['⌂ Accueil', '📋 Registre Patient', '💰 Caisse et Comptabilité', '📚 Bibliothèque', '🗄 Archives', '📅 Agenda', '🛋 Cabinet Thérapeutique', '🏛 Direction'];
  return <>
    <style dangerouslySetInnerHTML={{ __html: css }} />
    <style>{`@media(max-width:900px){.redm-root{zoom:0.5;width:100%}}`}</style>
    <div className="redm-root">
      <div className="redm-bg-image" /><div className="redm-bg-overlay" />
      <header className="redm-header">
        <div className="redm-topbar">
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <img src="/logo-redm.png" alt="Dispensaire de Little Creek" width={62} height={62} style={{objectFit:'contain'}} />
            <div><div className="redm-logo-title">LITTLE CREEK</div><div className="redm-logo-sub">Dispensaire · RedM · 1890</div></div>
          </div>
          <span className="redm-status-badge">Aperçu visuel · sans données privées</span>
        </div>
        <div className="redm-navrow"><nav className="redm-nav">{navigation.map(label=><a key={label} href="#accueil">{label}</a>)}</nav></div>
      </header>
      <main id="accueil" className="redm-main"><RedMDashboardClient roles={['redm_directeur']} preview /></main>
      <footer className="redm-footer"><span>Dispensaire de Little Creek</span><span>Aperçu local — les rubriques complètes nécessitent une connexion.</span></footer>
    </div>
  </>;
}
