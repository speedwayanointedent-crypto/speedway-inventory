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
          fontSize: 100,
          fontWeight: 700,
          borderRadius: 32,
          letterSpacing: "-0.05em",
        }}
      >
        SW
      </div>
    ),
    { width: 192, height: 192 }
  );
}
