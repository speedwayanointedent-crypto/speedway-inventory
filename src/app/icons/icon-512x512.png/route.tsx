import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
          color: "white",
          fontSize: 260,
          fontWeight: 700,
          borderRadius: 80,
          letterSpacing: "-0.05em",
        }}
      >
        SW
      </div>
    ),
    { width: 512, height: 512 }
  );
}
