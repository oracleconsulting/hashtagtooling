import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-24 text-center">
      <h1 className="font-heading text-6xl font-bold text-brand-orange mb-4">404</h1>
      <p className="text-zinc-400 text-lg mb-8">Page not found</p>
      <Link href="/">
        <Button size="lg">Back to Home</Button>
      </Link>
    </div>
  )
}
