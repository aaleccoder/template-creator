import { NextResponse } from 'next/server';
import pb from '@/lib/pocketbase';

export async function GET() {
  try {
    // Para que esto funcione, las reglas de la API de la colección 'templates' en PocketBase
    // deben permitir la acción 'List' para los usuarios autenticados.
    const records = await pb.collection('templates').getFullList({
        sort: '-created',
    });
    
    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching templates:', error);
    // Determinar si el error es de PocketBase y tiene un status
    if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status;
        return NextResponse.json(
            { message: 'An error occurred while fetching templates.', error: (error as any).message },
            { status }
        );
    }
    
    return NextResponse.json(
      { message: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}