import type { Metadata, Viewport } from 'next'
import '@fontsource/fredoka/500.css'
import '@fontsource/fredoka/600.css'
import '@fontsource/fredoka/700.css'
import '@fontsource/nunito/400.css'
import '@fontsource/nunito/600.css'
import '@fontsource/nunito/700.css'
import '@fontsource/nunito/800.css'
import '@fontsource/lobster-two/700-italic.css'
import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'CB3D Impressão 3D · peças únicas feitas camada por camada', template: '%s · CB3D Impressão 3D' },
  description:
    'Presentes personalizados, decoração, brinquedos e chaveiros impressos em 3D pela Cintia, em Brasília. Monte sua lista e peça pelo WhatsApp.',
  applicationName: 'CB3D Impressão 3D',
  openGraph: { type: 'website', locale: 'pt_BR', siteName: 'CB3D Impressão 3D', images: ['/logo-cb3d.png'] },
  icons: { icon: '/icon.png', apple: '/apple-icon.png' },
  manifest: '/manifest.webmanifest',
}

export const viewport: Viewport = {
  themeColor: '#F9208D',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
