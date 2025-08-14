// lib/pocketbase.ts
import PocketBase from 'pocketbase';

// Create a new PocketBase instance
const pb = new PocketBase('http://127.0.0.1:8090');

// Globally disable auto-cancellation
pb.autoCancellation(false);

export default pb;