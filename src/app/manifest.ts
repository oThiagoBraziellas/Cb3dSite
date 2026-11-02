import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CB3D Impressão 3D',
    short_name: 'CB3D',
    start_url: '/',
    display: 'standalone',
    background_color: '#FBF8FF',
    theme_color: '#F9208D',
    lang: 'pt-BR',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
