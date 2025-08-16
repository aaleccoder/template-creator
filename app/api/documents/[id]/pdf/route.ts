import { NextRequest, NextResponse } from 'next/server';
import pb from '@/lib/pocketbase';
import { generatePdfFromHtml } from '@/lib/pdf';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: documentId } = await context.params;

  try {
    pb.authStore.loadFromCookie(request.headers.get('cookie') || '');
    if (!pb.authStore.isValid) {
      return NextResponse.json({ message: 'No autorizado.' }, { status: 401 });
    }

    const currentUser = pb.authStore.model;
    if (!currentUser) {
      return NextResponse.json({ message: 'Usuario no encontrado.' }, { status: 401 });
    }

    let existingAsset;
    try {
      const filter = `document = "${documentId}" && owner = "${currentUser.id}" && usage = "generated_pdf"`;
      existingAsset = await pb.collection('assets').getFirstListItem(filter, { sort: '-created' });
    } catch (error: any) {
      if (error.status !== 404) throw error;
    }

    if (existingAsset) {
      const fileUrl = pb.files.getURL(existingAsset, existingAsset.file);
      return NextResponse.redirect(fileUrl.toString());
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

    const newFileUrl = pb.getFileUrl(newAsset, newAsset.file);
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
