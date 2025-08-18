"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import FormRenderer from "@/components/form-renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Clipboard, FilePenLine, Trash2, Eye } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from 'sonner';

interface TemplateData {
  id: string;
  name: string;
  description: string;
  schema: any;
  html: string;
  css: string;
  helpers: any;
  preview?: string; // Add preview field
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
  const [currentFormData, setCurrentFormData] = useState<{ [key: string]: any } | null>({});
  const [newDocumentName, setNewDocumentName] = useState('');
  const [saving, setSaving] = useState(false);
  const [docToDelete, setDocToDelete] = useState<GeneratedDocument | null>(null);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [jsonData, setJsonData] = useState("");
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewDocumentHtml, setPreviewDocumentHtml] = useState<string | null>(null);

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

  const handleFormSubmit = async (formData: { [key: string]: any }) => {
    if (!template) return;

    setCurrentFormData(formData);
    setSaving(true);
    try {
      const response = await fetch('/api/templates/compile-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: template.html,
          css: template.css,
          data: formData,
          helpers: template.helpers,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al generar la vista previa.');
      }

      const { previewHtml } = await response.json();
      setPreviewHtml(previewHtml);
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDocument = async () => {
    if (!template || !currentFormData || !previewHtml) {
      toast.error("Faltan datos para guardar el documento.");
      return;
    }

    if (!newDocumentName.trim()) {
      toast.error("El nombre del documento no puede estar vacío.");
      return;
    }

    setSaving(true);
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

      toast.success('Documento guardado con éxito!');
      setPreviewHtml(null);
      setView('list');

    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    toast.success('¡Enlace copiado al portapapeles!');
  };

  const handleDelete = async (doc: GeneratedDocument) => {
    if (!doc) return;

    try {
      const response = await fetch(`/api/documents/${doc.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al borrar el documento.');
      }

      setDocuments(documents.filter(d => d.id !== doc.id));
      toast.success("Documento borrado con éxito.");

    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setDocToDelete(null);
    }
  };

  const handleLoadJson = () => {
    if (!jsonData) {
      toast.error("El JSON no puede estar vacío.");
      return;
    }
    try {
      const parsedData = JSON.parse(jsonData);
      setCurrentFormData(parsedData);
      setJsonData("");
      setIsJsonModalOpen(false);
      toast.success("Datos cargados desde JSON correctamente.")
    } catch (error) {
      toast.error("JSON inválido. Por favor, comprueba la sintaxis.");
    }
  };

  const renderDocumentList = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
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
        {documents.map(doc => {
          const pdfUrl = `/api/documents/${doc.id}/pdf`;
          return (
            <Link key={doc.id} href={pdfUrl} target="_blank" rel="noopener noreferrer" className="block">
              <Card className="hover:border-primary transition-colors duration-200 flex flex-col h-full">
                <CardHeader className="flex-grow">
                  <CardTitle className="truncate">{doc.name}</CardTitle>
                  <CardDescription>
                    Creado: {new Date(doc.created).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-end items-center gap-2">
                  {template?.preview && template.preview === doc.id && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsPreviewModalOpen(true);
                      }}
                      title="Vista Previa"
                      className="cursor-pointer hidden md:inline-flex"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => handleCopy(e, window.location.origin + pdfUrl)}
                    title="Copy Link"
                    className="cursor-pointer"
                  >
                    <Clipboard className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    title="Edit"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `/templates/${template?.id}/${doc.id}/edit`; }}
                    className="cursor-pointer"
                  >
                    <FilePenLine className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDocToDelete(doc);
                    }}
                    title="Delete"
                    className="cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          )
        })}
      </div>
    );
  }

  const renderFormView = () => {
    if (loading) {
      return (
        <div className="mt-8 max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-32 w-full" />
          <div className="flex justify-end gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      );
    }
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
              <Button onClick={handleSaveDocument} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar Documento'}
              </Button>
            </div>
          </div>
          <div
            className="border rounded-lg p-4 bg-white text-black hiddden md:block"
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
        <div className="space-y-2 mb-4">
          <Label htmlFor="newDocName">Nombre del Nuevo Documento</Label>
          <Input
            id="newDocName"
            value={newDocumentName}
            onChange={(e) => setNewDocumentName(e.target.value)}
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
                  className="min-h-[200px] max-h-[200px] font-mono"
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

        <FormRenderer schema={template.schema} initialData={currentFormData || {}} onSubmit={handleFormSubmit} />
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
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

      {docToDelete && (
        <Dialog open={!!docToDelete} onOpenChange={() => setDocToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Borrado</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que quieres borrar el documento <strong>{docToDelete.name}</strong>? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setDocToDelete(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={() => handleDelete(docToDelete)}>Borrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Preview Document Dialog */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="hidden md:block">Vista Previa del Documento</DialogTitle>
            <DialogDescription className="hidden md:block">
              Aquí puedes ver la vista previa del documento generado para esta plantilla.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-auto border rounded-lg p-4 bg-white text-black hidden md:block">
            {previewDocumentHtml ? (
              <div dangerouslySetInnerHTML={{ __html: previewDocumentHtml }} />
            ) : (
              <p>Cargando vista previa...</p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cerrar
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
