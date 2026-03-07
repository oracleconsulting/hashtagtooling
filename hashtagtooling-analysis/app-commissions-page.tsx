import type { Metadata } from 'next'
import CommissionsContent from './CommissionsContent'

export const metadata: Metadata = {
  title: 'Commission Work',
  description: 'Commission a custom handcrafted woodworking tool. Join the waiting list for bespoke mallets, awls, and more from #TOOLING.',
}

export default function CommissionsPage() {
  return <CommissionsContent />
}
