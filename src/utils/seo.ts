/**
 * SEO utilities for generating structured data and meta tags
 */

export interface SchemaProduct {
  id: string;
  name: string;
  price: number;
  currency: string;
  image: string;
  description: string;
  rating: number;
  reviewCount: number;
}

/**
 * Generate Product JSON-LD structured data for search engines
 */
export const generateProductSchema = (product: SchemaProduct) => {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.image,
    description: product.description,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency,
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    },
  };
};

/**
 * Generate Organization JSON-LD for homepage
 */
export const generateOrganizationSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Bhavik",
    url: "https://bhavik.store",
    logo: "https://bhavik.store/logo.png",
    sameAs: [
      "https://twitter.com/bhavik",
      "https://instagram.com/bhavik",
      "https://facebook.com/bhavik",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      email: "support@bhavik.store",
    },
  };
};

/**
 * Insert JSON-LD schema into document head
 */
export const insertSchemaScript = (schema: Record<string, any>) => {
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
};

/**
 * Update meta tags dynamically (for social shares)
 */
export const updateMetaTags = (options: {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}) => {
  if (options.title) {
    document.title = options.title;
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", options.title);
  }

  if (options.description) {
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", options.description);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", options.description);
  }

  if (options.image) {
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) ogImage.setAttribute("content", options.image);
  }

  if (options.url) {
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute("href", options.url);
  }
};
