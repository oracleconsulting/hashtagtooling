export default function ShippingPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Shipping & Delivery</h1>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">UK Shipping</h2>
            <div className="bg-zinc-50 p-6 rounded-lg space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Standard Delivery (Royal Mail)</h3>
                <p className="text-zinc-600">£5.99 - 3-5 business days</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Express Delivery (Royal Mail Special Delivery)</h3>
                <p className="text-zinc-600">£12.99 - Next business day (order before 2pm)</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Free Shipping</h3>
                <p className="text-zinc-600">On orders over £150</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">International Shipping</h2>
            <div className="bg-zinc-50 p-6 rounded-lg space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Europe</h3>
                <p className="text-zinc-600">£15.99 - 5-10 business days</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Rest of World</h3>
                <p className="text-zinc-600">£25.99 - 10-15 business days</p>
              </div>
              <p className="text-sm text-zinc-500 italic">
                Note: International orders may be subject to customs duties and taxes, 
                which are the responsibility of the recipient.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Processing Time</h2>
            <div className="bg-zinc-50 p-6 rounded-lg">
              <ul className="space-y-3 text-zinc-600">
                <li className="flex gap-3">
                  <span className="font-semibold text-zinc-900 w-32">In Stock Items:</span>
                  <span>Ships within 1-2 business days</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-zinc-900 w-32">Made to Order:</span>
                  <span>2-3 weeks production + shipping time</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-zinc-900 w-32">Custom Orders:</span>
                  <span>3-4 weeks production + shipping time</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-zinc-900 w-32">Commissions:</span>
                  <span>4-8 weeks (varies by complexity)</span>
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Packaging</h2>
            <p className="text-zinc-600 mb-4">
              Each tool is carefully wrapped and packaged to ensure it arrives in perfect condition. 
              I use sustainable packaging materials wherever possible.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Tracking</h2>
            <p className="text-zinc-600 mb-4">
              All orders include tracking information. You'll receive an email with your tracking 
              number once your order ships.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Returns & Exchanges</h2>
            <div className="bg-zinc-50 p-6 rounded-lg">
              <p className="text-zinc-600 mb-4">
                I stand behind the quality of every tool. If you're not completely satisfied:
              </p>
              <ul className="space-y-2 text-zinc-600 list-disc list-inside">
                <li>30-day return window for standard items</li>
                <li>Items must be unused and in original condition</li>
                <li>Custom orders and commissions are non-refundable (due to their bespoke nature)</li>
                <li>Return shipping costs are the responsibility of the customer unless the item is defective</li>
              </ul>
              <p className="text-zinc-600 mt-4">
                Email me to initiate a return or discuss any concerns.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

