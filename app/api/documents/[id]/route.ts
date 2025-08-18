// app/api/generated_documents/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import pb from '@/lib/pocketbase';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ message: 'ID no encontrado en la URL.' }, { status: 400 });
    }

    pb.authStore.loadFromCookie(request.headers.get('cookie') || '');
    if (!pb.authStore.isValid) {
      return NextResponse.json({ message: 'No autorizado.' }, { status: 401 });
    }

    const record = await pb.collection('generated_documents').getOne(id, {
      expand: 'template',
    });

    if (record.owner !== pb.authStore.record?.id) {
      return NextResponse.json({ message: 'Acceso prohibido.' }, { status: 403 });
    }

    return NextResponse.json(record);

  } catch (error: any) {
    console.error(`Error fetching document`, error);
    if (error && typeof error === 'object' && 'status' in error) {
      const status = (error as any).status;
      const response = (error as any).response;
      return NextResponse.json(
        { message: `Error al obtener el documento: ${response?.message || (error as any).message}` },
        { status }
      );
    }

    return NextResponse.json(
      { message: 'Ocurrió un error inesperado.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ message: 'ID no encontrado en la URL.' }, { status: 400 });
    }

    pb.authStore.loadFromCookie(request.headers.get('cookie') || '');
    if (!pb.authStore.isValid) {
      return NextResponse.json({ message: 'No autorizado.' }, { status: 401 });
    }
    const currentUserId = pb.authStore.model?.id;

    const existingRecord = await pb.collection('generated_documents').getOne(id);
    if (existingRecord.owner !== currentUserId) {
      return NextResponse.json({ message: 'Acceso prohibido. No eres el propietario.' }, { status: 403 });
    }

    const body = await request.json();
    const { data, rendered_html, name } = body;

    try {
      const existingPdfAssets = await pb.collection('assets').getFullList({
        filter: `document = "${id}" && usage = "generated_pdf"`,
      });
      for (const asset of existingPdfAssets) {
        await pb.collection('assets').delete(asset.id);
        console.log(`Deleted old PDF asset: ${asset.id} for document ${id}`);
      }
    } catch (assetError) {
      console.warn(`Could not delete old PDF assets for document ${id}:`, assetError);
    }

    const updatedRecord = await pb.collection('generated_documents').update(id, {
      data,
      rendered_html,
      name,
    });

    return NextResponse.json(updatedRecord);

  } catch (error: any) {
    console.error(`Error updating document`, error);
    if (error && typeof error === 'object' && 'status' in error) {
      const status = (error as any).status;
      const response = (error as any).response;
      return NextResponse.json(
        { message: `Error al actualizar: ${response?.message || (error as any).message}` },
        { status }
      );
    }

    return NextResponse.json(
      { message: 'Ocurrió un error inesperado al actualizar.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ message: 'ID no encontrado en la URL.' }, { status: 400 });
    }

    pb.authStore.loadFromCookie(request.headers.get('cookie') || '');
    if (!pb.authStore.isValid) {
      return NextResponse.json({ message: 'No autorizado.' }, { status: 401 });
    }
    const currentUserId = pb.authStore.model?.id;

    const existingRecord = await pb.collection('generated_documents').getOne(id);
    if (existingRecord.owner !== currentUserId) {
      return NextResponse.json({ message: 'Acceso prohibido. No eres el propietario.' }, { status: 403 });
    }

    await pb.collection('generated_documents').delete(id);

    return new NextResponse(null, { status: 204 });

  } catch (error: any) {
    console.error(`Error deleting document`, error);
    if (error && typeof error === 'object' && 'status' in error) {
      const status = (error as any).status;
      const response = (error as any).response;
      return NextResponse.json(
        { message: `Error al borrar: ${response?.message || (error as any).message}` },
        { status }
      );
    }

    return NextResponse.json(
      { message: 'Ocurrió un error inesperado al borrar.' },
      { status: 500 }
    );
  }
}
