export default function AccessDenied() {
  return (
    <div style={{ fontFamily: "'Cormorant Garamond', 'Georgia', serif", textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 40, marginBottom: 14 }}>⛔</div>
      <h1 style={{ fontFamily: "'Central Station', 'Georgia', serif", fontSize: 24, color: '#EADCB9', marginBottom: 8 }}>
        Accès refusé
      </h1>
      <p style={{ fontSize: 15, color: '#C8BEA5' }}>
        Ton rôle ne te donne pas accès à ce module.
      </p>
    </div>
  );
}
