import Link from 'next/link'

export default function BalanceSuccessPage() {
  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="text-6xl mb-4">✓</div>
        <h1 className="text-3xl font-bold text-white mb-3">Balance received</h1>
        <p className="text-zinc-300 mb-6">
          Thank you. Your order is now in the shipping queue and you&apos;ll receive
          tracking info by email shortly.
        </p>
        <Link href="/" className="text-brand-orange underline text-sm">Back to homepage</Link>
      </div>
    </div>
  )
}
