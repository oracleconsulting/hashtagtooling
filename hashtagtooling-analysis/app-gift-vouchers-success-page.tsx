'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  return (
    <div className="container mx-auto px-4 py-20 max-w-lg text-center">
      <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
      <h1 className="font-heading text-4xl font-bold text-white mb-3">Voucher Sent!</h1>
      <p className="text-zinc-400 text-lg mb-4">
        Your payment was successful. The gift voucher email is on its way to the recipient.
      </p>
      <p className="text-zinc-500 text-sm mb-10">
        It may take a minute to arrive. Check your junk folder if it doesn&apos;t appear.
        {sessionId && (
          <span className="block mt-1 text-zinc-600 font-mono text-xs">Ref: {sessionId.slice(-12)}</span>
        )}
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link href="/shop">
          <Button size="lg">Browse the Shop</Button>
        </Link>
        <Link href="/gift-vouchers">
          <Button size="lg" variant="outline">Buy Another Voucher</Button>
        </Link>
      </div>
    </div>
  )
}

export default function GiftVoucherSuccessPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-20 text-center text-zinc-400">Loading…</div>}>
      <SuccessContent />
    </Suspense>
  )
}
