// app/api/convert/office-to-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pb from '@/lib/pocketbase';

const GOTENBERG_ENDPOINT = process.env.GOTENBERG_ENDPOINT;

const GOTENBERG_HTTP_USERNAME = process.env.GOTENBERG_API_BASIC_AUTH_USERNAME;
const GOTENBERG_HTTP_PASSWORD = process.env.GOTENBERG_API_BASIC_AUTH_PASSWORD;

if (!GOTENBERG_ENDPOINT) {
  console.error('GOTENBERG_ENDPOINT environment variable is not set.');
}

export async function POST(request: NextRequest) {
  console.log('Received request to convert office file to PDF.');

  if (!GOTENBERG_ENDPOINT) {
    console.error('Gotenberg endpoint not configured.');
    return NextResponse.json({ error: 'Gotenberg endpoint not configured.' }, { status: 500 });
  }


  pb.authStore.loadFromCookie(request.headers.get('cookie') || '');

  if (!pb.authStore.isValid) {
    console.warn('Unauthorized access attempt.');
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const currentUser = pb.authStore.record;
  console.log(`User authenticated: ${currentUser?.id}`);

  let assetRecordId: string | null = null;
  try {
    console.log('Processing form data...');
    const formData = await request.formData();
    const officeFile = formData.get('file') as File | null;
    const title = (formData.get('title') as string) || '';
    const description = (formData.get('description') as string) || '';

    if (!officeFile) {
      console.error('No file provided.');
      return NextResponse.json({ error: 'No se proporcionó ningún archivo.' }, { status: 400 });
    }
    if (!title) {
      console.error('Title is required.');
      return NextResponse.json({ error: "El campo 'title' es requerido." }, { status: 400 });
    }
    console.log(`File received: ${officeFile.name}, Title: ${title}`);

    const fileBuffer = Buffer.from(await officeFile.arrayBuffer());
    console.log('File buffer created.');

    const gotenbergFormData = new FormData();
    gotenbergFormData.append('files', new Blob([fileBuffer], { type: officeFile.type }), officeFile.name);

    const headers: HeadersInit = {};
    if (GOTENBERG_HTTP_USERNAME && GOTENBERG_HTTP_PASSWORD) {
      console.log('Using Basic Authentication for Gotenberg.');
      headers['Authorization'] = 'Basic ' + btoa(`${GOTENBERG_HTTP_USERNAME}:${GOTENBERG_HTTP_PASSWORD}`);
    }

    console.log('Sending file to Gotenberg for conversion...');
    const gotenbergResponse = await fetch(`${GOTENBERG_ENDPOINT}/forms/libreoffice/convert`, {
      method: 'POST',
      headers,
      body: gotenbergFormData,
    });

    if (!gotenbergResponse.ok) {
      const errorText = await gotenbergResponse.text();
      console.error('Gotenberg conversion failed:', errorText);
      return NextResponse.json({ error: `PDF conversion failed: ${errorText}` }, { status: gotenbergResponse.status });
    }

    const pdfBlob = await gotenbergResponse.blob();
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());
    console.log('PDF blob received from Gotenberg and converted to buffer.');

    const pbFormData = new FormData();
    pbFormData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), `${officeFile.name}.pdf`);
    pbFormData.append('usage', 'converted_office_pdf');
    pbFormData.append('owner', (currentUser?.id as string) || '');
    pbFormData.append('filename', `${officeFile.name}.pdf`);
    pbFormData.append('mime', 'application/pdf');

    const assetRecord = await pb.collection('assets').create(pbFormData);
    assetRecordId = assetRecord.id;
    console.log(`Asset created in PocketBase with ID: ${assetRecord.id}`);

    const documentRecord = await pb.collection('documents').create({
      title,
      description,
      file: assetRecord.id,
      owner: currentUser?.id,
    });
    console.log(`Document created in PocketBase with ID: ${documentRecord.id}`);

    try {
      await pb.collection('assets').update(assetRecord.id, { document: documentRecord.id });
      console.log(`Asset ${assetRecord.id} linked to document ${documentRecord.id}`);
    } catch (linkErr) {
      console.warn('No se pudo enlazar asset->document:', linkErr);
    }

    const pdfUrl = pb.files.getURL(assetRecord, assetRecord.file);
    console.log(`Generated PDF URL: ${pdfUrl}`);

    console.log('Conversion successful. Sending response.');
    return NextResponse.json(
      { success: true, pdfUrl, assetId: assetRecord.id, documentId: documentRecord.id },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error during office file conversion:', error);

    // More detailed logging
    if (error.response) {
      console.error('PocketBase response:', JSON.stringify(error.response, null, 2));
    }
    if (error.cause) {
      console.error('Error cause:', error.cause);
    }

    if (assetRecordId) {
        console.log(`Rolling back asset creation: ${assetRecordId}`);
        await pb.collection('assets').delete(assetRecordId);
    }
    return NextResponse.json({ error: 'Error al procesar el archivo. No se ha guardado el documento.', details: error.message }, { status: 500 });
  }
}