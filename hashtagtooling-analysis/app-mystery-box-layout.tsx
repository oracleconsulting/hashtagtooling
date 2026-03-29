import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mystery Wood Box',
  description: 'A curated mystery box of exotic timber offcuts and blanks from the #TOOLING workshop. Perfect for small projects, pen turning, or adding to your wood collection.',
  alternates: { canonical: 'https://hashtag.guru/mystery-box' },
}

export default function MysteryBoxLayout({ children }: { children: React.ReactNode }) {
  return children
}
