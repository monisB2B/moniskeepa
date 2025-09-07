import fs from 'fs/promises';
import fetch from 'node-fetch';
import { gunzipSync } from 'zlib';
import dotenv from 'dotenv';

dotenv.config();

const KEEPA_KEY = process.env.KEEPA_KEY;
const INPUT = process.argv[2] || 'asins.txt';
const OUTPUT = process.argv[3] || 'products.jsonl';
const CHUNK_SIZE = 100; // Keepa allows up to 100 ASINs per request

async function fetchProducts(asins) {
  const url = `https://api.keepa.com/product?key=${KEEPA_KEY}&domain=1&asin=${asins.join(',')}&history=1&stats=90`;
  const response = await fetch(url, { headers: { 'Accept-Encoding': 'gzip' } });
  const buffer = Buffer.from(await response.arrayBuffer());
  const json = JSON.parse(gunzipSync(buffer).toString());
  return json.products || [];
}

(async () => {
  if (!KEEPA_KEY) {
    console.error('Missing KEEPA_KEY env var');
    process.exit(1);
  }

  const text = await fs.readFile(INPUT, 'utf8').catch(() => null);
  if (!text) {
    console.error(`Input file not found: ${INPUT}`);
    process.exit(1);
  }

  const asins = text.split(/\s+/).filter(Boolean);
  const handle = await fs.open(OUTPUT, 'w');

  for (let i = 0; i < asins.length; i += CHUNK_SIZE) {
    const slice = asins.slice(i, i + CHUNK_SIZE);
    console.log(`Fetching ${i + 1}-${i + slice.length} of ${asins.length}`);
    const products = await fetchProducts(slice);
    for (const product of products) {
      await handle.write(`${JSON.stringify(product)}\n`);
    }
  }

  await handle.close();
  console.log(`Done. Wrote to ${OUTPUT}`);
})();

