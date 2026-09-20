import { notFound } from 'next/navigation';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import RedMDashboardClient from '@/app/redm/RedMDashboardClient';
import ZoomPicker from '@/components/layout/ZoomPicker';
import ZoomWrapper from '@/components/layout/ZoomWrapper';

export const dynamic = 'force-dynamic';

export default function HomePreview() {
  if (process.env.NODE_ENV !== 'development') notFound();
  // Reuse the current layout styles so visual edits also update this local preview.
  const layout = readFileSync(join(process.cwd(), 'app/redm/layout.tsx'), 'utf8').replace(/\r\n/g, '\n');
  const css = layout.split('<style>{`')[1]?.split('`}</style>')[0] ?? '';
  const navigation = ['⌂ Accueil', '📋 Registre Patient', '💰 Caisse et Comptabilité', '📚 Bibliothèque', '🗄 Archives', '📅 Agenda', '🛋 Cabinet Thérapeutique', '🏛 Direction'];
  return <>
    <style dangerouslySetInnerHTML={{ __html: css }} />
    <div className="redm-root">
      <div className="redm-bg-image" /><div className="redm-bg-overlay" />
      <header className="redm-header">
        <div className="redm-topbar">
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <img src="/logo-redm.png" alt="Dispensaire de Little Creek" width={62} height={62} style={{objectFit:'contain'}} />
            <div><div className="redm-logo-title">LITTLE CREEK</div><div className="redm-logo-sub">Dispensaire · 1890</div></div>
          </div>
          <span className="redm-status-badge">Aperçu visuel · sans données privées</span>
        </div>
        <div className="redm-navrow"><ZoomWrapper as="nav" className="redm-nav">{navigation.map(label=><a key={label} href="#accueil">{label}</a>)}</ZoomWrapper><ZoomPicker accentRgb="180,160,113" activeColor="#EADCB9" mutedColor="#C8BEA5" /></div>
      </header>
      <div id="accueil"><ZoomWrapper className="redm-main"><RedMDashboardClient roles={['redm_directeur']} preview /></ZoomWrapper></div>
      <footer className="redm-footer"><span>Dispensaire de Little Creek</span><span>Aperçu local — les rubriques complètes nécessitent une connexion.</span></footer>
    </div>
  </>;
}
