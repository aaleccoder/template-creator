"use client"
import DocumentEditor from "@/components/document-editor";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter, useParams } from "next/navigation";

// Definimos tipos claros para los datos que esperamos
interface TemplateData {
  id: string;
  name: string;
  description: string;
  schema: any;
  html: string;
  css: string;
  helpers: any;
}

interface DocumentData {
  id: string;
  name: string;
  data: { [key: string]: any };
  template: string; // ID de la plantilla
  expand?: {
    template: TemplateData;
  }
}


type EditDocumentPageProps = {
  params: {
    id: string; // This is the templateId
    documentId: string;
  };
};

export default function EditDocumentPage() {
  const router = useRouter();
  const params = useParams();
  const documentId = params.documentId as string;
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocument = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/documents/${documentId}`);
        if (!response.ok) {
          const errorData = await response.json();
          console.error("API Error:", errorData.message);
          throw new Error(errorData.message || 'Failed to fetch document');
        }
        const doc = await response.json();

        if (!doc.expand?.template) {
          throw new Error("No se pudo encontrar la plantilla asociada a este documento.");
        }
        setDocument(doc);
        setTemplate(doc.expand.template);
      } catch (error) {
        console.error("Failed to fetch document:", error);
        // Optionally, set an error state here to show in the UI
      } finally {
        setLoading(false);
      }
    };

    if (documentId) {
      fetchDocument();
    }
  }, [documentId]);

  if (loading) {
    return <div className="container mx-auto"><p>Cargando...</p></div>
  }

  if (!document || !template) {
    return <div className="container mx-auto"><p>No se pudo cargar el documento.</p></div>
  }
  
  return (
    <div className="container mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Editando: {document.name}</h1>
          <p className="text-muted-foreground mt-1">
            Basado en la plantilla: "{template.name}"
          </p>
        </div>
        <Button onClick={() => router.back()}>Volver</Button>
      </div>
      <Suspense fallback={<p>Cargando editor...</p>}>
        <DocumentEditor initialDocument={document} initialTemplate={template} />
      </Suspense>
    </div>
  );
}