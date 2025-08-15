// app/api/documents/[id]/replace/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pb from '@/lib/pocketbase';

const GOTENBERG_ENDPOINT = process.env.NEXT_PUBLIC_GOTENBERG_ENDPOINT;

if (!GOTENBERG_ENDPOINT) {
  console.error('NEXT_PUBLIC_GOTENBERG_ENDPOINT environment variable is not set.');
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!GOTENBERG_ENDPOINT) {
    return NextResponse.json({ error: 'Gotenberg endpoint not configured.' }, { status: 500 });
  }

  pb.authStore.loadFromCookie(request.headers.get('cookie') || '');

  if (!pb.authStore.isValid) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const currentUser = pb.authStore.model;
  const documentId = params.id;

  try {
    const formData = await request.formData();
    const officeFile = formData.get('file') as File | null;
    const title = (formData.get('title') as string) || '';
    const description = (formData.get('description') as string) || '';

    if (!officeFile) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }
    if (!title) {
        return NextResponse.json({ error: "The 'title' field is required." }, { status: 400 });
    }

    // Fetch the existing document to get the asset ID
    const existingDocument = await pb.collection('documents').getOne(documentId);
    if (!existingDocument) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
    }

    // Convert Blob to Buffer for Gotenberg
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

    // Update the existing asset in PocketBase
    const pbFormData = new FormData();
    pbFormData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), `${officeFile.name}.pdf`);
   
    const updatedAssetRecord = await pb.collection('assets').update(existingDocument.file, pbFormData);

    // Update the document's title and description
    await pb.collection('documents').update(documentId, {
      title,
      description,
    });

    const pdfUrl = pb.getFileUrl(updatedAssetRecord, updatedAssetRecord.file);

    return NextResponse.json(
      { success: true, pdfUrl, assetId: updatedAssetRecord.id, documentId: documentId },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error during office file replacement:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
  }
}