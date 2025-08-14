// lib/pocketbase.ts
import PocketBase from 'pocketbase';

// Resolve base URL from env (works on client and server)
// Prefer NEXT_PUBLIC_ var so it's embedded in the client bundle,
// with a server-side fallback to POCKETBASE_URL. Default remains local dev.
const baseUrl =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_POCKETBASE_URL) ||
  (typeof process !== 'undefined' && process.env.POCKETBASE_URL) ||
  'http://127.0.0.1:8090';

const pb = new PocketBase(baseUrl);

// Globally disable auto-cancellation
pb.autoCancellation(false);

export default pb;