import { NextResponse, NextRequest } from 'next/server';
import pb from '@/lib/pocketbase';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    pb.authStore.loadFromCookie(request.headers.get('cookie') || '');

    if (!pb.authStore.isValid) {
      return NextResponse.json({ message: 'No autorizado.' }, { status: 401 });
    }

    const record = await pb.collection('generated_documents').getOne(id);

    if (record.owner !== pb.authStore.model?.id) {
         return NextResponse.json({ message: 'Acceso prohibido.' }, { status: 403 });
    }

    return NextResponse.json(record);

  } catch (error) {
    console.error(`Error fetching document with ID: ${params.id}`, error);
    if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status;
        const response = (error as any).response;
        return NextResponse.json(
            { message: `Error al obtener el documento: ${response.message || (error as any).message}` },
            { status }
        );
    }
    
    return NextResponse.json(
      { message: 'Ocurrió un error inesperado.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    pb.authStore.loadFromCookie(request.headers.get('cookie') || '');
    if (!pb.authStore.isValid) {
      return NextResponse.json({ message: 'No autorizado.' }, { status: 401 });
    }
    const currentUserId = pb.authStore.model?.id;

    const existingRecord = await pb.collection('generated_documents').getOne(id);

    if (existingRecord.owner !== currentUserId) {
      return NextResponse.json({ message: 'Acceso prohibido. No eres el propietario de este documento.' }, { status: 403 });
    }

    const body = await request.json();
    const { data, rendered_html, name } = body;

    const updatedRecord = await pb.collection('generated_documents').update(id, {
      data,
      rendered_html,
      name,
    });

    return NextResponse.json(updatedRecord);

  } catch (error) {
    console.error(`Error updating document with ID: ${params.id}`, error);
    if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status;
        const response = (error as any).response;
        return NextResponse.json(
            { message: `Error al actualizar el documento: ${response.message || (error as any).message}` },
            { status }
        );
    }
    
    return NextResponse.json(
      { message: 'Ocurrió un error inesperado al actualizar.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    pb.authStore.loadFromCookie(request.headers.get('cookie') || '');
    if (!pb.authStore.isValid) {
      return NextResponse.json({ message: 'No autorizado.' }, { status: 401 });
    }
    const currentUserId = pb.authStore.model?.id;

    const existingRecord = await pb.collection('generated_documents').getOne(id);

    if (existingRecord.owner !== currentUserId) {
      return NextResponse.json({ message: 'Acceso prohibido. No eres el propietario de este documento.' }, { status: 403 });
    }

    await pb.collection('generated_documents').delete(id);

    return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error(`Error deleting document with ID: ${params.id}`, error);
    if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status;
        const response = (error as any).response;
        return NextResponse.json(
            { message: `Error al borrar el documento: ${response.message || (error as any).message}` },
            { status }
        );
    }
    
    return NextResponse.json(
      { message: 'Ocurrió un error inesperado al borrar.' },
      { status: 500 }
    );
  }
}