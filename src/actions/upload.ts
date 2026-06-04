"use server";

import { v2 as cloudinary } from "cloudinary";
import { requireAuth } from "@/lib/session";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(formData: FormData): Promise<{
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}> {
  await requireAuth();

  const file = formData.get("file") as File | null;
  if (!file) return { success: false, error: "No file provided" };

  if (!file.type.startsWith("image/")) {
    return { success: false, error: "File must be an image" };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: "Image must be under 5MB" };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const dataUri = `data:${file.type};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "speedway/products",
      resource_type: "image",
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    });

    return { success: true, url: result.secure_url, publicId: result.public_id };
  } catch (err) {
    console.error("Cloudinary upload failed", err);
    return { success: false, error: "Upload failed" };
  }
}

export async function deleteImage(publicId: string) {
  await requireAuth();
  try {
    await cloudinary.uploader.destroy(publicId);
    return { success: true };
  } catch (err) {
    console.error("Cloudinary delete failed", err);
    return { success: false, error: "Delete failed" };
  }
}
