export default function AccessDenied() {
  return (
    <div style={{ fontFamily: "'Cormorant Garamond', 'Georgia', serif", textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 40, marginBottom: 14 }}>⛔</div>
      <h1 style={{ fontFamily: "'Burnic', 'Georgia', serif", fontSize: 24, color: '#254B50', marginBottom: 8 }}>
        Accès refusé
      </h1>
      <p style={{ fontSize: 15, color: '#46564E' }}>
        Ton rôle ne te donne pas accès à ce module.
      </p>
    </div>
  );
}
