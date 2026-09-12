import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Private build form | #TOOLING',
  robots: { index: false, follow: false },
}

export default function InterestBuildLockedPage() {
  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="text-brand-orange text-sm font-medium uppercase tracking-widest mb-3">
          Invite only
        </p>
        <h1 className="font-heading text-3xl font-bold text-white mb-4">This build form is private</h1>
        <p className="text-zinc-400">
          If you put your name down, I&apos;ll email you a personal link. That link is the only way in.
        </p>
      </div>
    </div>
  )
}
