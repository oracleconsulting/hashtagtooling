import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { BreadcrumbJsonLd } from '@/components/BreadcrumbJsonLd'
import { FAQJsonLd } from '@/components/FAQJsonLd'
import { SquareProfileSVG } from '@/components/SquareProfileSVG'
import { SQUARE_SPECS, BODY_MATERIALS, LASER_TOLERANCE, type SquareSize } from '@/lib/square-profiles'

export const revalidate = 60

const SIZE_KEYS: SquareSize[] = ['chode', '95mm', '125mm', '175mm', '250mm']

const FAQS = [
  {
    question: "What's the difference between Full Scale and T45?",
    answer: 'The Full Scale variant has a standard graduated reference edge for direct measurement. The T45 has a 45° reference edge — purpose-built for checking and referencing hand-planed chamfers on workbench edges, table tops, and cabinet components. Same body and liner, different scale geometry.',
  },
  {
    question: 'Why exotic wood scales on an engineering square?',
    answer: "Because precision doesn't have to be purely functional. The scales are the interface between you and the tool — you hold them, you feel the grain, they age with use. Exotic timbers like Cocobolo, Ziricote, and Ebony are dense, stable, and naturally oily, which makes them dimensionally consistent and pleasant to grip. They also look extraordinary against the steel or titanium body.",
  },
  {
    question: 'How precise are these squares?',
    answer: `The body is laser-cut from ground flat stock to a tolerance of ±${LASER_TOLERANCE}mm. The pin holes are drilled to 5mm diameter with 2.5mm precision pins. After assembly, each square is checked against a reference edge before shipping. These are workshop reference tools — not decorative objects.`,
  },
  {
    question: "What's the chamfer for?",
    answer: "Every corner chamfer is cut at 45° and scales with the square — 2mm on the Chode, up to 6mm on the 250mm. They're not decorative. They're designed to sit flush against a hand-planed chamfer on a workbench edge, giving you a reference point you can feel as well as see. On the T45 variant, the chamfer works with the 45° scale to give you a complete chamfer-checking system.",
  },
  {
    question: 'Can I get a matching set?',
    answer: 'Absolutely. Use the configurator to build each size with the same scale wood, liner metal, and body material for a matched set. Or mix it up — different woods for different sizes. Each square is made individually, so matching sets take a little longer.',
  },
]

const LINER_METALS = [
  { name: 'Brass', color: '#C8963E', desc: 'Warm gold tone, traditional choice' },
  { name: 'Bronze', color: '#A0764A', desc: 'Deeper, richer tone with a vintage feel' },
  { name: 'Copper', color: '#D4764E', desc: 'Bright warmth that develops a patina over time' },
]

