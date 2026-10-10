import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Flex Coop Solution - Admin Portal',
  description: 'Enterprise Multi-Tenant SaaS Cooperative Banking & Lending Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased">{children}</body>
    </html>
  );
}
