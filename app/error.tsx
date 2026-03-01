'use client'

import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="font-heading text-4xl font-bold text-brand-orange mb-4">Something went wrong</h1>
      <p className="text-zinc-400 mb-8">We&apos;re sorry — something unexpected happened. Please try again.</p>
      <Button onClick={reset} size="lg">
        Try Again
      </Button>
    </div>
  )
}
