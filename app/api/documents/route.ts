import { NextResponse, NextRequest } from 'next/server';
import pb from '@/lib/pocketbase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const templateId = searchParams.get('template');

    if (!templateId) {
      return NextResponse.json(
        { message: 'El parámetro "template" (ID de la plantilla) es requerido.' },
        { status: 400 }
      );
    }

    const records = await pb.collection('generated_documents').getFullList({
      filter: `template = "${templateId}"`,
      sort: '-created',
    });
    
    return NextResponse.json(records);

  } catch (error) {
    console.error('Error fetching generated documents:', error);
    if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status;
        return NextResponse.json(
            { message: 'Ocurrió un error al obtener los documentos generados.', error: (error as any).message },
            { status }
        );
    }
    
    return NextResponse.json(
      { message: 'Ocurrió un error inesperado.' },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    pb.authStore.loadFromCookie(request.headers.get('cookie') || '');

    if (!pb.authStore.isValid) {
      return NextResponse.json({ message: 'No autorizado.' }, { status: 401 });
    }

    const currentUser = pb.authStore.model;
    if (!currentUser) {
        return NextResponse.json({ message: 'Usuario no encontrado.' }, { status: 401 });
    }

    const body = await request.json();

    const { name, template, data, rendered_html } = body;
    if (!name || !template || !data || !rendered_html) {
      return NextResponse.json({ message: 'Faltan campos requeridos: name, template, data, rendered_html.' }, { status: 400 });
    }

    const recordData = {
      name,
      template,
      data,
      rendered_html,
      owner: currentUser.id,
      status: 'draft',
    };

    const newRecord = await pb.collection('generated_documents').create(recordData);

    return NextResponse.json(newRecord, { status: 201 });

  } catch (error) {
    console.error('Error creating document:', error);
     if (error && typeof error === 'object' && 'status' in error) {
        // Log detallado para depuración
        console.error('PocketBase Error Details:', JSON.stringify((error as any).response, null, 2));
        
        const status = (error as any).status;
        return NextResponse.json(
            { message: 'Ocurrió un error al guardar el documento.', error: (error as any).response.message || (error as any).message },
            { status }
        );
    }
    
    return NextResponse.json(
      { message: 'Ocurrió un error inesperado.' },
      { status: 500 }
    );
  }
}