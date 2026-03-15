import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BreadcrumbJsonLd } from '@/components/BreadcrumbJsonLd'

export const metadata: Metadata = {
  title: 'My Story',
  description: "The story behind #TOOLING — how a house renovation led to crafting the world's finest woodworking mallets from exotic timbers.",
  alternates: { canonical: 'https://hashtag.guru/about' },
}

export default function AboutPage() {
  return (
    <>
    <BreadcrumbJsonLd items={[
      { name: 'Home', url: 'https://hashtag.guru' },
      { name: 'My Story', url: 'https://hashtag.guru/about' },
    ]} />
    <div>
      {/* Hero */}
      <section className="bg-brand-dark py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-heading text-5xl md:text-6xl font-bold text-brand-orange mb-4">MY STORY</h1>
            <p className="text-zinc-400 text-lg">What You Need To Know</p>
          </div>
        </div>
      </section>

      {/* Story Section 1 */}
      <section className="bg-brand-dark-card py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-6 text-zinc-300 text-center leading-relaxed">
            <p>
              I have always learned best by doing, and to that end I have always been keen to try my hand at anything and everything...
            </p>
            <p>
              One thing I hate is having to say 'I can't' or 'I don't know' so I endeavour every day to ensure i am bettering myself and absorbing knowledge to ensure that I know more today than I did yesterday but less than I will ultimately know tomorrow.
            </p>
            <p>
              DIY has always been something I have been reticent to engage contractors for, and wherever possible, throughout my life, I have tried my hand at any and all household tasks...to varying degrees of success...
            </p>
            <p>
              I guess this is where my inherent creativity and desire to work with my hands has laid dormant until now...
            </p>
          </div>
        </div>
      </section>

      {/* Story Section 2 - Orange background */}
      <section className="bg-brand-orange py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-brand-dark mb-8 text-center">ABOUT HASHTAGTOOLING</h2>
            <p className="font-semibold text-brand-dark/90 text-center mb-8">The unexpected beginning...</p>
            <div className="space-y-6 text-brand-dark/80 text-center leading-relaxed">
              <p>
                Woodworking was not something I had dreamed of doing all my life, and making mallets is something I had never even considered until June 2020.
              </p>
              <p>
                I was part of a woodworking after school club when I was 7, and when I was 9 me and my dad made a dagger board from scratch for my Optimist Dinghy. Even at that young age, every winter I would strip that boat down, sand it inside and out and then refinish it and prep it ready for the new season...a habit I carried through my entire sailing career, even to this day!
              </p>
              <p>
                In secondary school, if given the choice, I would always go for a woodworking project in DT, but when we got introduced to electronics I took a shining to that and from the age of 16 I barely touched any form of woodworking at all.
              </p>
              <p>
                I have always considered myself a 'creative' though, and with my day job being more practical and quantitative, I needed to find myself a creative outlet before I lost my mind.
              </p>
              <p>
                It started with a house renovation, grew to building a new 'man shed' and then totally went mad when I decided to extend my 3 car garage and turn it in to a full blown workshop.
              </p>
              <p>
                I tried making mallets after seeing some woodworking videos on youtube and thought they could be a great way to make some extra money. The only problem is that they were garbage, like utter garbage, so I gave up making mallets entirely. And then one out of the blue interaction, someone asking if I would make them a mallet similar to one I had made for myself, just as a bit of fun, led me down the path I currently find myself on today!!
              </p>
              <p className="text-brand-dark font-semibold text-lg">
                I am always looking to push towards perfection and I thrive upon making the most unique hand tools money can buy.
              </p>
              <p className="text-brand-dark font-bold text-xl">
                I now won't rest until my mallets are considered the very best in the world!!
              </p>
              <p>
                And I cannot wait to show you all the wonderful ideas I have and hopefully entice you to join the Hashtag family...
              </p>
              <p className="italic">
                This is my journey, thank you for coming along for the ride...
              </p>
            </div>
            <div className="text-center mt-10">
              <a href="https://www.instagram.com/hashtagtooling/" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="bg-brand-dark text-white hover:bg-brand-dark/90">
                  Come and Follow Along on Instagram
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Commission CTA */}
      <section className="bg-brand-dark py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="font-heading text-2xl font-bold text-brand-orange mb-4">Get in Touch</h3>
            <p className="text-zinc-400 mb-6">
              Questions about materials, custom work, or technical specifications? I'm always happy to discuss your project.
            </p>
            <Link href="/commissions">
              <Button size="lg">Start a Commission</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
    </>
  )
}
