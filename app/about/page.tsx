export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">About #TOOLING</h1>

        <div className="prose prose-zinc max-w-none space-y-6">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">The Craft</h2>
            <p className="text-zinc-600 leading-relaxed">
              Every tool starts as raw material—a piece of exotic hardwood, a length of brass, 
              a sheet of titanium. Through careful turning, precise machining, and laser cutting, 
              these materials transform into tools that will serve craftspeople for decades.
            </p>
            <p className="text-zinc-600 leading-relaxed">
              I make custom woodworking tools with a focus on mallets, awls, and engineering squares. 
              Each piece is designed for function first, with beauty emerging naturally from the 
              quality of materials and precision of execution.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">The Process</h2>
            <p className="text-zinc-600 leading-relaxed">
              <strong>Woodworking:</strong> Mallets and awls are turned on a lathe from carefully 
              selected hardwoods. Each species has unique properties—walnut for its stability, 
              maple for its density, ebony for its weight. The transition materials (copper, bronze, 
              brass, aluminum) add both visual interest and functional balance.
            </p>
            <p className="text-zinc-600 leading-relaxed">
              <strong>Laser Cutting:</strong> Using a fiber laser, I cut intricate designs into 
              exotic metals and materials for EDC carry coins. The precision of laser cutting 
              allows for detail that would be impossible with traditional methods.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Materials</h2>
            <p className="text-zinc-600 leading-relaxed">
              I work with over 100 different wood species, from domestic hardwoods like oak and 
              ash to exotic imports like rosewood and padauk. Metals include copper, bronze, 
              brass, aluminum, and titanium. Every material is chosen for its specific properties 
              and how it will perform in use.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Custom Work</h2>
            <p className="text-zinc-600 leading-relaxed">
              While I maintain a selection of ready-made pieces, the real joy comes from custom 
              commissions. Whether you need a mallet configured to your exact specifications or 
              a completely unique tool design, I'm here to help bring your vision to life.
            </p>
            <p className="text-zinc-600 leading-relaxed">
              Lead times for custom work typically run 4-8 weeks depending on complexity and 
              current queue length. Each commission receives the same attention to detail and 
              quality as my standard pieces.
            </p>
          </section>
        </div>

        <div className="mt-12 p-8 bg-zinc-50 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Get in Touch</h3>
          <p className="text-zinc-600 mb-4">
            Questions about materials, custom work, or technical specifications? 
            I'm always happy to discuss your project.
          </p>
          <Link href="/commissions">
            <Button size="lg">Start a Commission</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

import Link from 'next/link'
import { Button } from '@/components/ui/button'

