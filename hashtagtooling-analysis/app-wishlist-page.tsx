import type { Metadata } from 'next'
import WishlistContent from './WishlistContent'

export const metadata: Metadata = {
  title: 'Wishlist',
  description: 'Your saved items from #TOOLING.',
  alternates: { canonical: 'https://hashtag.guru/wishlist' },
}

export default function WishlistPage() {
  return <WishlistContent />
}
