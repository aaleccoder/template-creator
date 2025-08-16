// app/api/storage/documents/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pb from '@/lib/pocketbase';
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  pb.authStore.loadFromCookie(request.headers.get('cookie') || '');
  const { id: documentId } = await context.params;

  if (!pb.authStore.isValid) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  if (!documentId) {
    return NextResponse.json({ error: 'Invalid document ID.' }, { status: 400 });
  }

  try {
    // First, get the document to find the associated asset
    const document = await pb.collection('documents').getOne(documentId);
    // If there's an associated file, delete it from the 'assets' collection
    if (document.file) {
      await pb.collection('assets').delete(document.file);
    }
    // Finally, delete the document record itself
    await pb.collection('documents').delete(documentId);
    return NextResponse.json({ success: true, message: 'Document deleted successfully.' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
  }
}