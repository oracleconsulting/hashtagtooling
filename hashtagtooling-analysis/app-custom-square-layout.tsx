import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Build Your Engineering Square',
  description: 'Design a precision engineering square with exotic wood scales, brass liners, and laser-cut tool steel or titanium bodies. 5 sizes from pocket to full-bench. Made to order in the UK.',
  alternates: { canonical: 'https://hashtag.guru/custom-square' },
  openGraph: {
    title: 'Build Your Engineering Square | #TOOLING',
    description: 'Precision laser-cut engineering squares with exotic timber scales. Choose your size, body material, scale wood, and liner metal.',
    url: 'https://hashtag.guru/custom-square',
  },
}

export default function CustomSquareLayout({ children }: { children: React.ReactNode }) {
  return children
}
