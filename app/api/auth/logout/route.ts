import { NextRequest, NextResponse } from 'next/server';
import pb from '@/lib/pocketbase';

export async function POST(request: NextRequest) {
  try {
    pb.authStore.clear();

    const response = new NextResponse(JSON.stringify({ status: 'success' }));

    // Clear the session cookie
    response.cookies.set('pb_auth', '', {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(0),
    });

    return response;

  } catch (error: any) {
    console.error('Error during logout:', error);
    return new NextResponse(
      JSON.stringify({
        status: 'error',
        message: error.message || 'An unexpected error occurred.',
      }),
      { status: 500 }
    );
  }
}