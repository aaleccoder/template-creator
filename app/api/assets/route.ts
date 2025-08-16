import { NextRequest, NextResponse } from 'next/server';
import pb from '@/lib/pocketbase';

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

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ message: 'No se ha proporcionado ningún archivo.' }, { status: 400 });
        }

        const MAX_SIZE = 5 * 1024 * 1024; // 5MB por defecto
        const mime = (file.type || '').toLowerCase();
        const name = (file.name || '').toLowerCase();
        const looksImageByExt = /\.(png|jpe?g|gif|webp|svg)$/i.test(name);

        if (!(mime.startsWith('image/') || looksImageByExt)) {
            return NextResponse.json({ message: 'Tipo de archivo no permitido. Debe ser una imagen.' }, { status: 400 });
        }
        if (typeof file.size === 'number' && file.size > MAX_SIZE) {
            return NextResponse.json({ message: 'La imagen supera el tamaño máximo permitido (5MB).' }, { status: 400 });
        }

        const createData = new FormData();
        createData.append('file', file);
        createData.append('owner', currentUser.id);
        createData.append('usage', 'template_image'); // Para distinguir estos assets
        createData.append('filename', file.name);

        const newAsset = await pb.collection('assets').create(createData);

        const fileUrl = pb.files.getURL(newAsset, newAsset.file as string).toString();

        return NextResponse.json({ url: fileUrl }, { status: 201 });

    } catch (error: any) {
        console.error('Error en la subida de assets:', error);
        if (error.response) {
             console.error('Detalles del error de PocketBase:', JSON.stringify(error.response, null, 2));
        }
        return NextResponse.json(
            { message: 'Ocurrió un error inesperado durante la subida del archivo.' },
            { status: 500 }
        );
    }
}