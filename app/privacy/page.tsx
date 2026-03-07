import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for #TOOLING. How we collect, use, and protect your data.',
  alternates: { canonical: 'https://hashtag.guru/privacy' },
}

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-heading text-4xl font-bold mb-2 text-brand-orange">Privacy Policy</h1>
        <p className="text-zinc-400 text-sm mb-8">Last updated: {new Date().toLocaleDateString('en-GB')}</p>

        <div className="space-y-6">
          <section className="bg-brand-dark-card border border-brand-dark-border p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-3">What data we collect</h2>
            <p className="text-zinc-400 mb-2">
              We collect information you provide when placing an order or submitting a commission or contact form:
            </p>
            <ul className="list-disc list-inside text-zinc-400 space-y-1 ml-2">
              <li>Name and email address</li>
              <li>Shipping address (for orders)</li>
              <li>Project details and preferences (for commissions)</li>
            </ul>
            <p className="text-zinc-400 mt-3">
              Payment data (card details) is processed directly by PayPal and/or Stripe. We do not store your full card number or CVV on our servers.
            </p>
          </section>

          <section className="bg-brand-dark-card border border-brand-dark-border p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-3">Cookies and local storage</h2>
            <p className="text-zinc-400 mb-2">
              We use the following to provide and improve your experience:
            </p>
            <ul className="list-disc list-inside text-zinc-400 space-y-1 ml-2">
              <li><strong className="text-zinc-300">Cart persistence</strong> — Your cart is stored in your browser (localStorage) so it is remembered between visits.</li>
              <li><strong className="text-zinc-300">Admin session</strong> — If you log in to the admin area, we use session storage to keep you logged in during your visit.</li>
              <li><strong className="text-zinc-300">Cookie consent</strong> — We may store your consent preference for the use of cookies.</li>
            </ul>
            <p className="text-zinc-400 mt-3">
              We do not use third-party advertising cookies. Any analytics we use would be described here and can be opted out of where applicable.
            </p>
          </section>

          <section className="bg-brand-dark-card border border-brand-dark-border p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-3">Data retention</h2>
            <p className="text-zinc-400">
              Order and commission data is retained for as long as needed for order fulfilment, accounting, and legal compliance. Contact form messages are retained until we have responded and the matter is resolved, unless we are required to keep them longer.
            </p>
          </section>

          <section className="bg-brand-dark-card border border-brand-dark-border p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-3">Your rights (GDPR)</h2>
            <p className="text-zinc-400 mb-2">
              If you are in the UK or EEA, you have the right to:
            </p>
            <ul className="list-disc list-inside text-zinc-400 space-y-1 ml-2">
              <li><strong className="text-zinc-300">Access</strong> — Request a copy of the personal data we hold about you.</li>
              <li><strong className="text-zinc-300">Rectification</strong> — Ask us to correct inaccurate data.</li>
              <li><strong className="text-zinc-300">Erasure</strong> — Request deletion of your data, subject to legal and contractual requirements.</li>
              <li><strong className="text-zinc-300">Restriction</strong> — Ask us to restrict processing in certain circumstances.</li>
              <li><strong className="text-zinc-300">Portability</strong> — Receive your data in a structured, machine-readable format where applicable.</li>
            </ul>
            <p className="text-zinc-400 mt-3">
              To exercise these rights or ask any question about your data, contact us at{' '}
              <a href="mailto:hello@hashtagtooling.com" className="text-brand-orange hover:underline">
                hello@hashtagtooling.com
              </a>.
            </p>
          </section>

          <section className="bg-brand-dark-card border border-brand-dark-border p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-3">Contact</h2>
            <p className="text-zinc-400">
              For privacy-related questions or requests: <strong className="text-zinc-300">hello@hashtagtooling.com</strong>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
