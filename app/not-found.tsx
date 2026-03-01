import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="font-heading text-6xl font-bold text-brand-orange mb-4">404</h1>
      <p className="text-xl text-zinc-400 mb-8">This page doesn&apos;t exist — but our mallets definitely do.</p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/">
          <Button size="lg">Go Home</Button>
        </Link>
        <Link href="/shop">
          <Button size="lg" variant="outline">Browse Shop</Button>
        </Link>
      </div>
    </div>
  )
}
