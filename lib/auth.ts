import { NextRequest } from 'next/server';
import pb from './pocketbase';

export async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const cookie = request.headers.get('cookie');
  if (!cookie) {
    return false;
  }

  try {
    pb.authStore.loadFromCookie(cookie, 'pb_auth');
    if (!pb.authStore.isValid) {
      return false;
    }

    await pb.collection('users').authRefresh();
    return true;
  } catch (error) {
    pb.authStore.clear();
    return false;
  }
}