import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Join the Workshop — Mailing List',
  description: 'Sign up to the #TOOLING mailing list. Be first to know about new tools, exotic wood drops, and workshop builds. Sign up before launch for 10% off your first tool.',
  alternates: { canonical: 'https://hashtag.guru/mailing-list' },
  openGraph: {
    title: 'Join the Workshop — 10% Off Launch Offer | #TOOLING',
    description: 'Sign up before 30 April for an exclusive 10% off voucher. New tools, wood discoveries, and behind-the-scenes content from the workshop.',
    url: 'https://hashtag.guru/mailing-list',
  },
}

export default function MailingListLayout({ children }: { children: React.ReactNode }) {
  return children
}
