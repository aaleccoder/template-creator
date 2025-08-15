"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import Link from 'next/link';

interface Document {
  id: string;
  title: string;
  description: string;
}

export function OfficeToPdfModal({
  onCreated,
  document,
  children,
}: {
  onCreated?: () => void;
  document?: Document | null;
  children?: React.ReactNode;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState(document?.title || '');
  const [description, setDescription] = useState(document?.description || '');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setPdfUrl(null);
      setError(null);
    }
  };

  const handleConvert = async () => {
    if (!selectedFile && !document) {
      setError('Por favor, seleccione un archivo.');
      return;
    }
    if (!title.trim()) {
        setError('Por favor, complete el título.');
        return;
    }

    setLoading(true);
    setError(null);
    setPdfUrl(null);

    const formData = new FormData();
    if (selectedFile) {
        formData.append('file', selectedFile);
    }
    formData.append('title', title);
    formData.append('description', description);

    try {
        const url = document
            ? `/api/documents/${document.id}/replace`
            : '/api/convert/office-to-pdf';
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'La conversión falló.');
      }

      const data = await response.json();
      setPdfUrl(data.pdfUrl);
      // Notificar al padre para refrescar el listado de documentos
      onCreated?.();
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };
  
  const resetState = () => {
    setSelectedFile(null);
    setTitle(document?.title || '');
    setDescription(document?.description || '');
    setPdfUrl(null);
    setLoading(false);
    setError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => {
      setIsOpen(open);
      if (!open) {
        resetState();
      }
    }}>
      <DialogTrigger asChild>
        {children || <Button variant="outline">{document ? 'Editar Documento' : <><FileUp className="mr-2 h-4 w-4" /> Agregar documento</>}</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{document ? 'Editar Documento' : 'Convertidor de Office a PDF'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="doc-title">Título</Label>
            <Input
              id="doc-title"
              type="text"
              placeholder="Introduce un título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="doc-description">Descripción (opcional)</Label>
            <Input
              id="doc-description"
              type="text"
              placeholder="Describe el documento"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="office-file">Subir Archivo de Office</Label>
            <Input
              id="office-file"
              type="file"
              accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp"
              onChange={handleFileChange}
            />
            {selectedFile && (
              <p className="text-sm text-gray-500 mt-1">Seleccionado: {selectedFile.name}</p>
            )}
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">Error: {error}</p>
          )}

          {pdfUrl && (
            <div className="text-center">
              <p className="text-green-600 font-semibold mb-2">¡Conversión Exitosa!</p>
              <Link href={pdfUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline">Ver PDF</Button>
              </Link>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={handleConvert}
            disabled={(!selectedFile && !document) || loading}
            className="w-full"
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}