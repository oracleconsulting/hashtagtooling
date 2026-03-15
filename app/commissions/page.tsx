import type { Metadata } from 'next'
import { BreadcrumbJsonLd } from '@/components/BreadcrumbJsonLd'
import CommissionsContent from './CommissionsContent'

export const metadata: Metadata = {
  title: 'Commission Work',
  description: 'Commission a custom handcrafted woodworking tool. Join the waiting list for bespoke mallets, awls, and more from #TOOLING.',
  alternates: { canonical: 'https://hashtag.guru/commissions' },
}

export default function CommissionsPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://hashtag.guru' },
        { name: 'Commissions', url: 'https://hashtag.guru/commissions' },
      ]} />
      <CommissionsContent />
    </>
  )
}
