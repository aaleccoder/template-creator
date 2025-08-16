import PocketBase from 'pocketbase';

const baseUrl =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_POCKETBASE_URL) ||
  (typeof process !== 'undefined' && process.env.POCKETBASE_URL) ||
  'http://127.0.0.1:8090';

const pb = new PocketBase(baseUrl);

pb.autoCancellation(false);

export default pb;