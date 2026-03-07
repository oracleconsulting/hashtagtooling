import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'Terms and conditions of sale for #TOOLING handcrafted woodworking tools.',
  alternates: { canonical: 'https://hashtag.guru/terms' },
}

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-heading text-4xl font-bold mb-2 text-brand-orange">Terms & Conditions</h1>
        <p className="text-zinc-400 text-sm mb-8">Last updated: {new Date().toLocaleDateString('en-GB')}</p>

        <div className="space-y-6">
          <section className="bg-brand-dark-card border border-brand-dark-border p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-3">Handmade products</h2>
            <p className="text-zinc-400">
              All products are handmade from natural materials. Slight variations in colour, grain, and dimensions are normal and form part of the unique character of each piece. Images are representative; actual items may vary.
            </p>
          </section>

          <section className="bg-brand-dark-card border border-brand-dark-border p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-3">Pricing and payment</h2>
            <p className="text-zinc-400">
              All prices are in British Pounds (GBP) and include VAT where applicable. Payment is processed via PayPal or Stripe. You are responsible for any customs or import duties if ordering from outside the UK.
            </p>
          </section>

          <section className="bg-brand-dark-card border border-brand-dark-border p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-3">Made to order and custom items</h2>
            <p className="text-zinc-400">
              Made-to-order and custom-built items (including bespoke mallets and awls) are non-refundable once work has begun, unless the item is faulty. By placing a custom order you accept that these items are made to your specification and cannot be returned for a change of mind.
            </p>
          </section>

          <section className="bg-brand-dark-card border border-brand-dark-border p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-3">Returns policy</h2>
            <p className="text-zinc-400">
              For standard (non-custom) items: we offer a 30-day returns policy. Items must be unused, in original condition, and in original packaging where applicable. Return postage is at the customer&apos;s expense unless the item is faulty. Please contact us at hello@hashtagtooling.com before returning any item.
            </p>
          </section>

          <section className="bg-brand-dark-card border border-brand-dark-border p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-3">Intellectual property</h2>
            <p className="text-zinc-400">
              All content on this website (including text, images, and designs) is the property of #TOOLING and may not be copied, reproduced, or used without prior written permission.
            </p>
          </section>

          <section className="bg-brand-dark-card border border-brand-dark-border p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-3">Limitation of liability</h2>
            <p className="text-zinc-400">
              We are not liable for any indirect, incidental, or consequential loss arising from the use of our products or this website. Our liability is limited to the purchase price of the item in question, except where prohibited by law (e.g. death or personal injury caused by our negligence).
            </p>
          </section>

          <section className="bg-brand-dark-card border border-brand-dark-border p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-3">Governing law</h2>
            <p className="text-zinc-400">
              These terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.
            </p>
          </section>

          <section className="bg-brand-dark-card border border-brand-dark-border p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-3">Contact</h2>
            <p className="text-zinc-400">
              Questions about these terms: <strong className="text-zinc-300">hello@hashtagtooling.com</strong>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
