import type { Metadata } from 'next'
import WishlistContent from './WishlistContent'

export const metadata: Metadata = {
  title: 'Wishlist',
  description: 'Your saved items from #TOOLING.',
}

export default function WishlistPage() {
  return <WishlistContent />
}
