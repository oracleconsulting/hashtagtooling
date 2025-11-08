import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-zinc-900 text-white mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">#TOOLING</h3>
            <p className="text-zinc-400 text-sm">
              Handcrafted woodworking tools and precision laser-cut EDC items. 
              Every piece made with passion and precision.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><Link href="/shop?category=mallets" className="hover:text-white transition-colors">Mallets</Link></li>
              <li><Link href="/shop?category=awls" className="hover:text-white transition-colors">Awls</Link></li>
              <li><Link href="/shop?category=squares" className="hover:text-white transition-colors">Engineering Squares</Link></li>
              <li><Link href="/shop?category=coins" className="hover:text-white transition-colors">EDC Coins</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Custom</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><Link href="/custom-mallet" className="hover:text-white transition-colors">Build Your Mallet</Link></li>
              <li><Link href="/commissions" className="hover:text-white transition-colors">Commission Work</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Info</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/shipping" className="hover:text-white transition-colors">Shipping</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-800 mt-8 pt-8 text-center text-sm text-zinc-400">
          <p>&copy; {new Date().getFullYear()} #TOOLING. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}



