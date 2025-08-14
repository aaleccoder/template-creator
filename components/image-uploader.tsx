"use client";

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

type ImageUploaderProps = {
    label: string;
    onUploadComplete: (url: string) => void;
    initialUrl?: string;
};

export default function ImageUploader({ label, onUploadComplete, initialUrl = '' }: ImageUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(initialUrl);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/assets', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Error al subir el archivo.');
            }

            const result = await response.json();
            const newUrl = result.url;

            setPreviewUrl(newUrl);
            onUploadComplete(newUrl);
        } catch (error) {
            console.error(error);
            // Aquí se podría mostrar un mensaje de error al usuario
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            {previewUrl && (
                <div className="relative w-32 h-32 mt-2 border rounded-md overflow-hidden">
                    <Image src={previewUrl} alt="Vista previa" layout="fill" objectFit="cover" />
                </div>
            )}
            <Input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
            {uploading && <p className="text-sm text-muted-foreground">Subiendo...</p>}
        </div>
    );
}