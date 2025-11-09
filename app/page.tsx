import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Hammer, Wrench, Coins } from 'lucide-react'

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
              Handcrafted Tools.<br />Precision Engineering.
            </h1>
            <p className="text-xl text-zinc-300 mb-8">
              Custom woodworking mallets, awls, engineering squares, and laser-cut EDC coins. 
              Every piece crafted with passion from exotic materials.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/shop">
                <Button size="lg" className="bg-white text-zinc-900 hover:bg-zinc-100">
                  Browse Shop
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/custom-mallet">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Build Custom Tool
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Shop by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link href="/shop?category=mallets" className="group">
              <div className="bg-zinc-50 rounded-lg p-8 text-center hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-zinc-900 rounded-full mb-4 group-hover:scale-110 transition-transform">
                  <Hammer className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Mallets</h3>
                <p className="text-zinc-600 text-sm">
                  Turned and square mallets for carving, detailing, and framing
                </p>
              </div>
            </Link>

            <Link href="/shop?category=awls" className="group">
              <div className="bg-zinc-50 rounded-lg p-8 text-center hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-zinc-900 rounded-full mb-4 group-hover:scale-110 transition-transform">
                  <Wrench className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Awls & Squares</h3>
                <p className="text-zinc-600 text-sm">
                  Precision marking awls and engineering squares
                </p>
              </div>
            </Link>

            <Link href="/shop?category=coins" className="group">
              <div className="bg-zinc-50 rounded-lg p-8 text-center hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-zinc-900 rounded-full mb-4 group-hover:scale-110 transition-transform">
                  <Coins className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">EDC Coins</h3>
                <p className="text-zinc-600 text-sm">
                  Laser-cut carry coins from exotic materials
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Custom Section */}
      <section className="py-20 bg-zinc-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-6">Custom Tool Builders</h2>
            <p className="text-lg text-zinc-600 mb-12">
              Design your perfect tool with our interactive builders. Choose from 100+ wood species and premium materials.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg p-8 shadow-sm border border-zinc-200">
              <h3 className="text-2xl font-bold mb-3">Custom Mallet Builder</h3>
              <p className="text-zinc-600 mb-6">
                Choose mallet style, head wood, handle wood, and transition material. Over 100 wood species available.
              </p>
              <Link href="/custom-mallet">
                <Button size="lg" className="w-full">
                  Build Mallet
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm border border-zinc-200">
              <h3 className="text-2xl font-bold mb-3">Custom Awl Builder</h3>
              <p className="text-zinc-600 mb-6">
                Select awl style, handle wood, and ferrule material. Perfect for precision marking and detailing work.
              </p>
              <Link href="/custom-awl">
                <Button size="lg" className="w-full">
                  Build Awl
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Commissions Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 text-white rounded-lg p-12">
              <h2 className="text-3xl font-bold mb-4">Custom Commissions</h2>
              <p className="text-zinc-300 mb-6 text-lg">
                Have a specific tool in mind? Join our commission waiting list and let's create something extraordinary together.
              </p>
              <Link href="/commissions">
                <Button size="lg" className="bg-white text-zinc-900 hover:bg-zinc-100">
                  Join Waiting List
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
