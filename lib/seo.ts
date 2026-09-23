import type { Metadata } from "next";

import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

// A page that sets its own openGraph replaces the layout's, image included,
// so every page builds its metadata here to keep the share image.
const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${SITE_NAME}: ${SITE_DESCRIPTION}`,
};

export function pageMetadata({
  title,
  description,
  path,
  type = "website",
}: {
  title: string;
  description: string;
  path: `/${string}`;
  type?: "website" | "article";
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      siteName: SITE_NAME,
      locale: "en_US",
      title,
      description,
      url: path,
      images: [OG_IMAGE],
    },
    twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE.url] },
  };
}
