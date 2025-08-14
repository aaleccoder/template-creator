"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FormRenderer from "@/components/form-renderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Handlebars from "handlebars";

// Tipos de datos que este componente espera recibir
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
}

type DocumentEditorProps = {
  initialDocument: DocumentData;
  initialTemplate: TemplateData;
};

export default function DocumentEditor({ initialDocument, initialTemplate }: DocumentEditorProps) {
  const router = useRouter();
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [currentFormData, setCurrentFormData] = useState(initialDocument.data);
  const [documentName, setDocumentName] = useState(initialDocument.name);
  const [isSaving, setIsSaving] = useState(false);

  const handleFormSubmit = (formData: { [key: string]: any }) => {
    setCurrentFormData(formData);

    // Compilar la plantilla con Handlebars para soportar {{#if}} y {{#each}}
    const compile = Handlebars.compile(initialTemplate.html);
    const processedHtml = compile(formData);

    const finalHtml = `
      <style>${initialTemplate.css}</style>
      ${processedHtml}
    `;
    setPreviewHtml(finalHtml);
  };

  const handleSave = async () => {
    if (!previewHtml) {
      alert("Por favor, genera una vista previa antes de guardar.");
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch(`/api/documents/${initialDocument.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: documentName,
          data: currentFormData,
          rendered_html: previewHtml,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar el documento.');
      }
      alert('Documento actualizado con éxito!');
      router.push(`/templates/${initialDocument.template}`); // Volver al hub de la plantilla
      router.refresh(); // Refrescar los datos en la página anterior
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (previewHtml) {
    return (
      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Vista Previa del Documento</h2>
            <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setPreviewHtml(null)} disabled={isSaving}>
                    Volver al Formulario
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
            </div>
        </div>
        <div
          className="border rounded-lg p-4 bg-white text-black"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      </div>
    );
  }

  return (
    <div className="mt-8 max-w-2xl mx-auto">
        <div className="space-y-2 mb-8">
            <Label htmlFor="docName">Nombre del Documento</Label>
            <Input 
                id="docName"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
            />
        </div>
        <FormRenderer 
            schema={initialTemplate.schema}
            initialData={currentFormData}
            onSubmit={handleFormSubmit}
            submitButtonText="Actualizar Vista Previa"
        />
    </div>
  );
}