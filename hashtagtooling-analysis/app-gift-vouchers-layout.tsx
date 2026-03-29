import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gift Vouchers',
  description: 'Gift vouchers for #TOOLING handcrafted woodworking tools. Available in any amount. The perfect gift for woodworkers.',
  alternates: { canonical: 'https://hashtag.guru/gift-vouchers' },
}

export default function GiftVouchersLayout({ children }: { children: React.ReactNode }) {
  return children
}
