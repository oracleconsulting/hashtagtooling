interface ReviewData {
  customer_name: string;
  rating: number;
  body: string | null;
  created_at: string;
}

interface ProductJsonLdProps {
  name: string;
  description: string;
  price: number;
  image: string;
  url: string;
  availability: "InStock" | "PreOrder" | "SoldOut";
  currency?: string;
  shipping?: { uk: number; europe: number; world: number };
  reviews?: ReviewData[];
  averageRating?: number;
  reviewCount?: number;
}

export function ProductJsonLd({
  name,
  description,
  price,
  image,
  url,
  availability,
  currency = "GBP",
  shipping,
  reviews,
  averageRating,
  reviewCount,
}: ProductJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: description || `Handcrafted by #TOOLING from exotic timber. Made to order in the UK.`,
    image,
    url,
    brand: { "@type": "Brand", name: "#TOOLING" },
    ...(averageRating && reviewCount && reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: averageRating.toFixed(1),
            reviewCount: reviewCount.toString(),
            bestRating: "5",
            worstRating: "1",
          },
        }
      : {}),
    ...(reviews && reviews.length > 0
      ? {
          review: reviews.slice(0, 5).map((r) => ({
            "@type": "Review",
            author: { "@type": "Person", name: r.customer_name },
            datePublished: r.created_at,
            reviewRating: {
              "@type": "Rating",
              ratingValue: r.rating.toString(),
              bestRating: "5",
            },
            ...(r.body ? { reviewBody: r.body } : {}),
          })),
        }
      : {}),
    offers: {
      "@type": "Offer",
      price: price.toFixed(2),
      priceCurrency: currency,
      availability: `https://schema.org/${availability}`,
      seller: { "@type": "Organization", name: "#TOOLING" },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "GB",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 14,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/ReturnShippingFees",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "GB",
        },
        shippingRate: {
          "@type": "MonetaryAmount",
          value: shipping?.uk?.toString() || "15.00",
          currency: "GBP",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 5,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 2,
            maxValue: 5,
            unitCode: "DAY",
          },
        },
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
