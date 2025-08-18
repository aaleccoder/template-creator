"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FormRenderer from "@/components/form-renderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";


// Tipos de datos que este componente espera recibir
interface TemplateData {
  id: string;
  name: string;
  description: string;
  schema: any;
  html: string;
  css: string;
  helpers: any; // Add helpers property
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
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [jsonData, setJsonData] = useState("");

  const handleLoadJson = () => {
    if (!jsonData) {
      alert("El JSON no puede estar vacío.");
      return;
    }
    try {
      const parsedData = JSON.parse(jsonData);
      setCurrentFormData(parsedData);
      setJsonData("");
      setIsJsonModalOpen(false);
    } catch (error) {
      alert("JSON inválido. Por favor, comprueba la sintaxis.");
    }
  };

  const handleFormSubmit = async (formData: { [key: string]: any }) => {
    setCurrentFormData(formData);
    try {
      const response = await fetch('/api/templates/compile-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: initialTemplate.html,
          css: initialTemplate.css,
          data: formData,
          helpers: initialTemplate.helpers,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al generar la vista previa.');
      }

      const { previewHtml } = await response.json();
      setPreviewHtml(previewHtml);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
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
      toast.success('Documento actualizado con éxito!');
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
          className="border rounded-lg p-4 bg-white text-black w-[100vh] h-50% overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      </div>
    );
  }

  return (
    <div className="mt-8 max-w-2xl mx-auto">
      <div className="space-y-2 mb-4">
        <Label htmlFor="docName">Nombre del Documento</Label>
        <Input
          id="docName"
          value={documentName}
          onChange={(e) => setDocumentName(e.target.value)}
        />
      </div>

      <div className="mb-8">
        <Dialog open={isJsonModalOpen} onOpenChange={setIsJsonModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Rellenar desde JSON</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Rellenar desde JSON</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <p className="text-sm text-muted-foreground">
                Pega el contenido de un archivo JSON para pre-rellenar el formulario. La estructura del JSON debe coincidir con los nombres (`name`) de los campos definidos en el schema de la plantilla.
              </p>
              <Textarea
                placeholder='{ "campo1": "valor1", "campo2": 123 }'
                value={jsonData}
                onChange={(e) => setJsonData(e.target.value)}
                className="min-h-[200px] font-mono"
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="button" onClick={handleLoadJson}>Cargar Datos</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
