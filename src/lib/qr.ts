import QRCode from "qrcode";

export async function generateQRCodeDataURL(data: string, size = 200): Promise<string> {
  return QRCode.toDataURL(data, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: size,
    color: { dark: "#000000", light: "#FFFFFF" },
  });
}

export async function generateQRCodeBuffer(data: string, size = 200): Promise<Buffer> {
  return QRCode.toBuffer(data, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: size,
  });
}

export function buildReceiptUrl(publicId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/receipt/${publicId}`;
}
