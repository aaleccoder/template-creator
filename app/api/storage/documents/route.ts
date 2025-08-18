import { NextRequest, NextResponse } from 'next/server';
import pb from '@/lib/pocketbase';

export async function GET(request: NextRequest) {
  try {
    pb.authStore.loadFromCookie(request.headers.get('cookie') || '');

    if (!pb.authStore.isValid) {
      return NextResponse.json({ message: 'No autorizado.' }, { status: 401 });
    }

    const currentUser = pb.authStore.record;

    const records = await pb.collection('documents').getFullList({
      sort: '-created',
      expand: 'file',
    });

    const result = records.map((doc: any) => {
      const asset = doc.expand?.file;
      const pdfUrl = asset ? pb.files.getURL(asset, asset.file) : null;

      return {
        id: doc.id,
        title: doc.title,
        description: doc.description,
        file: doc.file,
        created: doc.created,
        updated: doc.updated,
        pdfUrl,
      };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error listando documentos:', error);
    if (error.response) {
      console.error('PocketBase error response:', error.response);
    }
    if (error.cause) {
      console.error('Error cause:', error.cause);
    }
    return NextResponse.json(
      { message: 'Ocurrió un error al obtener los documentos.', error: error?.message },
      { status: 500 }
    );
  }
}
