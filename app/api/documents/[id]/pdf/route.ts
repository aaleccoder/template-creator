import { NextRequest, NextResponse } from 'next/server';
import pb from '@/lib/pocketbase';
import { generatePdfFromHtml } from '@/lib/pdf';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: documentId } = await context.params;

  try {
    // First, check if a PDF already exists and is public.
    let existingAsset;
    try {
      const filter = `document = "${documentId}" && (usage = "generated_pdf" || usage = "converted_office_pdf")`;
      existingAsset = await pb.collection('assets').getFirstListItem(filter, { sort: '-created' });
    } catch (error: any) {
      if (error.status !== 404) throw error; // Ignore 404 "Not Found" errors
    }

    if (existingAsset) {
      const fileUrl = pb.files.getURL(existingAsset, existingAsset.file);
      return NextResponse.redirect(fileUrl.toString());
    }

    // If no PDF exists, then we must generate one.
    // This part requires authentication.
    pb.authStore.loadFromCookie(request.headers.get('cookie') || '');
    if (!pb.authStore.isValid) {
      return NextResponse.json({ message: 'No autorizado para generar un nuevo PDF.' }, { status: 401 });
    }

    const currentUser = pb.authStore.record;
    if (!currentUser) {
      return NextResponse.json({ message: 'Usuario no encontrado.' }, { status: 401 });
    }

    const document = await pb.collection('generated_documents').getOne(documentId);

    if (document.owner !== currentUser.id) {
      return NextResponse.json({ message: 'Acceso prohibido.' }, { status: 403 });
    }

    const pdfUint8Array = await generatePdfFromHtml(document.rendered_html);
    const pdfBuffer = Buffer.from(pdfUint8Array);

    const formData = new FormData();
    const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });

    formData.append('file', pdfBlob, `${document.name}.pdf`);
    formData.append('document', documentId);
    formData.append('owner', currentUser.id);
    formData.append('filename', `${document.name}.pdf`);
    formData.append('usage', 'generated_pdf');

    const newAsset = await pb.collection('assets').create(formData);

    const newFileUrl = pb.files.getURL(newAsset, newAsset.file);
    return NextResponse.redirect(newFileUrl.toString());

  } catch (error: any) {
    console.error(`Error en el proceso de PDF para el documento ${documentId}:`, error);
    if (error.response) {
      console.error('Detalles del error de PocketBase:', JSON.stringify(error.response, null, 2));
    }
    return NextResponse.json(
      { message: 'Ocurrió un error inesperado durante la generación del PDF.' },
      { status: 500 }
    );
  }
}