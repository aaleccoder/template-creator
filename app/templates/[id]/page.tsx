"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import FormRenderer from "@/components/form-renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Tipos para nuestros datos
interface TemplateData {
  id: string;
  name: string;
  description: string;
  schema: any;
  html: string;
  css: string;
}

interface GeneratedDocument {
  id: string;
  name: string;
  created: string;
}

type TemplatePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function TemplatePage({ params }: TemplatePageProps) {
  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [currentFormData, setCurrentFormData] = useState<{ [key: string]: any } | null>(null);
  const [newDocumentName, setNewDocumentName] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const resolvedParams = await params;
      if (!resolvedParams.id) return;

      const [templateRes, documentsRes] = await Promise.all([
        fetch(`/api/templates/${resolvedParams.id}`),
        fetch(`/api/documents?template=${resolvedParams.id}`)
      ]);

      if (!templateRes.ok) throw new Error('No se pudo obtener la plantilla.');
      if (!documentsRes.ok) throw new Error('No se pudieron obtener los documentos generados.');

      const templateData = await templateRes.json();
      const documentsData = await documentsRes.json();

      setTemplate(templateData);
      setDocuments(documentsData);
      setNewDocumentName(`${templateData.name} - Nuevo`);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params, view]);

  const handleFormSubmit = (formData: { [key: string]: any }) => {
    if (!template) return;
    
    setCurrentFormData(formData);
    
    let processedHtml = template.html;

    for (const key in formData) {
      if (Object.prototype.hasOwnProperty.call(formData, key)) {
        const value = formData[key];
        const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        processedHtml = processedHtml.replace(placeholder, value);
      }
    }
    
    const finalHtml = `
      <style>${template.css}</style>
      ${processedHtml}
    `;

    setPreviewHtml(finalHtml);
  };

  const handleSaveDocument = async () => {
    if (!template || !currentFormData || !previewHtml) {
        alert("Faltan datos para guardar el documento.");
        return;
    }
    
    if (!newDocumentName.trim()) {
        alert("El nombre del documento no puede estar vacío.");
        return;
    }

    try {
        const response = await fetch('/api/documents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: newDocumentName,
                template: template.id,
                data: currentFormData,
                rendered_html: previewHtml,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al guardar el documento.');
        }

        alert('Documento guardado con éxito!');
        setPreviewHtml(null);
        setView('list');
        
    } catch (err: any) {
        alert(`Error: ${err.message}`);
    }
  };
  
  const handleDelete = async (docId: string) => {
    if (!confirm("¿Estás seguro de que quieres borrar este documento? Esta acción no se puede deshacer.")) {
        return;
    }

    try {
        const response = await fetch(`/api/documents/${docId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al borrar el documento.');
        }
        
        setDocuments(documents.filter(doc => doc.id !== docId));
        alert("Documento borrado con éxito.");

    } catch (err: any) {
        alert(`Error: ${err.message}`);
    }
  };

  const renderDocumentList = () => {
    if (loading) return <p>Cargando documentos...</p>;
    if (error) return <p className="text-destructive">Error: {error}</p>;

    if (documents.length === 0) {
      return (
        <div className="text-center p-12 border-2 border-dashed rounded-lg">
          <p>Aún no se han creado documentos para esta plantilla.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {documents.map(doc => (
            <Card key={doc.id} className="flex flex-col justify-between">
                <Link href={`/api/documents/${doc.id}/pdf`} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                    <CardHeader>
                        <CardTitle className="truncate">{doc.name}</CardTitle>
                        <CardDescription>
                        Creado: {new Date(doc.created).toLocaleDateString()}
                        </CardDescription>
                    </CardHeader>
                </Link>
                <CardFooter className="flex justify-end gap-2 p-4">
                    <Link href={`/documents/${doc.id}/edit`} passHref>
                        <Button variant="outline" size="sm">Editar</Button>
                    </Link>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(doc.id)}>
                        Borrar
                    </Button>
                </CardFooter>
            </Card>
        ))}
      </div>
    );
  }

  const renderFormView = () => {
    if (loading) return <p className="text-center p-12">Cargando plantilla...</p>;
    if (error) return <p className="text-destructive text-center p-12">Error: {error}</p>;
    if (!template) return <p className="text-center p-12">No se encontró la plantilla.</p>;
    
    if (previewHtml) {
        return (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Vista Previa del Documento</h2>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setPreviewHtml(null)}>
                        Volver al Formulario
                    </Button>
                    <Button onClick={handleSaveDocument}>
                        Guardar Documento
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
    
    if (!template.schema || Object.keys(template.schema).length === 0) {
      return <p className="text-center p-12">Esta plantilla no tiene campos configurados para rellenar.</p>;
    }

    return (
      <div className="mt-8 max-w-2xl mx-auto">
        <div className="space-y-2 mb-8">
            <Label htmlFor="newDocName">Nombre del Nuevo Documento</Label>
            <Input 
                id="newDocName"
                value={newDocumentName}
                onChange={(e) => setNewDocumentName(e.target.value)}
            />
        </div>
        <FormRenderer schema={template.schema} onSubmit={handleFormSubmit} />
      </div>
    );
  }

  return (
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">{template ? template.name : 'Cargando...'}</h1>
              <p className="text-muted-foreground mt-1">
                {template ? template.description : 'Cargando descripción...'}
              </p>
            </div>
            <Button onClick={() => setView(view === 'list' ? 'form' : 'list')}>
                {view === 'list' ? 'Crear Nuevo Documento' : 'Volver a la Lista'}
            </Button>
        </div>

        {view === 'list' ? (
            <div>
                <h2 className="text-xl font-semibold mb-4">Documentos Creados</h2>
                {renderDocumentList()}
            </div>
        ) : (
            renderFormView()
        )}
    </div>
  );
}