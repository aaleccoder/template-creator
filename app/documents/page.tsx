"use client";

import { useEffect, useState } from "react";
import { OfficeToPdfModal } from "@/components/office-to-pdf-modal";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Clipboard, FilePenLine, Trash2, FileUp } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from 'sonner';

interface Document {
  id: string;
  title: string;
  description: string;
  file: string; // asset id
  created: string;
  updated: string;
  pdfUrl?: string | null;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    toast.success('¡Vínculo copiado al portapapeles!');
  };

  const handleDelete = async (e: React.MouseEvent, documentId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('¿Estás seguro que deseas borrar este documento?')) {
      return;
    }

    try {
      const response = await fetch(`/api/storage/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Fallo al borrar el documento.');
      }

      toast.success('Documento borrado con éxito!');
      loadDocuments(); // Refresh the list
    } catch (err: any) {
      toast.error(err.message || 'Ocurrió un error.');
    }
  };

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/storage/documents');
      if (!response.ok) {
        throw new Error('No se pudo obtener la lista de documentos.');
      }
      const data = await response.json();
      setDocuments(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="flex flex-col">
              <CardHeader className="flex-grow">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardFooter className="flex justify-end items-center gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </CardFooter>
            </Card>
          ))}
        </div>
      );
    }

    if (error) {
      return <p className="text-destructive">Error: {error}</p>;
    }

    if (documents.length === 0) {
      return <p>No se encontraron documentos. Empieza por crear uno.</p>;
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {documents.map((doc) => (
          <Link key={doc.id} href={doc.pdfUrl || '#'} target="_blank" rel="noopener noreferrer" className="block">
            <Card className="hover:border-primary transition-colors duration-200 flex flex-col h-full">
              <CardHeader className="flex-grow">
                <CardTitle className="truncate">{doc.title}</CardTitle>
                <CardDescription className="line-clamp-2">{doc.description}</CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-end items-center gap-2">
                  <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => handleCopy(e, doc.pdfUrl!)}
                      disabled={!doc.pdfUrl}
                      title="Copy Link"
                      className="cursor-pointer"
                  >
                      <Clipboard className="h-4 w-4" />
                  </Button>
                  <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                    <OfficeToPdfModal onCreated={loadDocuments} document={doc}>
                        <Button variant="outline" size="icon" title="Edit" className="cursor-pointer">
                            <FilePenLine className="h-4 w-4" />
                        </Button>
                    </OfficeToPdfModal>
                  </div>
                  <Button
                      variant="destructive"
                      size="icon"
                      onClick={(e) => handleDelete(e, doc.id)}
                      title="Delete"
                      className="cursor-pointer"
                  >
                      <Trash2 className="h-4 w-4" />
                  </Button>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className="font-sans flex flex-col h-screen bg-background">
      <header className="flex justify-between items-center w-full p-4 border-b">
        <h1 className="text-2xl font-bold">Documentos</h1>
        <OfficeToPdfModal onCreated={loadDocuments}>
            <Button>
                <FileUp className="mr-2 h-4 w-4" />
                Convertir Office a PDF
            </Button>
        </OfficeToPdfModal>
      </header>
      <main className="flex-1 p-8 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
}
