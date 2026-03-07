'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="font-heading text-4xl font-bold text-brand-orange mb-4">Something went wrong</h1>
      <p className="text-zinc-400 mb-8">We couldn&apos;t load the shop. Please try again.</p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={reset} size="lg">Try Again</Button>
        <Link href="/">
          <Button size="lg" variant="outline">Go Home</Button>
        </Link>
      </div>
    </div>
  )
}
