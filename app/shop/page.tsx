import type { Metadata } from 'next'
import { BreadcrumbJsonLd } from '@/components/BreadcrumbJsonLd'
import ShopContent from './ShopContent'

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Browse handcrafted woodworking mallets, awls, EDC coins, and exotic timber. Every piece unique, made to order in the UK.',
  alternates: { canonical: 'https://hashtag.guru/shop' },
}

export default function ShopPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://hashtag.guru' },
        { name: 'Shop', url: 'https://hashtag.guru/shop' },
      ]} />
      <ShopContent />
    </>
  )
}
