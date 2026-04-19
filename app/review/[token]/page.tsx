import type { Metadata } from 'next'
import ReviewForm from './ReviewForm'

export const metadata: Metadata = {
  title: 'Leave a Review | #TOOLING',
  description: 'Share your experience with your #TOOLING piece.',
  robots: { index: false, follow: false },
}

interface Props {
  params: Promise<{ token: string }>
}

export default async function ReviewPage({ params }: Props) {
  const { token } = await params
  return <ReviewForm token={token} />
}
