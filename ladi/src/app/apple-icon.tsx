import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#faf7f2",
          fontFamily: "Georgia, serif",
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: 130,
          color: "#c97b4d",
          lineHeight: 1,
        }}
      >
        L
      </div>
    ),
    { ...size },
  );
}
