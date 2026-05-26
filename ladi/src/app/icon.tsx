import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
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
          fontSize: 380,
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
