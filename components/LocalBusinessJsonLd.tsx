export function LocalBusinessJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: "#TOOLING",
    alternateName: "Hashtag Tooling",
    description:
      "Handcrafted woodworking mallets, awls, and tools made from over 75 species of exotic timber. Custom-built to order in the UK with brass dowel construction.",
    url: "https://hashtag.guru",
    sameAs: ["https://www.instagram.com/hashtagtooling/"],
    address: { "@type": "PostalAddress", addressCountry: "GB" },
    priceRange: "££",
    currenciesAccepted: "GBP",
    paymentAccepted: "PayPal, Credit Card",
    areaServed: {
      "@type": "GeoShape",
      name: "Worldwide",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Handcrafted Woodworking Tools",
      itemListElement: [
        {
          "@type": "OfferCatalog",
          name: "Custom Mallets",
          description:
            "Handcrafted woodworking mallets from 75+ exotic timber species",
        },
        {
          "@type": "OfferCatalog",
          name: "Marking Awls",
          description: "Handcrafted marking awls with exotic wood handles",
        },
      ],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
