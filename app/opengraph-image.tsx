import { ImageResponse } from "next/og";

import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const alt = `${SITE_NAME}: ${SITE_DESCRIPTION}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Social card in the site palette: cream canvas, charcoal text, teal and coral accents.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "#FBF7EE",
          color: "#12232E",
        }}
      >
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ width: 96, height: 16, borderRadius: 8, background: "#00A896" }} />
          <div style={{ width: 48, height: 16, borderRadius: 8, background: "#FF6B6B" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1.05 }}>AI you can question</div>
          <div style={{ fontSize: 36, lineHeight: 1.3, maxWidth: 900 }}>{SITE_DESCRIPTION}</div>
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, color: "#007A6D" }}>aiconsumerrights.org</div>
      </div>
    ),
    size
  );
}
