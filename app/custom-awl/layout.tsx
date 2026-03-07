import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Build Your Custom Awl',
  description:
    'Design your own handcrafted marking awl. Choose from 75+ exotic wood species and metal ferrules. Made to order in the UK.',
  alternates: { canonical: 'https://hashtag.guru/custom-awl' },
}

export default function CustomAwlLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
