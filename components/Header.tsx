'use client'

import Link from 'next/link'
import { ShoppingCart, Menu } from 'lucide-react'
import { useCart } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export function Header() {
  const items = useCart(state => state.items)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <header className="border-b border-zinc-200 bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            #TOOLING
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/shop" className="text-sm font-medium hover:text-zinc-600 transition-colors">
              Shop
            </Link>
            <Link href="/custom-mallet" className="text-sm font-medium hover:text-zinc-600 transition-colors">
              Custom Mallet
            </Link>
            <Link href="/custom-awl" className="text-sm font-medium hover:text-zinc-600 transition-colors">
              Custom Awl
            </Link>
            <Link href="/commissions" className="text-sm font-medium hover:text-zinc-600 transition-colors">
              Commissions
            </Link>
            <Link href="/about" className="text-sm font-medium hover:text-zinc-600 transition-colors">
              About
            </Link>
            <Link href="/cart" className="relative">
              <Button variant="outline" size="sm">
                <ShoppingCart className="h-4 w-4" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-zinc-900 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Button>
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 flex flex-col space-y-4 pb-4">
            <Link href="/shop" className="text-sm font-medium hover:text-zinc-600 transition-colors">
              Shop
            </Link>
            <Link href="/custom-mallet" className="text-sm font-medium hover:text-zinc-600 transition-colors">
              Custom Mallet
            </Link>
            <Link href="/custom-awl" className="text-sm font-medium hover:text-zinc-600 transition-colors">
              Custom Awl
            </Link>
            <Link href="/commissions" className="text-sm font-medium hover:text-zinc-600 transition-colors">
              Commissions
            </Link>
            <Link href="/about" className="text-sm font-medium hover:text-zinc-600 transition-colors">
              About
            </Link>
            <Link href="/cart" className="text-sm font-medium hover:text-zinc-600 transition-colors">
              Cart ({totalItems})
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}



