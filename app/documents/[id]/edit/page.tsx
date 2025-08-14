import DocumentEditor from "@/components/document-editor";
import pb from "@/lib/pocketbase";
import { Suspense } from "react";

// Definimos tipos claros para los datos que esperamos
interface TemplateData {
  id: string;
  name: string;
  description: string;
  schema: any;
  html: string;
  css: string;
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
    id: string;
  };
};

export default async function EditDocumentPage({ params }: EditDocumentPageProps) {
  
  const document = await pb.collection('generated_documents').getOne<DocumentData>(params.id, {
    expand: 'template'
  });

  // Comprobación de seguridad para asegurar que la plantilla expandida existe
  if (!document.expand?.template) {
    throw new Error("No se pudo encontrar la plantilla asociada a este documento.");
  }
  const template = document.expand.template;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Editando: {document.name}</h1>
        <p className="text-muted-foreground mt-1">
          Basado en la plantilla: "{template.name}"
        </p>
      </div>
      <Suspense fallback={<p>Cargando editor...</p>}>
        {/* Pasamos los datos del servidor al componente cliente */}
        <DocumentEditor initialDocument={document} initialTemplate={template} />
      </Suspense>
    </div>
  );
}