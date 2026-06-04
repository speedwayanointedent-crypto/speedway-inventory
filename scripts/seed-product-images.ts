/* eslint-disable @typescript-eslint/no-require-imports */
if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not set.");
  process.exit(1);
}

import { connectDB } from "../src/lib/db";
import { Product } from "../src/models";

async function seedProductImages() {
  await connectDB();

  const products = await Product.find({ $or: [{ images: [] }, { images: { $exists: false } }] });

  if (products.length === 0) {
    console.log("All products already have images.");
    process.exit(0);
  }

  let updated = 0;
  for (const p of products) {
    const seed = encodeURIComponent(p.name || p.productCode);
    const url = `https://picsum.photos/seed/${seed}/400/400`;
    await Product.updateOne({ _id: p._id }, { $set: { images: [url] } });
    updated++;
    console.log(`  [${updated}/${products.length}] ${p.name} -> ${url}`);
  }

  console.log(`\nDone. Updated ${updated} product(s) with placeholder images.`);
  process.exit(0);
}

seedProductImages().catch((err) => {
  console.error(err);
  process.exit(1);
});
