import type { Metadata } from 'next'
import CommissionsContent from './CommissionsContent'

export const metadata: Metadata = {
  title: 'Commission Work',
  description: 'Commission a custom handcrafted woodworking tool. Join the waiting list for bespoke mallets, awls, and more from #TOOLING.',
  alternates: { canonical: 'https://hashtag.guru/commissions' },
}

export default function CommissionsPage() {
  return <CommissionsContent />
}
