import { CookieBanner } from '@/components/site/CookieBanner'
import { RevealObserver, WhatsFloat } from '@/components/site/Effects'
import { Footer } from '@/components/site/Footer'
import { Header } from '@/components/site/Header'
import { Icon } from '@/components/icons'
import { getCategories, getSettings } from '@/lib/data'
import { isOnline, noticeActive } from '@/lib/format'
import { isDemo } from '@/lib/supabase/env'
import './site.css'

export const revalidate = 60

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()])
  const online = isOnline(settings)
  return (
    <>
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>
      {isDemo ? <div className="demo-banner">Modo demonstração: dados de exemplo. Configure o Supabase para usar os dados reais.</div> : null}
      {noticeActive(settings) ? (
        <div className="notice">
          <Icon name="calendario" size={18} />
          <span>{settings.notice_text}</span>
        </div>
      ) : null}
      <Header categories={categories} whatsapp={settings.whatsapp} instagram={settings.instagram} tiktok={settings.tiktok} online={online} />
      <main id="conteudo">{children}</main>
      <Footer settings={settings} categories={categories} />
      <WhatsFloat phone={settings.whatsapp} online={online} offlineMessage={settings.offline_message} />
      <CookieBanner gaId={process.env.NEXT_PUBLIC_GA_ID} />
      <RevealObserver />
    </>
  )
}
