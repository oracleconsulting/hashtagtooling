export function LocalBusinessJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "#TOOLING",
    description: "Handcrafted woodworking tools from exotic timbers",
    url: "https://hashtag.guru",
    sameAs: ["https://www.instagram.com/hashtagtooling/"],
    address: { "@type": "PostalAddress", addressCountry: "GB" },
    priceRange: "££",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
