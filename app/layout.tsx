import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Dispensaire de Little Creek",
  description: 'Système de gestion documentaire privé',
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
