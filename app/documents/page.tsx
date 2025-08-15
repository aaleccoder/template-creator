"use client";

import { useEffect, useState } from "react";
import { OfficeToPdfModal } from "@/components/office-to-pdf-modal";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from 'next/link';

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
      return <p>Cargando documentos...</p>;
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
          <Card key={doc.id} className="hover:border-primary transition-colors duration-200">
            <CardHeader>
              <CardTitle className="truncate">{doc.title}</CardTitle>
              <CardDescription className="line-clamp-2">{doc.description}</CardDescription>
              {doc.pdfUrl ? (
                <a
                  href={doc.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline mt-2 inline-block"
                >
                  Ver PDF
                </a>
              ) : (
                <span className="text-sm text-muted-foreground mt-2 inline-block">
                  Sin archivo PDF
                </span>
              )}
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="font-sans flex flex-col h-screen bg-background">
      <header className="flex justify-between items-center w-full p-4 border-b">
        <h1 className="text-2xl font-bold">Documentos</h1>
        <OfficeToPdfModal onCreated={loadDocuments} />
      </header>
      <main className="flex-1 p-8 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Documentos Creados</h2>
        {renderContent()}
      </main>
    </div>
  );
}