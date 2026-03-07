import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Build Your Custom Mallet',
  description:
    'Design your own handcrafted woodworking mallet. Choose from 75+ exotic wood species for head and handle, plus transition metals. Made to order in the UK.',
  alternates: { canonical: 'https://hashtag.guru/custom-mallet' },
}

export default function CustomMalletLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
