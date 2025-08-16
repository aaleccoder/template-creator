// app/api/convert/office-to-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pb from '@/lib/pocketbase';

const GOTENBERG_ENDPOINT = process.env.NEXT_PUBLIC_GOTENBERG_ENDPOINT;

if (!GOTENBERG_ENDPOINT) {
  console.error('NEXT_PUBLIC_GOTENBERG_ENDPOINT environment variable is not set.');
}

export async function POST(request: NextRequest) {
  if (!GOTENBERG_ENDPOINT) {
    return NextResponse.json({ error: 'Gotenberg endpoint not configured.' }, { status: 500 });
  }

  pb.authStore.loadFromCookie(request.headers.get('cookie') || '');

  if (!pb.authStore.isValid) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const currentUser = pb.authStore.record;

  try {
    const formData = await request.formData();
    const officeFile = formData.get('file') as File | null;
    const title = (formData.get('title') as string) || '';
    const description = (formData.get('description') as string) || '';

    if (!officeFile) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo.' }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json({ error: "El campo 'title' es requerido." }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await officeFile.arrayBuffer());

    const gotenbergFormData = new FormData();
    gotenbergFormData.append('files', new Blob([fileBuffer], { type: officeFile.type }), officeFile.name);

    const gotenbergResponse = await fetch(`${GOTENBERG_ENDPOINT}/forms/libreoffice/convert`, {
      method: 'POST',
      body: gotenbergFormData,
    });

    if (!gotenbergResponse.ok) {
      const errorText = await gotenbergResponse.text();
      console.error('Gotenberg conversion failed:', errorText);
      return NextResponse.json({ error: `PDF conversion failed: ${errorText}` }, { status: gotenbergResponse.status });
    }

    const pdfBlob = await gotenbergResponse.blob();
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

    const pbFormData = new FormData();
    pbFormData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), `${officeFile.name}.pdf`);
    pbFormData.append('usage', 'converted_office_pdf');
    pbFormData.append('owner', (currentUser?.id as string) || '');
    pbFormData.append('filename', `${officeFile.name}.pdf`);
    pbFormData.append('mime', 'application/pdf');

    const assetRecord = await pb.collection('assets').create(pbFormData);

    const documentRecord = await pb.collection('documents').create({
      title,
      description,
      file: assetRecord.id,
    });

    try {
      await pb.collection('assets').update(assetRecord.id, { document: documentRecord.id });
    } catch (linkErr) {
      console.warn('No se pudo enlazar asset->document:', linkErr);
    }

    const pdfUrl = pb.files.getURL(assetRecord, assetRecord.file);

    return NextResponse.json(
      { success: true, pdfUrl, assetId: assetRecord.id, documentId: documentRecord.id },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error during office file conversion:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
  }
}