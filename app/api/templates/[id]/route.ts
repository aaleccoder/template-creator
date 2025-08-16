import { NextRequest, NextResponse } from 'next/server';
import pb from '@/lib/pocketbase';
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    if (!id) {
      return NextResponse.json(
        { message: 'Template ID is required.' },
        { status: 400 }
      );
    }
    
    const record = await pb.collection('templates').getOne(id);
    
    return NextResponse.json(record);

  } catch (error) {
    console.error(`Error fetching template with ID: ${id}`, error);
    // PocketBase throws an error with status 404 if not found
    if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status;
        if (status === 404) {
             return NextResponse.json(
                { message: `Template with ID '${id}' not found.` },
                { status: 404 }
            );
        }
        return NextResponse.json(
            { message: 'An error occurred while fetching the template.', error: (error as any).message },
            { status }
        );
    }
    
    return NextResponse.json(
      { message: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}