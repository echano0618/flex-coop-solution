import './globals.css';
import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#223a5e',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://silong.tuntongtech.com'),
  title: 'Silong - Community Hub | A Tuntong Tech Solution',
  description: 'Silong - Community Hub. Sa iisang bubong, sama-samang aahon. Community Hub, cooperative passbook & member enterprise platform.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Silong - Community Hub',
    startupImage: ['/icons/silong-icon-512.png'],
  },
  applicationName: 'Silong - Community Hub',
  icons: {
    icon: [
      { url: '/favicon.png?v=silong', sizes: '64x64', type: 'image/png' },
      { url: '/icons/silong-icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/silong-icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/silong-apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="180x180" href="/silong-apple-touch-icon.png" />
        <link rel="apple-touch-startup-image" href="/icons/silong-icon-512.png" />
        <link rel="icon" type="image/png" sizes="64x64" href="/favicon.png?v=silong" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico?v=silong" />
        <meta name="application-name" content="Silong" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Silong" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.warn('PWA SW registration failed:', err);
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 antialiased">{children}</body>
    </html>
  );
}
