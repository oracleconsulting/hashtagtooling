export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-zinc-600 mb-8">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <Link href="/">
          <Button size="lg">Back to Home</Button>
        </Link>
      </div>
    </div>
  )
}

import Link from 'next/link'
import { Button } from '@/components/ui/button'

