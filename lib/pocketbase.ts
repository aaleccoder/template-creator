import PocketBase from 'pocketbase';

const baseUrl =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_POCKETBASE_URL) ||
  (typeof process !== 'undefined' && process.env.POCKETBASE_URL) ||
  'https://back-pdf.srv812681.hstgr.cloud';


const pb = new PocketBase(baseUrl);

pb.autoCancellation(false);

export default pb;