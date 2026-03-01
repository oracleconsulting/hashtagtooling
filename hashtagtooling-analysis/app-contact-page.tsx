export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Contact</h1>

        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Get in Touch</h2>
            <p className="text-zinc-600 mb-6">
              Have questions about products, custom work, or commissions? I'd love to hear from you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-zinc-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-2">Email</h3>
              <p className="text-zinc-600">hello@hashtagtooling.com</p>
            </div>

            <div className="bg-zinc-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-2">Response Time</h3>
              <p className="text-zinc-600">Usually within 24-48 hours</p>
            </div>
          </div>

          <div className="bg-zinc-50 p-6 rounded-lg">
            <h3 className="font-semibold mb-4">Workshop Hours</h3>
            <p className="text-zinc-600 mb-2">I work on orders throughout the week.</p>
            <p className="text-zinc-600">
              For urgent inquiries or custom consultations, email is the best way to reach me.
            </p>
          </div>

          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 text-white rounded-lg p-8">
            <h3 className="text-xl font-semibold mb-2">Ready to Start a Custom Project?</h3>
            <p className="text-zinc-300 mb-4">
              Join the commission waiting list and let's discuss your unique tool requirements.
            </p>
            <Link href="/commissions">
              <Button size="lg" className="bg-white text-zinc-900 hover:bg-zinc-100">
                Request Commission
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

import Link from 'next/link'
import { Button } from '@/components/ui/button'



