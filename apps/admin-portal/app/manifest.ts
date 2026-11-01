import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Silong',
    short_name: 'Silong',
    description: 'Silong — Engage, empower, uplift. Cooperative Member Portal powered by Tuntong Tech Solution.',
    start_url: '/member',
    display: 'standalone',
    background_color: '#223a5e',
    theme_color: '#223a5e',
    orientation: 'portrait-primary',
    categories: ['finance', 'banking', 'productivity'],
    icons: [
      {
        src: '/icons/silong-icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/silong-icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/silong-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/silong-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
