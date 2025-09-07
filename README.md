# Amazon Renewed Best Sellers

Displays Amazon Renewed smartphone best-seller ranks using the Keepa API.

## Setup

```bash
npm install
npm run dev
```

- Server: http://localhost:4000  
- Client: http://localhost:5173

## Build

```bash
npm run build
```

## Bulk product data fetch

Create a text file `server/asins.txt` with one ASIN per line and ensure
`KEEPA_KEY` is defined in your environment. Then run:

```bash
npm run fetch --prefix server
```

The script retrieves product data in batches of 100 ASINs and writes each
JSON object to `server/products.jsonl`.
