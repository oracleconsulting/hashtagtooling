import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Adopt a Blank — Exotic Timber Blanks',
  description: 'Adopt a hand-selected exotic timber blank from the #TOOLING workshop. Premium offcuts from mallet and awl production, ready for your next project.',
  alternates: { canonical: 'https://hashtag.guru/adopt' },
}

export default function AdoptLayout({ children }: { children: React.ReactNode }) {
  return children
}
