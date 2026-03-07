import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-brand-dark border-t border-brand-dark-border mt-0">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-heading font-bold mb-4 text-brand-orange">#TOOLING</h3>
            <p className="text-zinc-400 text-sm">
              Handcrafted woodworking tools built from the world's finest exotic timbers. Every piece made with passion and precision.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white">Shop</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><Link href="/shop?category=mallets" className="hover:text-brand-orange transition-colors">Mallets</Link></li>
              <li><Link href="/shop?category=awls" className="hover:text-brand-orange transition-colors">Awls</Link></li>
              <li><Link href="/shop?category=wood" className="hover:text-brand-orange transition-colors">Wood for Sale</Link></li>
              <li><Link href="/shop?category=coins" className="hover:text-brand-orange transition-colors">EDC Coins</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white">Custom</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><Link href="/custom-mallet" className="hover:text-brand-orange transition-colors">Build Your Mallet</Link></li>
              <li><Link href="/custom-awl" className="hover:text-brand-orange transition-colors">Build Your Awl</Link></li>
              <li><Link href="/wood-library" className="hover:text-brand-orange transition-colors">Wood Library</Link></li>
              <li><Link href="/commissions" className="hover:text-brand-orange transition-colors">Commission Work</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white">Info</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><Link href="/about" className="hover:text-brand-orange transition-colors">My Story</Link></li>
              <li><Link href="/gallery" className="hover:text-brand-orange transition-colors">Gallery</Link></li>
              <li><Link href="/contact" className="hover:text-brand-orange transition-colors">Contact</Link></li>
              <li><Link href="/shipping" className="hover:text-brand-orange transition-colors">Shipping</Link></li>
              <li><Link href="/privacy" className="hover:text-brand-orange transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-brand-orange transition-colors">Terms & Conditions</Link></li>
              <li><a href="https://www.instagram.com/hashtagtooling/" target="_blank" rel="noopener noreferrer" className="hover:text-brand-orange transition-colors">Instagram</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-brand-dark-border mt-8 pt-8 text-center text-sm text-zinc-500">
          <p>&copy; {new Date().getFullYear()} #TOOLING. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
