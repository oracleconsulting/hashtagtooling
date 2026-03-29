import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Referral Programme',
  description: 'Refer a friend to #TOOLING and earn rewards. Share the love of handcrafted exotic timber tools.',
  alternates: { canonical: 'https://hashtag.guru/referrals' },
}

export default function ReferralsLayout({ children }: { children: React.ReactNode }) {
  return children
}
