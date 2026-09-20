'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const DISPLAY = "'Central Station', 'Georgia', serif";
const MONO    = "'Libre Baskerville', 'Courier New', monospace";

const MODULES = [
  { id: 'comptabilite', href: '/redm/direction/comptabilite', icon: '📊', label: 'Comptabilité', sub: 'REGISTRE & SALAIRES', desc: 'Registre hebdomadaire de la Caisse et calcul du salaire de chaque médecin selon les soins effectués.', color: '#D1B77C', badge: 'FIN' },
  { id: 'medecins', href: '/redm/direction/medecins', icon: '🩺', label: 'Liste des Médecins', sub: 'PERSONNEL DU DISPENSAIRE', desc: 'Annuaire du personnel médical : numéro de compte, date de naissance et parcours universitaire.', color: '#BAAAC6', badge: 'RH' },
  { id: 'tarifs', href: '/redm/direction/tarifs', icon: '🏷', label: 'Tarifs & Répartition', sub: 'PRIX & POURCENTAGES', desc: 'Définir le prix de chaque prestation et la répartition des honoraires entre le dispensaire et le médecin.', color: '#E8B860', badge: 'CFG' },
  { id: 'stockage', href: '/redm/direction/stockage', icon: '📦', label: 'Gestionnaire de Stockage', sub: 'INVENTAIRE & RÉAPPROVISIONNEMENT', desc: 'Suivi des stocks de plantes et produits médicaux, avec alerte automatique en cas de rupture imminente.', color: '#D1B77C', badge: 'STK' },
  { id: 'inventaire', href: '/redm/direction/inventaire', icon: '🔒', label: 'Inventaire', sub: 'CONSULTATION — LECTURE SEULE', desc: "Voir l'état complet des stocks par catégorie sans pouvoir le modifier, avec alerte en cas de rupture imminente.", color: '#AAB9C6', badge: 'INV' },
  { id: 'alerte-sanitaire', href: '/redm/direction/alerte-sanitaire', icon: '🚨', label: 'Alerte Sanitaire', sub: 'ÉPIDÉMIES & RISQUES', desc: "Déclarer une épidémie ou un risque sanitaire en cours, et marquer la situation comme critique pour alerter tous les joueurs.", color: '#DF9A88', badge: 'ALR' },
  { id: 'journal',   href: '/redm/direction/journal',   icon: '📜', label: "Journal d'activité",    sub: 'HISTORIQUE DES ACTIONS',         desc: "Consulter l'historique complet des actions de la direction : modifications de tarifs, salaires, inventaire, fiches médecins…", color: '#7A6A50', badge: 'LOG' },
];

export default function DirectionPage() {
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);

  return (
    <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');`}</style>

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <button onClick={() => router.push('/redm')}
            style={{ fontFamily: MONO, fontSize: 15, background: 'transparent', border: '1px solid rgba(209,183,124,0.35)', color: '#A08850', padding: '8px 18px', cursor: 'pointer', letterSpacing: '0.1em' }}>
            ← RETOUR
          </button>
          <span style={{ fontFamily: MONO, fontSize: 14, color: '#D1B77C', letterSpacing: '0.18em' }}>DISPENSAIRE · DIRECTION</span>
        </div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 40, color: '#EADCB9', margin: 0 }}>🏛 Direction</h1>
        <p style={{ fontFamily: MONO, fontSize: 14, color: '#C8BEA5', letterSpacing: '0.12em', marginTop: 8 }}>
          ACCÈS RÉSERVÉ · DIRECTION & CO-DIRECTION — SÉLECTIONNEZ UNE SECTION
        </p>
      </div>

      {/* Grille */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {MODULES.map(m => {
          const h = hover === m.id;
          return (
            <div key={m.id}
              onClick={() => router.push(m.href)}
              onMouseEnter={() => setHover(m.id)}
              onMouseLeave={() => setHover(null)}
              style={{
                background:  h ? '#254B5C' : '#102B3B',
                border:      `2px solid ${h ? m.color + '90' : 'rgba(209,183,124,0.22)'}`,
                borderLeft:  `4px solid ${h ? m.color : m.color + '55'}`,
                padding:     '28px 24px',
                cursor:      'pointer',
                transition:  'all 0.18s',
                transform:   h ? 'translateY(-2px)' : 'none',
                boxShadow:   h ? `0 8px 30px rgba(0,0,0,0.6), 0 0 20px ${m.color}18` : '0 2px 8px rgba(0,0,0,0.45)',
              }}>
              <div style={{ fontSize: 42, marginBottom: 14 }}>{m.icon}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontFamily: DISPLAY, fontSize: 23, color: '#EADCB9' }}>{m.label}</span>
                <span style={{ fontFamily: MONO, fontSize: 12, padding: '3px 7px', background: m.color + '22', color: m.color, border: `1px solid ${m.color + '55'}`, letterSpacing: '0.1em', flexShrink: 0 }}>{m.badge}</span>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 12, color: m.color, letterSpacing: '0.12em', marginBottom: 10 }}>{m.sub}</div>
              <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, color: '#5A4030', lineHeight: 1.55 }}>{m.desc}</div>
              <div style={{ fontFamily: MONO, fontSize: 14, color: h ? m.color : '#2A1010', marginTop: 14, letterSpacing: '0.1em', transition: 'color 0.15s' }}>→ ACCÉDER</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
