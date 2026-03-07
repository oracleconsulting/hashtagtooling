import type { Metadata } from 'next'
import ShopContent from './ShopContent'

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Browse handcrafted woodworking mallets, awls, EDC coins, and exotic timber. Every piece unique, made to order in the UK.',
}

export default function ShopPage() {
  return <ShopContent />
}
