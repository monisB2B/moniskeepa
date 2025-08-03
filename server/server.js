import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { gunzipSync } from 'zlib';

dotenv.config();

const app = express();
const PORT = 4000;
const KEEPA_KEY = process.env.KEEPA_KEY;
const TTL = 15 * 60 * 1000; // 15 minutes

const cache = new Map();
const getCached = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }
  return entry.value;
};
const setCache = (key, value) => {
  cache.set(key, { value, expiry: Date.now() + TTL });
};

app.get('/api/bestsellers', async (req, res) => {
  const cached = getCached('bestsellers');
  if (cached) return res.json(cached);
  try {
    const url = `https://api.keepa.com/bestSellers?key=${KEEPA_KEY}&domain=1&category=19700930011`;
    const response = await fetch(url, { headers: { 'Accept-Encoding': 'gzip' } });
    const buffer = Buffer.from(await response.arrayBuffer());
    const json = JSON.parse(gunzipSync(buffer).toString());
    const list = json.bestSellersList || [];
    const data = list.map((asin, idx) => ({ rank: idx + 1, asin }));
    setCache('bestsellers', data);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch best sellers' });
  }
});

app.get('/api/product/:asin', async (req, res) => {
  const asin = req.params.asin;
  const cacheKey = `product:${asin}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);
  try {
    const url = `https://api.keepa.com/product?key=${KEEPA_KEY}&domain=1&asin=${asin}&history=1&stats=90`;
    const response = await fetch(url, { headers: { 'Accept-Encoding': 'gzip' } });
    const buffer = Buffer.from(await response.arrayBuffer());
    const json = JSON.parse(gunzipSync(buffer).toString());
    const product = json.products?.[0] || {};
    setCache(cacheKey, product);
    res.json(product);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
