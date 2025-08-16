import { NextRequest, NextResponse } from 'next/server';
import pb from '@/lib/pocketbase';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    console.log(`Login attempt for email: ${email}`);

    const authData = await pb.collection('users').authWithPassword(email, password);

    console.log('Login successful, session created.');

    const response = NextResponse.json({ 
      ...authData,
    });

    response.headers.set('set-cookie', pb.authStore.exportToCookie());

    return response;

  } catch (error: any) {
    console.error('Error during login:', error);
    return new NextResponse(
      JSON.stringify({
        status: 'error',
        message: error.message || 'An unexpected error occurred.',
      }),
      { status: 401 }
    );
  }
}