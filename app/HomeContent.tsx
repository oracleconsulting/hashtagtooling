'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'

export interface SiteImages {
  hero_background: string
  wood_collection: string
  brass_transitions: string
  mallet_lineup: string
}

interface LatestProduct {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  category: string
  stock_status: string
  metadata?: { shipping?: { uk: number; europe: number; world: number } }
}

interface HomeContentProps {
  images: SiteImages
  latestProducts?: LatestProduct[]
  categoryImages?: Record<string, string>
}

const CATEGORIES = [
  { id: 'mallet', name: 'Mallets', href: '/shop?category=mallets', desc: 'Turned and square mallets from exotic timbers' },
  { id: 'awl', name: 'Awls', href: '/shop?category=awls', desc: 'Precision marking awls with hand-turned ferrules' },
  { id: 'wood', name: 'Wood for Sale', href: '/shop?category=wood', desc: 'Premium exotic timber blanks and offcuts' },
  { id: 'coin', name: 'EDC Coins', href: '/shop?category=coins', desc: 'Laser-cut carry coins from exotic materials' },
]

export default function HomeContent({ images, latestProducts = [], categoryImages = {} }: HomeContentProps) {
  return (
    <div>
      <section className="relative min-h-[80vh] flex items-center bg-brand-dark overflow-hidden">
        {images.hero_background && (
          <Image
            src={images.hero_background}
            alt="Workshop"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/90 to-brand-dark/60" />
        <div className="container mx-auto px-4 py-24 relative z-10">
          <div className="max-w-3xl">
            <h1 className="font-heading text-5xl md:text-7xl font-bold mb-6 tracking-tight">
              <span className="text-brand-orange">THE HASHTAG</span>
              <br />
              <span className="text-white">MALLET</span>
            </h1>
            <p className="text-xl text-zinc-300 mb-4 leading-relaxed max-w-2xl">
              Unique amongst the world of handmade tools. Constructed from the world&apos;s finest timbers, meticulously chosen based on their density, hardness and strength.
            </p>
            <p className="text-lg text-zinc-400 mb-10 max-w-2xl">
              Each mallet is balanced, finished, and assembled entirely by hand. No two will ever be the same.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/shop">
                <Button size="lg">
                  Browse Shop
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/custom-mallet">
                <Button size="lg" variant="outline">
                  Build Your Custom Mallet
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 min-h-[500px]">
        <div className="bg-brand-light flex items-center p-12 lg:p-20">
          <div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-brand-dark mb-6">WOOD CHOICE</h2>
            <p className="text-zinc-700 mb-4 leading-relaxed">
              The majority of chisel handles tend to be made from Beech, Ash, Cherry or Maple. Whilst these are serviceable, they are generally quite light and soft, requiring a larger mallet to deliver the same force as a smaller, denser piece.
            </p>
            <p className="text-zinc-700 mb-4 leading-relaxed">
              By choosing a material with a high specific gravity you can reduce the size of the mallet whilst retaining the weight, balance and durability.
            </p>
            <p className="text-zinc-700 leading-relaxed">
              The decision to use rare and exotic woods creates something truly unique and bespoke. With over 75 species available, no two mallets will ever be the same.
            </p>
          </div>
        </div>
        <div className="relative bg-brand-dark-card min-h-[400px] lg:min-h-0">
          {images.wood_collection ? (
            <Image
              src={images.wood_collection}
              alt="Collection of exotic wood species"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <p className="text-zinc-500 text-sm italic">Product image — wood collection</p>
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 min-h-[500px]">
        <div className="relative bg-brand-dark-card min-h-[400px] lg:min-h-0 order-2 lg:order-1">
          {images.brass_transitions ? (
            <Image
              src={images.brass_transitions}
              alt="Brass and copper transition materials"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <p className="text-zinc-500 text-sm italic">Product image — brass/copper transitions</p>
            </div>
          )}
        </div>
        <div className="bg-brand-light flex items-center p-12 lg:p-20 order-1 lg:order-2">
          <div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-brand-dark mb-6">THE TRANSITION</h2>
            <p className="text-zinc-700 mb-4 leading-relaxed">
              The metal ring frames the transition from head to handle and provides a focal point for the centre of gravity of the mallet.
            </p>
            <p className="text-zinc-700 mb-6 leading-relaxed">
              Choose between six different metallic accents, making each mallet completely unique. Each mallet also has a matching makers coin set in the end of the handle.
            </p>
            <div className="flex flex-wrap gap-3">
              {['Aluminium', 'Brass', 'Bronze', 'Copper', 'Steel', 'Mokume Gane'].map((metal) => (
                <span key={metal} className="px-3 py-1 bg-brand-dark text-brand-orange text-sm rounded-full">
                  {metal}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-brand-dark py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-brand-orange mb-8 text-center">THE BRASS DOWEL</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <p className="text-zinc-300 mb-4 leading-relaxed">
                  The Brass Dowel adds weight exactly where you want it to be, as well as adding incredible amounts of strength.
                </p>
                <p className="text-zinc-300 mb-4 leading-relaxed">
                  The centre of the dowel is left untouched to ensure that a tight square joint is achieved at the transition point.
                </p>
                <p className="text-zinc-300 leading-relaxed">
                  Every dowel on every mallet is different and is cut and produced specifically with that mallet size and chosen materials in mind to make sure the balance point is right on that transition.
                </p>
              </div>
              <div>
                <p className="text-zinc-300 mb-4 leading-relaxed">
                  The portions of the &apos;tenon&apos; that will be inserted in to the corresponding &apos;mortise&apos; in the head and handle have multiple grooves turned into them. These serve two purposes:
                </p>
                <p className="text-zinc-300 mb-4 leading-relaxed">
                  <span className="text-brand-orange font-semibold">1.</span> They allow for fine adjustment of weight allocation between the head and the handle of the mallet.
                </p>
                <p className="text-zinc-300 leading-relaxed">
                  <span className="text-brand-orange font-semibold">2.</span> They present an increased surface area on which the epoxy resin can create not only a strong chemical bond, but also a strong mechanical bond, ensuring that the mallet head and handle will never come apart during normal use.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 min-h-[400px]">
        <div className="bg-brand-light flex items-center p-12 lg:p-20">
          <div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-brand-dark mb-6">TOTALLY UNIQUE AND PERSONAL</h2>
            <p className="text-zinc-700 mb-4 leading-relaxed">
              With so many material options available and each mallet type completely customisable for size and weight...
            </p>
            <p className="text-zinc-700 text-xl font-heading font-bold">
              No two mallets will ever be the same.
            </p>
          </div>
        </div>
        <div className="relative bg-brand-dark-card min-h-[400px] lg:min-h-0">
          {images.mallet_lineup ? (
            <Image
              src={images.mallet_lineup}
              alt="Row of different handcrafted mallets"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <p className="text-zinc-500 text-sm italic">Product image — row of different mallets</p>
            </div>
          )}
        </div>
      </section>

      {latestProducts.length > 0 && (
        <section className="py-20 bg-brand-dark">
          <div className="container mx-auto px-4">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-center text-brand-orange mb-12">LATEST ADDITIONS</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {latestProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  description={product.description}
                  price={product.price}
                  image_url={product.image_url}
                  category={product.category}
                  stock_status={product.stock_status as 'in_stock' | 'made_to_order' | 'sold' | 'out_of_stock'}
                  metadata={product.metadata}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-20 bg-brand-dark">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-center text-brand-orange mb-12">SHOP BY CATEGORY</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CATEGORIES.map((cat) => {
              const bgImage = categoryImages[cat.id]
              return (
                <Link key={cat.id} href={cat.href} className="group">
                  <div className="relative rounded-lg border border-brand-dark-border overflow-hidden hover:border-brand-orange transition-all h-[200px] flex flex-col justify-center items-center p-8 text-center bg-brand-dark-card">
                    {bgImage ? (
                      <>
                        <Image
                          src={bgImage}
                          alt=""
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-brand-dark/60 to-brand-dark/40" />
                        <div className="relative z-10">
                          <h3 className="text-xl font-heading font-bold text-white mb-2 group-hover:text-brand-orange transition-colors">{cat.name}</h3>
                          <p className="text-zinc-300 text-sm">{cat.desc}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <h3 className="text-xl font-heading font-bold text-white mb-2 group-hover:text-brand-orange transition-colors">{cat.name}</h3>
                        <p className="text-zinc-400 text-sm">{cat.desc}</p>
                      </>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-20 bg-brand-orange">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-brand-dark mb-6">BUILD YOUR PERFECT TOOL</h2>
            <p className="text-brand-dark/80 text-lg mb-10 max-w-2xl mx-auto">
              Use our interactive builders to choose your mallet style, select from over 75 wood species for head and handle, and pick your transition material. Every combination is unique.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/custom-mallet">
                <Button size="lg" className="bg-brand-dark text-white hover:bg-brand-dark/90">
                  Build Custom Mallet
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/custom-awl">
                <Button size="lg" className="bg-brand-dark text-white hover:bg-brand-dark/90">
                  Build Custom Awl
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-brand-dark">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-brand-orange mb-4">CUSTOM COMMISSIONS</h2>
            <p className="text-zinc-300 mb-8 text-lg max-w-2xl mx-auto">
              Have a specific tool in mind? Join the commission waiting list and let&apos;s create something extraordinary together.
            </p>
            <Link href="/commissions">
              <Button size="lg">
                Join Waiting List
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
