import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-heading text-4xl font-bold mb-2 text-brand-orange">Contact</h1>
        <p className="text-zinc-400 mb-8">Have questions about products, custom work, or commissions? I'd love to hear from you.</p>

        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-brand-dark-card border border-brand-dark-border p-6 rounded-lg">
              <h3 className="font-semibold mb-2 text-white">Email</h3>
              <p className="text-zinc-400">hello@hashtagtooling.com</p>
            </div>

            <div className="bg-brand-dark-card border border-brand-dark-border p-6 rounded-lg">
              <h3 className="font-semibold mb-2 text-white">Response Time</h3>
              <p className="text-zinc-400">Usually within 24-48 hours</p>
            </div>
          </div>

          <div className="bg-brand-dark-card border border-brand-dark-border p-6 rounded-lg">
            <h3 className="font-semibold mb-4 text-white">Workshop Hours</h3>
            <p className="text-zinc-400 mb-2">I work on orders throughout the week.</p>
            <p className="text-zinc-400">
              For urgent inquiries or custom consultations, email is the best way to reach me.
            </p>
          </div>

          <div className="bg-brand-orange rounded-lg p-8">
            <h3 className="text-xl font-heading font-semibold mb-2 text-brand-dark">Ready to Start a Custom Project?</h3>
            <p className="text-brand-dark/80 mb-4">
              Join the commission waiting list and let's discuss your unique tool requirements.
            </p>
            <Link href="/commissions">
              <Button size="lg" className="bg-brand-dark text-white hover:bg-brand-dark/90">
                Request Commission
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
