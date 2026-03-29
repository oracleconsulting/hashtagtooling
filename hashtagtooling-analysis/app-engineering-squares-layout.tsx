import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Engineering Squares — Precision Reference Tools',
  description: 'Handcrafted precision engineering squares with exotic wood scales, brass liners, and laser-cut tool steel or titanium bodies. 5 sizes. 75+ wood species. 0.15mm laser tolerance. Made in the UK.',
  alternates: { canonical: 'https://hashtag.guru/engineering-squares' },
  openGraph: {
    title: 'Engineering Squares | #TOOLING',
    description: 'Precision laser-cut engineering squares dressed in exotic timber. From the pocket-sized Chode to the full 250mm reference.',
    url: 'https://hashtag.guru/engineering-squares',
  },
}

export default function SquaresLayout({ children }: { children: React.ReactNode }) {
  return children
}
