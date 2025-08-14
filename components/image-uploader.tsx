"use client";

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

type ImageUploaderProps = {
    label: string;
    onUploadComplete: (url: string) => void;
    initialUrl?: string;
    acceptMime?: string; // e.g., 'image/*' or 'image/png,image/jpeg'
    maxSizeMB?: number;  // e.g., 5
};

export default function ImageUploader({
    label,
    onUploadComplete,
    initialUrl = '',
    acceptMime = 'image/*',
    maxSizeMB = 5,
}: ImageUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(initialUrl);
    const [error, setError] = useState<string | null>(null);

    const isMimeAllowed = (file: File, accept: string) => {
        if (!accept) return true;
        const m = (file.type || '').toLowerCase();
        // Wildcard support for image/*
        const parts = accept.split(',').map(s => s.trim().toLowerCase());
        return parts.some(p => {
            if (p.endsWith('/*')) {
                const prefix = p.slice(0, p.indexOf('/*'));
                return m.startsWith(prefix + '/');
            }
            return m === p;
        });
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setError(null);

        // Client-side validations
        if (!isMimeAllowed(file, acceptMime)) {
            setError('Tipo de archivo no permitido. Seleccione una imagen válida.');
            return;
        }
        const maxBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxBytes) {
            setError(`El archivo supera el tamaño máximo permitido de ${maxSizeMB} MB.`);
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/assets', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const text = await response.text().catch(() => '');
                throw new Error(text || 'Error al subir el archivo.');
            }

            const result = await response.json();
            const newUrl = result.url;

            setPreviewUrl(newUrl);
            onUploadComplete(newUrl);
        } catch (err) {
            console.error(err);
            setError('No se pudo subir la imagen. Intente nuevamente.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            {previewUrl && (
                <div className="relative w-32 h-32 mt-2 border rounded-md overflow-hidden">
                    <Image src={previewUrl} alt="Vista previa" fill style={{ objectFit: 'cover' }} />
                </div>
            )}
            <Input type="file" accept={acceptMime} onChange={handleFileChange} disabled={uploading} />
            {uploading && <p className="text-sm text-muted-foreground">Subiendo...</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}