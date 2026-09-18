export default function AccessDenied() {
  return (
    <div style={{ fontFamily: "'Josefin Slab', 'Georgia', serif", textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 40, marginBottom: 14 }}>⛔</div>
      <h1 style={{ fontFamily: "'Rye', 'Georgia', serif", fontSize: 24, color: '#D04040', marginBottom: 8 }}>
        Accès refusé
      </h1>
      <p style={{ fontSize: 15, color: '#C0B0A0' }}>
        Ton rôle ne te donne pas accès à ce module.
      </p>
    </div>
  );
}
