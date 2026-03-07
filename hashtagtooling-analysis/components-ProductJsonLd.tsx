interface ProductJsonLdProps {
  name: string;
  description: string;
  price: number;
  image: string;
  url: string;
  availability: "InStock" | "PreOrder" | "SoldOut";
  currency?: string;
}

export function ProductJsonLd({
  name,
  description,
  price,
  image,
  url,
  availability,
  currency = "GBP",
}: ProductJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image,
    url,
    brand: { "@type": "Brand", name: "#TOOLING" },
    offers: {
      "@type": "Offer",
      price: price.toFixed(2),
      priceCurrency: currency,
      availability: `https://schema.org/${availability}`,
      seller: { "@type": "Organization", name: "#TOOLING" },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
