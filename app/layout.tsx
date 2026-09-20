import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Dispensaire de Little Creek",
  description: 'Système de gestion documentaire privé',
  icons: {
    icon: [{ url: '/favicon-dispensaire.webp', type: 'image/webp' }],
    shortcut: ['/favicon-dispensaire.webp'],
    apple: ['/favicon-dispensaire.webp'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