export default function EngineeringSquaresPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://hashtag.guru' },
          { name: 'Engineering Squares', url: 'https://hashtag.guru/engineering-squares' },
        ]}
      />
      <FAQJsonLd faqs={FAQS} />

      {/* Hero */}
      <section className="relative bg-brand-dark overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none flex items-center justify-center gap-8">
          {SIZE_KEYS.map((sk) => (
            <div key={sk} className="flex-shrink-0" style={{ width: `${SQUARE_SPECS[sk].width * 1.2}px`, maxWidth: '22%' }}>
              <SquareProfileSVG size={sk} bodyColor="#E27B35" showHoles={false} opacity={1} />
            </div>
          ))}
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <h1 className="font-heading text-5xl md:text-7xl font-bold mb-6 tracking-tight">
              <span className="text-brand-orange">ENGINEERING</span>
              <br />
              <span className="text-white">SQUARES</span>
            </h1>
            <p className="text-xl text-zinc-300 mb-4 leading-relaxed max-w-2xl">
              Laser-cut precision. Dressed in exotic timber.
            </p>
            <p className="text-lg text-zinc-400 mb-10 max-w-2xl">
              Five sizes. Tool steel or titanium bodies. 75+ wood species for scales.
              Brass, bronze, or copper liners. ±{LASER_TOLERANCE}mm tolerance. Made to order in the UK.
            </p>
            <Link href="/custom-square">
              <Button size="lg">
                Build Your Own
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Construction */}
      <section className="py-20 bg-brand-dark">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-brand-orange mb-8 text-center">
              THREE LAYERS. ZERO COMPROMISE.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="text-center p-6 rounded-lg border border-brand-dark-border bg-brand-dark-card">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#555555' }}>
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <h3 className="text-white font-semibold mb-2">Body</h3>
                <p className="text-zinc-400 text-sm">Laser-cut tool steel or aerospace-grade titanium. The precision core.</p>
              </div>
              <div className="text-center p-6 rounded-lg border border-brand-dark-border bg-brand-dark-card">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#C8963E' }}>
                  <span className="text-2xl font-bold text-brand-dark">2</span>
                </div>
                <h3 className="text-white font-semibold mb-2">Liner</h3>
                <p className="text-zinc-400 text-sm">Brass, bronze, or copper. Adds weight, rigidity, and a flash of metal at the edges.</p>
              </div>
              <div className="text-center p-6 rounded-lg border border-brand-dark-border bg-brand-dark-card">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#8B6914' }}>
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <h3 className="text-white font-semibold mb-2">Scales</h3>
                <p className="text-zinc-400 text-sm">Exotic timber or woven carbon fibre. Where you make it yours.</p>
              </div>
            </div>

            <p className="text-zinc-300 text-center max-w-3xl mx-auto leading-relaxed">
              Each square is a precision sandwich. The body is laser-cut from ground flat stock tool steel
              or aerospace-grade titanium to a tolerance of ±{LASER_TOLERANCE}mm. The liner adds weight, rigidity,
              and a flash of metal at the edges. The scales are where you make it yours — choose from 75+ exotic
              timber species or woven carbon fibre.
            </p>
          </div>
        </div>
      </section>

      {/* The Range */}
      <section className="py-20 bg-brand-dark border-t border-brand-dark-border">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-brand-orange mb-4 text-center">
            FIVE SIZES. EVERY CHAMFER INTENTIONAL.
          </h2>
          <p className="text-zinc-400 text-center max-w-2xl mx-auto mb-12">
            Every corner chamfer is cut at 45° and scales with the square — 2mm on the Chode, up to 6mm on the 250mm.
            They sit flush against a hand-planed chamfer on a workbench edge, giving you a reference point you can feel as well as see.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {SIZE_KEYS.map((sk) => {
              const spec = SQUARE_SPECS[sk]
              return (
                <div key={sk} className="bg-brand-dark-card border border-brand-dark-border rounded-lg p-6 text-center hover:border-brand-orange/50 transition-colors">
                  <div className="mb-4 h-24 flex items-center justify-center">
                    <SquareProfileSVG size={sk} bodyColor="#E27B35" showHoles showDimensions={false} />
                  </div>
                  <h3 className="text-white font-heading font-bold text-lg mb-1">{spec.label}</h3>
                  <p className="text-zinc-500 text-xs mb-2">{spec.width}mm × {spec.height}mm</p>
                  <p className="text-zinc-500 text-xs mb-3">{spec.chamfer}mm chamfer — {spec.holes} pins</p>
                  <p className="text-zinc-400 text-sm">{spec.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Materials */}
      <section className="py-20 bg-brand-dark border-t border-brand-dark-border">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-brand-orange mb-12 text-center">MATERIALS</h2>

          <div className="max-w-5xl mx-auto space-y-16">
            {/* Body Materials */}
            <div>
              <h3 className="text-white font-semibold text-xl mb-6">Body</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {BODY_MATERIALS.map((mat) => (
                  <div key={mat.id} className="p-6 rounded-lg border border-brand-dark-border bg-brand-dark-card">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full border border-zinc-600" style={{ backgroundColor: mat.color }} />
                      <h4 className="text-white font-medium">{mat.label}</h4>
                    </div>
                    <p className="text-zinc-400 text-sm">{mat.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Liner Materials */}
            <div>
              <h3 className="text-white font-semibold text-xl mb-6">Liner</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {LINER_METALS.map((liner) => (
                  <div key={liner.name} className="p-6 rounded-lg border border-brand-dark-border bg-brand-dark-card text-center">
                    <div className="w-12 h-12 rounded-full border border-zinc-600 mx-auto mb-3" style={{ backgroundColor: liner.color }} />
                    <h4 className="text-white font-medium mb-1">{liner.name}</h4>
                    <p className="text-zinc-400 text-xs">{liner.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Carbon Fibre */}
            <div className="p-6 rounded-lg border border-brand-dark-border bg-brand-dark-card">
              <h3 className="text-white font-semibold text-xl mb-3">Carbon Fibre Scales</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Woven carbon fibre at 1mm thickness offers a modern, industrial aesthetic with exceptional
                dimensional stability. Because the scale is thinner, the liner thickness is increased from 1mm
                to 2.5mm to maintain structural integrity. The result is a square that feels slightly heavier
                in the hand with more metal showing at the edges.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Specs */}
      <section className="py-20 bg-brand-dark border-t border-brand-dark-border">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-brand-orange mb-12 text-center">TECHNICAL SPECIFICATIONS</h2>
          <div className="max-w-4xl mx-auto overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-brand-dark-border">
                  <th className="py-3 px-4 text-zinc-400 font-medium">Spec</th>
                  {SIZE_KEYS.map((sk) => (
                    <th key={sk} className="py-3 px-4 text-zinc-400 font-medium text-center">{SQUARE_SPECS[sk].label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-zinc-300">
                <tr className="border-b border-brand-dark-border/50">
                  <td className="py-3 px-4 text-zinc-400">Width</td>
                  {SIZE_KEYS.map((sk) => <td key={sk} className="py-3 px-4 text-center">{SQUARE_SPECS[sk].width}mm</td>)}
                </tr>
                <tr className="border-b border-brand-dark-border/50">
                  <td className="py-3 px-4 text-zinc-400">Height</td>
                  {SIZE_KEYS.map((sk) => <td key={sk} className="py-3 px-4 text-center">{SQUARE_SPECS[sk].height}mm</td>)}
                </tr>
                <tr className="border-b border-brand-dark-border/50">
                  <td className="py-3 px-4 text-zinc-400">Blade height</td>
                  {SIZE_KEYS.map((sk) => <td key={sk} className="py-3 px-4 text-center">{SQUARE_SPECS[sk].bladeHeight}mm</td>)}
                </tr>
                <tr className="border-b border-brand-dark-border/50">
                  <td className="py-3 px-4 text-zinc-400">Chamfer</td>
                  {SIZE_KEYS.map((sk) => <td key={sk} className="py-3 px-4 text-center">{SQUARE_SPECS[sk].chamfer}mm</td>)}
                </tr>
                <tr className="border-b border-brand-dark-border/50">
                  <td className="py-3 px-4 text-zinc-400">Pin holes</td>
                  {SIZE_KEYS.map((sk) => <td key={sk} className="py-3 px-4 text-center">{SQUARE_SPECS[sk].holes}</td>)}
                </tr>
                <tr className="border-b border-brand-dark-border/50">
                  <td className="py-3 px-4 text-zinc-400">Body thickness</td>
                  {SIZE_KEYS.map((sk) => <td key={sk} className="py-3 px-4 text-center">{SQUARE_SPECS[sk].bodyThickness}mm</td>)}
                </tr>
                <tr className="border-b border-brand-dark-border/50">
                  <td className="py-3 px-4 text-zinc-400">Pin ∅</td>
                  {SIZE_KEYS.map((sk) => <td key={sk} className="py-3 px-4 text-center">{SQUARE_SPECS[sk].pinDiameter}mm</td>)}
                </tr>
                <tr>
                  <td className="py-3 px-4 text-zinc-400">Hole ∅</td>
                  {SIZE_KEYS.map((sk) => <td key={sk} className="py-3 px-4 text-center">{SQUARE_SPECS[sk].holeDiameter}mm</td>)}
                </tr>
              </tbody>
            </table>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="p-3 bg-brand-dark-card rounded border border-brand-dark-border">
                <p className="text-zinc-500 text-xs">Laser tolerance</p>
                <p className="text-white font-medium">±{LASER_TOLERANCE}mm</p>
              </div>
              <div className="p-3 bg-brand-dark-card rounded border border-brand-dark-border">
                <p className="text-zinc-500 text-xs">Standard scale</p>
                <p className="text-white font-medium">2-3mm wood</p>
              </div>
              <div className="p-3 bg-brand-dark-card rounded border border-brand-dark-border">
                <p className="text-zinc-500 text-xs">CF scale</p>
                <p className="text-white font-medium">1mm carbon fibre</p>
              </div>
              <div className="p-3 bg-brand-dark-card rounded border border-brand-dark-border">
                <p className="text-zinc-500 text-xs">Liner thickness</p>
                <p className="text-white font-medium">1mm / 2.5mm (CF)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The T45 */}
      <section className="py-20 bg-brand-dark border-t border-brand-dark-border">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-brand-orange mb-6">THE T45</h2>
            <p className="text-zinc-300 text-lg leading-relaxed mb-4">
              The T45 scale features a 45° reference edge — purpose-built for checking and referencing
              hand-planed chamfers on workbench edges, table tops, and cabinet components.
            </p>
            <p className="text-zinc-400 leading-relaxed">
              Same body, same liner, different scale geometry. Choose T45 in the configurator when you
              need a dedicated chamfer reference tool alongside your standard square.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-brand-orange">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-brand-dark mb-6">BUILD YOUR SQUARE</h2>
            <p className="text-brand-dark/80 text-lg mb-10 max-w-2xl mx-auto">
              Choose your size, body material, scale wood, liner metal, and scale type.
              Every combination is unique. Every square is made to order.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/custom-square">
                <Button size="lg" className="bg-brand-dark text-white hover:bg-brand-dark/90">
                  Build Your Own
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/shop?category=square">
                <Button size="lg" className="bg-brand-dark text-white hover:bg-brand-dark/90">
                  Browse In-Stock Squares
                </Button>
              </Link>
            </div>
            <p className="text-brand-dark/60 text-sm mt-6">
              Pre-launch offer: sign up to the{' '}
              <Link href="/mailing-list" className="underline hover:text-brand-dark">
                mailing list
              </Link>{' '}
              for 10% off your first tool.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-brand-dark">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-heading text-3xl font-bold text-brand-orange mb-12 text-center">
              FREQUENTLY ASKED QUESTIONS
            </h2>
            <div className="space-y-8">
              {FAQS.map((faq) => (
                <div key={faq.question}>
                  <h3 className="text-white font-semibold text-lg mb-2">{faq.question}</h3>
                  <p className="text-zinc-400 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
