import { NextRequest, NextResponse } from 'next/server';
import pb from '@/lib/pocketbase';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();
    console.log(`Registration attempt for email: ${email}`);

    const newUser = await pb.collection('users').create({
      email,
      password,
      passwordConfirm: password,
      name,
    });

    console.log('Registration successful for user:', newUser.id);
    return NextResponse.json(newUser);

  } catch (error: any) {
    console.error('Error during registration:', error);
    return new NextResponse(
      JSON.stringify({
        status: 'error',
        message: error.message || 'An unexpected error occurred.',
      }),
      { status: 500 }
    );
  }
}