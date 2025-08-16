import { NextResponse } from 'next/server';
import pb from '@/lib/pocketbase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const records = await pb.collection('generated_documents').getList(1, 10, {
      sort: '-updated',
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching recent documents:', error);
    if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status;
        return NextResponse.json(
            { message: 'An error occurred while fetching recent documents.', error: (error as any).message },
            { status }
        );
    }
    
    return NextResponse.json(
      { message: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}